"""
Quota Hire — Inline Email Templates

All templates:
  • Force light-mode only (color-scheme: only light) — never inverts on dark-mode phones
  • Embed the exact Quota Hire SVG logo (briefcase rings) inline
  • Are fully responsive on mobile (max-width 600px)
  • Use the brand green palette consistently throughout
"""

import json
import urllib.request
import urllib.error
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# SHARED LOGO SVG  (inline — no external URL dependency)
# ─────────────────────────────────────────────────────────────────────────────

LOGO_SVG = """
<svg width="56" height="56" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
     style="display:block;" aria-label="Quota Hire Logo">
  <!-- Outer dark green ring -->
  <circle cx="50" cy="50" r="48" fill="#1A6515"/>
  <!-- Lime green ring -->
  <circle cx="50" cy="50" r="35" fill="#5DDE2A"/>
  <!-- Centre dark green disc -->
  <circle cx="50" cy="50" r="21" fill="#1A6515"/>
  <!-- Briefcase body -->
  <rect x="39" y="46" width="22" height="14" rx="2.5" fill="white"/>
  <!-- Briefcase handle arch -->
  <path d="M43.5 46 L43.5 42 Q43.5 40 50 40 Q56.5 40 56.5 42 L56.5 46"
        stroke="white" stroke-width="2.8" fill="none"
        stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Horizontal divider -->
  <rect x="39" y="52.5" width="22" height="2" rx="1" fill="#1A6515"/>
  <!-- Centre clasp -->
  <rect x="47" y="51" width="6" height="5.5" rx="1.5" fill="#1A6515"/>
</svg>
"""


# ─────────────────────────────────────────────────────────────────────────────
# SHARED HTML SHELL  (used by every template)
# ─────────────────────────────────────────────────────────────────────────────
# NOTE: all inline CSS uses !important and explicit colours so email clients
#       and dark-mode overrides cannot change them.

