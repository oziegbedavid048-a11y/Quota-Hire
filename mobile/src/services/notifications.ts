/**
 * Quota Hire — Push Notification Service
 * ========================================
 * Handles everything needed to get an Expo push token onto the device
 * and register it with the backend so the Django signals can push to it.
 *
 * Call registerForPushNotificationsAsync() once after every login and
 * every time the app opens with an existing session (inside _layout.tsx).
 *
 * The Expo Push API is 100% free — no API key, no Firebase credentials
 * needed in the JS layer. Expo's servers handle APNs (iOS) and FCM
 * (Android) on your behalf.
 */

import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiFetch } from "./api";

// Try to require expo-notifications, otherwise stub it for Expo Go (where SDK 53+ removed native remote notifications)
let Notifications: any = null;
let isNotificationsSupported = false;

try {
  Notifications = require("expo-notifications");
  isNotificationsSupported = true;
} catch (e) {
  console.warn(
    "[expo-notifications] Native push notification module is not supported in the Expo Go sandbox (SDK 53+). Push notifications are disabled in this session. Build a custom Development Client to test notifications."
  );

  // Stub the Notifications object to prevent crashes
  Notifications = {
    setNotificationHandler: () => {},
    setNotificationChannelAsync: async () => {},
    getPermissionsAsync: async () => ({ status: "denied" }),
    requestPermissionsAsync: async () => ({ status: "denied" }),
    getExpoPushTokenAsync: async () => ({ data: "" }),
    addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
    AndroidImportance: {
      MAX: 4,
      HIGH: 3,
      DEFAULT: 2,
      LOW: 1,
      MIN: 0,
      NONE: -1,
    },
  };
}

// ── Foreground notification behaviour ────────────────────────────────────────
// Show alert + play sound + update badge even when the app is open in the
// foreground (default Expo behaviour is to swallow foreground notifications).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Main registration function ────────────────────────────────────────────────

/**
 * Requests push-notification permission, retrieves the Expo push token,
 * and registers it with the Quota Hire backend.
 *
 * Safe to call multiple times — Expo deduplicates token fetches and the
 * backend endpoint is idempotent (it just updates the stored token).
 *
 * Returns the token string on success, or null if:
 *   - running on a simulator / emulator (not a physical device)
 *   - user denied permission
 *   - EAS projectId is missing from app config
 *   - any network / API error
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!isNotificationsSupported) {
    console.log("[Push] Skipping — notifications not supported in this client (Expo Go)");
    return null;
  }

  // Push notifications only work on physical devices.
  // Simulators/emulators will always return null here.
  if (!Device.isDevice) {
    console.log("[Push] Skipping — not a physical device (simulator/emulator)");
    return null;
  }

  // ── Android: create the notification channel ─────────────────────────────
  // Android 8+ requires a channel before any notification can appear.
  // We create it here so it exists before the first push arrives.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Quota Hire",
      description: "Job updates, application status changes and alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#15750a", // Quota Hire brand green
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    });
  }

  // ── Request permission ────────────────────────────────────────────────────
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[Push] Permission denied by user — no push token fetched");
    return null;
  }

  // ── Get the Expo push token ───────────────────────────────────────────────
  // The projectId ties this token to your specific EAS project.
  // It is read from app.json → extra.eas.projectId.
  const projectId: string | undefined =
    Constants.expoConfig?.extra?.eas?.projectId;

  if (!projectId) {
    console.warn(
      "[Push] No EAS projectId found in app.json extra.eas.projectId",
    );
    return null;
  }

  let token: string;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    token = tokenData.data;
    console.log("[Push] Token obtained:", token.slice(0, 40) + "...");
  } catch (err) {
    console.warn("[Push] Failed to obtain Expo push token:", err);
    return null;
  }

  // ── Register token with the backend ──────────────────────────────────────
  await _sendTokenToBackend(token);

  return token;
}

// ── Backend registration ──────────────────────────────────────────────────────

async function _sendTokenToBackend(token: string): Promise<void> {
  try {
    await apiFetch("/notifications/push-token/", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    console.log("[Push] Token successfully registered with backend");
  } catch (err) {
    // Non-critical failure — the token is still valid on-device.
    // The next app open will retry registration automatically.
    console.warn("[Push] Could not register token with backend:", err);
  }
}

// ── Navigation data helpers ───────────────────────────────────────────────────
// These types mirror the `data` objects sent from push_utils.py so the
// notification tap handler in _layout.tsx can navigate to the right screen.

export type PushNotificationData =
  | { type: "application_submitted"; job_id: string }
  | { type: "application_update"; status: string; job_id: string }
  | { type: "job_submitted"; job_id: string }
  | { type: "job_approved"; job_id: string }
  | { type: "job_rejected"; job_id: string }
  | { type: "new_application"; job_id: string };

/**
 * Given the data payload from a tapped push notification, returns the
 * Expo Router path the app should navigate to.
 */
export function getNavigationPathFromPush(
  data: PushNotificationData | Record<string, unknown>,
): string {
  if (!data || !data.type) return "/notifications";

  switch (data.type) {
    // Employee: any application status update → go to tracker
    case "application_submitted":
    case "application_update":
      return "/tracker";

    // Company: job status updates → go to my jobs (tracker tab shows company jobs)
    case "job_submitted":
    case "job_approved":
    case "job_rejected":
      return "/tracker";

    // Company: new applicant → go to applicants (cv tab shows company applicants)
    case "new_application":
      return "/cv";

    default:
      return "/notifications";
  }
}

// Re-export so _layout.tsx only needs one import
export { Notifications };
