"""
Quota Hire — Expo Push Notification Utility
============================================
Sends push notifications to user devices via the Expo Push API.

Key facts:
  - Completely FREE — no API key, no Paystack-style credentials needed
  - Expo's servers handle delivery to both Apple APNs and Google FCM
  - The only requirement is a valid ExponentPushToken stored on the user
  - All failures are logged and swallowed — never crashes the calling request

Usage:
    from .push_utils import send_push_notification

    send_push_notification(
        user=some_user,
        title="Your Application is Under Review",
        body="The hiring team is reviewing your application for Senior AE.",
        data={"type": "application_update", "status": "under_review"},
    )
"""

import json
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push_notification(
    user,
    title: str,
    body: str,
    data: dict = None,
) -> None:
    """
    Send a push notification to a single user's registered device.

    Args:
        user:  CustomUser instance — must have a push_token field.
               Silently skips if user is None or has no token.
        title: Short notification title (no emojis per product spec).
        body:  Notification body text shown under the title.
        data:  Optional dict of extra payload sent alongside the notification.
               The mobile app reads this to navigate to the correct screen
               when the user taps the notification banner.

    Returns:
        None — all errors are logged, never raised.
    """
    if not user:
        return

    token = getattr(user, "push_token", None)
    if not token:
        return

    token = token.strip()

    # Expo push tokens always start with ExponentPushToken[
    # Reject anything else (FCM raw tokens, stale data, etc.)
    if not token.startswith("ExponentPushToken["):
        logger.debug(
            "Skipping push for user %s — token format invalid: %.30s",
            user.pk,
            token,
        )
        return

    message = {
        "to": token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": data or {},
        "channelId": "default",  # Android notification channel (matches mobile setup)
    }

    try:
        req = urllib.request.Request(
            EXPO_PUSH_URL,
            data=json.dumps(message).encode("utf-8"),
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8")

        result = json.loads(raw)

        # Expo returns a "ticket" per message — inspect it for delivery errors
        tickets = result.get("data", [])
        if isinstance(tickets, list):
            for ticket in tickets:
                if not isinstance(ticket, dict):
                    continue
                if ticket.get("status") == "error":
                    err_type = ticket.get("details", {}).get("error", "UNKNOWN")
                    logger.warning(
                        "Expo push delivery error for user %s: %s — %s",
                        user.pk,
                        err_type,
                        ticket.get("message", ""),
                    )
                    # DeviceNotRegistered means user uninstalled the app.
                    # Clear the stale token so we stop trying to deliver to it.
                    if err_type == "DeviceNotRegistered":
                        _clear_push_token(user)

    except urllib.error.URLError as exc:
        # Network failure reaching Expo's servers — non-fatal, log and continue
        logger.warning(
            "Push notification network error for user %s: %s",
            user.pk,
            exc,
        )
    except Exception as exc:  # noqa: BLE001
        # Catch-all — push must never crash the calling view or signal
        logger.warning(
            "Push notification unexpected error for user %s: %s",
            user.pk,
            exc,
        )


def _clear_push_token(user) -> None:
    """
    Remove a stale push token when Expo reports the device is no longer
    registered (i.e. user uninstalled the app).  Prevents wasting API
    calls on every subsequent notification attempt.
    """
    try:
        type(user).objects.filter(pk=user.pk).update(push_token=None)
        logger.info("Cleared stale push token for user %s", user.pk)
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Could not clear push token for user %s: %s",
            user.pk,
            exc,
        )