def _build_email(*, title: str, preview_text: str, body_rows: str) -> str:
    """
    Wraps a block of <tr> rows inside the standard Quota Hire email shell.
    The shell provides: light-mode lock, logo header, responsive layout, footer.
    """
    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Force light mode in ALL email clients that support it -->
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>{title}</title>
  <style>
    /* ── Force light mode — override any dark-mode email client ── */
    :root {{ color-scheme: light only; }}

    /* ── Reset ── */
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }}

    body {{
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f0faf0 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   'Helvetica Neue', Arial, sans-serif !important;
      color: #0f172a !important;
      -webkit-font-smoothing: antialiased;
    }}

    /* ── Outer wrapper ── */
    .email-wrapper {{
      width: 100% !important;
      background-color: #f0faf0 !important;
      padding: 40px 16px !important;
    }}

    /* ── Card ── */
    .email-card {{
      background-color: #ffffff !important;
      max-width: 600px !important;
      margin: 0 auto !important;
      border-radius: 20px !important;
      overflow: hidden !important;
      border: 1px solid #c8ecc4 !important;
      box-shadow: 0 8px 30px rgba(26, 101, 21, 0.10) !important;
    }}

    /* ── Header ── */
    .email-header {{
      background: linear-gradient(135deg, #1A6515 0%, #2a8a1f 50%, #15750a 100%) !important;
      padding: 36px 40px !important;
      text-align: center !important;
    }}
    .email-header-logo {{
      display: inline-block !important;
      margin-bottom: 14px !important;
    }}
    .email-header-name {{
      font-size: 22px !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      letter-spacing: -0.3px !important;
      margin: 0 !important;
      line-height: 1.2 !important;
    }}
    .email-header-tagline {{
      font-size: 13px !important;
      color: rgba(255,255,255,0.75) !important;
      margin: 6px 0 0 !important;
    }}

    /* ── Body content ── */
    .email-body {{
      padding: 40px 44px !important;
      background-color: #ffffff !important;
    }}
    .email-h2 {{
      font-size: 22px !important;
      font-weight: 700 !important;
      color: #0f172a !important;
      margin: 0 0 16px !important;
      line-height: 1.3 !important;
    }}
    .email-p {{
      font-size: 15px !important;
      line-height: 1.65 !important;
      color: #374151 !important;
      margin: 0 0 18px !important;
    }}
    .email-p b {{
      color: #0f172a !important;
      font-weight: 700 !important;
    }}

    /* ── CTA Button ── */
    .email-btn-wrap {{
      text-align: center !important;
      margin: 32px 0 !important;
    }}
    .email-btn {{
      display: inline-block !important;
      background: linear-gradient(to right, #1A6515, #15750a) !important;
      color: #ffffff !important;
      text-decoration: none !important;
      font-size: 15px !important;
      font-weight: 700 !important;
      padding: 14px 36px !important;
      border-radius: 50px !important;
      letter-spacing: 0.3px !important;
      box-shadow: 0 6px 20px rgba(26, 101, 21, 0.30) !important;
    }}

    /* ── Info Box (job title, etc.) ── */
    .email-info-box {{
      background-color: #f0faf0 !important;
      border-left: 4px solid #1A6515 !important;
      border-radius: 8px !important;
      padding: 16px 20px !important;
      margin: 0 0 20px !important;
    }}
    .email-info-box p {{
      font-size: 14px !important;
      color: #1A6515 !important;
      font-weight: 600 !important;
      margin: 0 !important;
    }}

    /* ── Link fallback ── */
    .email-link-fallback {{
      font-size: 12px !important;
      color: #94a3b8 !important;
      word-break: break-all !important;
      background-color: #f8fafc !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      padding: 14px 16px !important;
      margin-top: 24px !important;
    }}
    .email-link-fallback a {{
      color: #1A6515 !important;
      font-weight: 600 !important;
      text-decoration: underline !important;
    }}

    /* ── Divider ── */
    .email-divider {{
      border: none !important;
      border-top: 1px solid #e5f3e2 !important;
      margin: 0 !important;
    }}

    /* ── Footer ── */
    .email-footer {{
      background-color: #f8fdf7 !important;
      padding: 24px 40px !important;
      text-align: center !important;
      border-top: 1px solid #e5f3e2 !important;
    }}
    .email-footer p {{
      font-size: 12px !important;
      color: #6b7280 !important;
      margin: 0 0 4px !important;
      line-height: 1.5 !important;
    }}
    .email-footer a {{
      color: #1A6515 !important;
      text-decoration: none !important;
    }}

    /* ── Responsive ── */
    @media only screen and (max-width: 600px) {{
      .email-wrapper {{ padding: 24px 8px !important; }}
      .email-header {{ padding: 28px 20px !important; }}
      .email-body {{ padding: 28px 24px !important; }}
      .email-footer {{ padding: 20px 24px !important; }}
      .email-h2 {{ font-size: 19px !important; }}
      .email-btn {{ font-size: 14px !important; padding: 13px 28px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0faf0;">
<!--[if mso]>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td>
<![endif]-->
<div class="email-wrapper" style="width:100%;background-color:#f0faf0;padding:40px 16px;">
  <table class="email-card" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#ffffff;max-width:600px;margin:0 auto;
                border-radius:20px;overflow:hidden;border:1px solid #c8ecc4;
                box-shadow:0 8px 30px rgba(26,101,21,0.10);">

    <!-- ── HEADER ── -->
    <tr>
      <td class="email-header"
          style="background:linear-gradient(135deg,#1A6515 0%,#2a8a1f 50%,#15750a 100%);
                 padding:36px 40px;text-align:center;">
        <!-- Logo mark -->
        <div class="email-header-logo" style="display:inline-block;margin-bottom:14px;">
          {LOGO_SVG}
        </div>
        <p class="email-header-name"
           style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;
                  margin:0;line-height:1.2;font-family:-apple-system,BlinkMacSystemFont,
                  'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">Quota Hire</p>
        <p class="email-header-tagline"
           style="font-size:13px;color:rgba(255,255,255,0.75);margin:6px 0 0;
                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,
                  'Helvetica Neue',Arial,sans-serif;">The Premier Sales Recruitment Network</p>
      </td>
    </tr>

    <!-- ── BODY ROWS ── -->
    {body_rows}

    <!-- ── FOOTER ── -->
    <tr>
      <td class="email-footer"
          style="background-color:#f8fdf7;padding:24px 40px;text-align:center;
                 border-top:1px solid #e5f3e2;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 4px;line-height:1.5;
                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,
                  'Helvetica Neue',Arial,sans-serif;">
          &copy; 2026 Quota Hire. All rights reserved.
        </p>
        <p style="font-size:12px;color:#6b7280;margin:0;line-height:1.5;
                  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,
                  'Helvetica Neue',Arial,sans-serif;">
          You received this email because you have an account on
          <a href="https://quotahire.org" style="color:#1A6515;text-decoration:none;">quotahire.org</a>
        </p>
      </td>
    </tr>

  </table>
</div>
<!--[if mso]>
</td></tr></table>
<![endif]-->
</body>
</html>"""


def _body_row(html_content: str) -> str:
    """Wraps content in a standard body <tr><td> with correct styles."""
    return f"""
    <tr>
      <td class="email-body"
          style="padding:40px 44px;background-color:#ffffff;
                 font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,
                 'Helvetica Neue',Arial,sans-serif;">
        {html_content}
      </td>
    </tr>"""


def _info_box(text: str) -> str:
    return (
        f'<div class="email-info-box" style="background-color:#f0faf0;border-left:4px solid #1A6515;'
        f'border-radius:8px;padding:16px 20px;margin:0 0 20px;">'
        f'<p style="font-size:14px;color:#1A6515;font-weight:600;margin:0;">{text}</p></div>'
    )


def _cta_btn(href: str, label: str) -> str:
    return (
        f'<div class="email-btn-wrap" style="text-align:center;margin:32px 0;">'
        f'<a href="{href}" class="email-btn" '
        f'style="display:inline-block;background:linear-gradient(to right,#1A6515,#15750a);'
        f'color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;'
        f'padding:14px 36px;border-radius:50px;letter-spacing:0.3px;'
        f'box-shadow:0 6px 20px rgba(26,101,21,0.30);">{label}</a></div>'
    )


def _link_fallback(url: str) -> str:
    return (
        f'<div class="email-link-fallback" style="font-size:12px;color:#94a3b8;word-break:break-all;'
        f'background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;'
        f'padding:14px 16px;margin-top:24px;">'
        f'If the button doesn\'t work, copy and paste this link into your browser:<br><br>'
        f'<a href="{url}" style="color:#1A6515;font-weight:600;text-decoration:underline;">{url}</a>'
        f'</div>'
    )


def _p(text: str) -> str:
    return (
        f'<p class="email-p" style="font-size:15px;line-height:1.65;color:#374151;margin:0 0 18px;">'
        f'{text}</p>'
    )


def _h2(text: str) -> str:
    return (
        f'<h2 class="email-h2" style="font-size:22px;font-weight:700;color:#0f172a;'
        f'margin:0 0 16px;line-height:1.3;">{text}</h2>'
    )


def _sign_off() -> str:
    return _p('Best regards,<br><b>The Quota Hire Team</b>')


# ─────────────────────────────────────────────────────────────────────────────
# 1. VERIFICATION EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_verification_email_html(user: str, redirect: str) -> str:
    """Email sent immediately after registration — asks the user to verify."""
    content = (
        _h2("Verify your email address") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Welcome to Quota Hire — the premier sales recruitment network. "
           "Before you can access your account, please verify your email address "
           "by clicking the button below.") +
        _cta_btn(redirect, "Verify My Email") +
        _p("This link will expire in <b>24 hours</b>. If you did not create an account, "
           "you can safely ignore this email.") +
        _sign_off() +
        _link_fallback(redirect)
    )
    return _build_email(
        title="Verify your email — Quota Hire",
        preview_text=f"Hi {user}, please verify your email to get started on Quota Hire.",
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 2. PASSWORD RESET EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_recovery_email_html(user: str, redirect: str) -> str:
    """Password reset link email."""
    content = (
        _h2("Password Reset Request") +
        _p(f"Hi <b>{user}</b>,") +
        _p("We received a request to reset the password for your Quota Hire account. "
           "Click the button below to choose a new password. "
           "This link will expire in <b>10 minutes</b>.") +
        _cta_btn(redirect, "Reset My Password") +
        _p("If you did not request a password reset, you can safely ignore this email. "
           "Your account remains secure.") +
        _sign_off() +
        _link_fallback(redirect)
    )
    return _build_email(
        title="Reset your password — Quota Hire",
        preview_text="Reset your Quota Hire password. This link expires in 10 minutes.",
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3. WELCOME EMAIL  (sent after email is verified)
# ─────────────────────────────────────────────────────────────────────────────

def get_welcome_email_html(user: str) -> str:
    """
    Sent once the user verifies their email address.
    Encourages them to complete their profile.
    """
    content = (
        _h2("Welcome to Quota Hire! 🎉") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Your email has been verified and your account is now active. "
           "We're thrilled to have you as part of the Quota Hire network — "
           "the home of elite sales professionals.") +
        _p("To get the full experience and be visible to top companies (or find the "
           "best talent), take a few minutes to <b>complete your profile</b>. "
           "A complete profile significantly increases your chances of success.") +
        _cta_btn("https://quotahire.org/dashboard", "Complete My Profile") +
        _p("If you have any questions or need help getting started, our team is always "
           "here for you.") +
        _sign_off()
    )
    return _build_email(
        title="Welcome to Quota Hire!",
        preview_text=f"Hi {user}, your account is verified. Complete your profile to get started!",
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 4. JOB SUBMITTED EMAIL  (sent to company immediately after posting a job)
# ─────────────────────────────────────────────────────────────────────────────

def get_job_submitted_email_html(user: str, job_title: str) -> str:
    """Confirms to the company that their job has been received and is under review."""
    content = (
        _h2("Your job has been submitted!") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Thank you for posting on Quota Hire. Your job listing has been received "
           "and is currently under review by our team.") +
        _info_box(f"&#128188; {job_title}") +
        _p("Once approved, your listing will go live on the platform and start "
           "attracting qualified sales candidates. This typically happens within "
           "<b>a few hours</b>.") +
        _p("You can track the status of your listing at any time from your company dashboard.") +
        _cta_btn("https://quotahire.org/dashboard", "Go to Dashboard") +
        _sign_off()
    )
    return _build_email(
        title="Job submitted for review — Quota Hire",
        preview_text=f"Your job '{job_title}' has been submitted and is under review.",
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 5. JOB APPROVED EMAIL  (sent to company after admin approval)
# ─────────────────────────────────────────────────────────────────────────────

def get_job_approved_email_html(user: str, job_title: str) -> str:
    """Notifies the company their job is now live."""
    content = (
        _h2("Your job is now live! ✅") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Great news! Your job listing has been reviewed and <b>approved</b>. "
           "It is now live on the Quota Hire platform and visible to thousands of "
           "qualified sales professionals.") +
        _info_box(f"&#128994; {job_title} — Now Live") +
        _p("Sit back while the applications start coming in. You can review, "
           "manage, and respond to applicants directly from your dashboard.") +
        _cta_btn("https://quotahire.org/dashboard", "View Applications") +
        _sign_off()
    )
    return _build_email(
        title="Your job is live — Quota Hire",
        preview_text=f"Your job '{job_title}' has been approved and is now live on Quota Hire!",
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 6. JOB REJECTED EMAIL  (sent to company after admin rejection)
# ─────────────────────────────────────────────────────────────────────────────

def get_job_rejected_email_html(user: str, job_title: str) -> str:
    """Notifies the company their job was not approved."""
    content = (
        _h2("Job listing update") +
        _p(f"Hi <b>{user}</b>,") +
        _p("After review, we were unfortunately unable to approve your recent job listing. "
           "This may be due to incomplete information, formatting issues, or content "
           "that doesn't meet our platform guidelines.") +
        _info_box(f"&#128308; {job_title} — Needs Revision") +
        _p("Please review our posting guidelines and update your listing accordingly. "
           "You're welcome to submit a revised version — we're happy to work with you "
           "to get your role in front of the right candidates.") +
        _p("If you have any questions or believe this was an error, please contact our "
           'support team at <a href="mailto:support.qutahire@gmail.com" '
           'style="color:#1A6515;font-weight:600;">support.qutahire@gmail.com</a>.') +
        _cta_btn("https://quotahire.org/dashboard", "Go to Dashboard") +
        _sign_off()
    )
    return _build_email(
        title="Your job listing needs revision — Quota Hire",
        preview_text=f"Your job '{job_title}' needs some changes before it can go live.",
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 7. APPLICATION CONFIRMATION EMAIL  (sent to employee after applying)
# ─────────────────────────────────────────────────────────────────────────────

def get_application_confirmed_email_html(user: str, job_title: str) -> str:
    """Confirms to the employee that their application was sent successfully."""
    content = (
        _h2("Application submitted! Good luck! 🚀") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Your application has been sent successfully. Fingers crossed! "
           "The hiring team will review your profile and be in touch if you're a great fit.") +
        _info_box(f"&#128188; {job_title}") +
        _p("In the meantime, keep your profile sharp — a complete, up-to-date profile "
           "significantly improves your chances. You can also track your application "
           "status from your dashboard at any time.") +
        _cta_btn("https://quotahire.org/dashboard", "Track My Applications") +
        _p("Wishing you the very best of luck! &#127919;") +
        _sign_off()
    )
    return _build_email(
        title="Application submitted — Quota Hire",
        preview_text=f"Your application for '{job_title}' has been sent. Good luck!",
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 8. GENERIC NOTIFICATION MIRROR EMAIL
#    (mirrors any in-app notification to the user's email)
# ─────────────────────────────────────────────────────────────────────────────

def get_notification_email_html(user: str, title: str, message: str) -> str:
    """
    Wraps any in-app notification as a branded email.
    Used to mirror application status changes, etc.
    """
    content = (
        _h2(title) +
        _p(f"Hi <b>{user}</b>,") +
        _p(message) +
        _cta_btn("https://quotahire.org/dashboard", "Go to Dashboard") +
        _sign_off()
    )
    return _build_email(
        title=f"{title} — Quota Hire",
        preview_text=message[:100],
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 9. NEWSLETTER EMAIL  (admin-composed, sent via Django Admin)
# ─────────────────────────────────────────────────────────────────────────────

def get_newsletter_email_html(subject: str, plain_body: str) -> str:
    """
    Wraps a plain-text newsletter (typed by admin) in the brand template.
    Line breaks in the plain text become paragraph breaks in the email.
    """
    # Convert plain text to HTML paragraphs
    paragraphs = [p.strip() for p in plain_body.strip().split('\n') if p.strip()]
    body_html = ''.join(_p(para) for para in paragraphs)

    content = (
        _h2(subject) +
        body_html +
        _cta_btn("https://quotahire.org", "Visit Quota Hire") +
        _sign_off()
    )
    return _build_email(
        title=f"{subject} — Quota Hire",
        preview_text=paragraphs[0][:100] if paragraphs else subject,
        body_rows=_body_row(content),
    )


# ─────────────────────────────────────────────────────────────────────────────
# COURIER API SENDER
# ─────────────────────────────────────────────────────────────────────────────

def send_courier_email(to_email: str, subject: str, text_content: str, html_content: str) -> bool:
    """
    Sends an email via the Courier REST API.
    Returns True on success, raises Exception on failure.
    """
    url = "https://api.courier.com/send"

    payload = {
        "message": {
            "to": {
                "email": to_email
            },
            "content": {
                "title": subject,
                "version": "2022-01-01",
                "elements": [
                    {
                        "type": "html",
                        "content": html_content
                    }
                ]
            },
            "routing": {
                "method": "all",
                "channels": ["email"]
            }
        }
    }

    headers = {
        "Authorization": f"Bearer {settings.COURIER_AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read()
            logger.info(f"Courier email sent to {to_email}: {res_data}")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        logger.error(f"Courier API error: {e.code} - {error_body}")
        raise Exception(f"Courier API failed: {error_body}")
    except Exception as e:
        logger.error(f"Failed to send Courier email to {to_email}: {str(e)}")
        raise e
