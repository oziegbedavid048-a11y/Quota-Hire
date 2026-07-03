"""
Quota Hire — Plain & Professional Email Templates

- Plain, clean design (black and white with colored button)
- Fully responsive on mobile
- No emojis, highly professional
- Uses raw HTML payload in Courier to avoid the 'Hello World' default brand wrapper
"""

import json
import urllib.request
import urllib.error
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# SHARED LOGO SVG  (inline)
# ─────────────────────────────────────────────────────────────────────────────
# Made the logo slightly smaller/more subtle for a professional look

LOGO_SVG = """
<svg width="44" height="44" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
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
# SHARED HTML SHELL
# ─────────────────────────────────────────────────────────────────────────────
# Purely plain text on white background (or letting the client invert to black).
# No forced background colors to allow natural dark mode behaviour.

def _build_email(*, title: str, body_rows: str) -> str:
    """
    Wraps a block of <tr> rows inside a plain, highly professional email shell.
    """
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    /* Reset */
    body, table, td, a {{ -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }}
    table, td {{ mso-table-lspace: 0pt; mso-table-rspace: 0pt; }}
    img {{ border: 0; outline: none; text-decoration: none; }}

    body {{
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }}

    .email-container {{
      max-width: 600px;
      margin: 0 auto;
      padding: 30px 20px;
    }}

    .header {{
      padding-bottom: 20px;
      border-bottom: 1px solid #eaeaea;
      margin-bottom: 30px;
    }}
    
    .logo-container {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    
    .brand-name {{
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.3px;
      color: #111111;
      margin: 0;
    }}

    .content-area {{
      padding-bottom: 40px;
    }}

    h2 {{
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px;
      color: #111111;
    }}

    p {{
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 20px;
      color: #333333;
    }}

    .info-box {{
      padding: 16px 20px;
      border: 1px solid #eaeaea;
      border-radius: 6px;
      background-color: #fafafa;
      margin-bottom: 24px;
    }}

    .info-box p {{
      margin: 0;
      font-weight: 500;
      color: #111111;
    }}

    .btn-wrap {{
      margin: 30px 0;
    }}

    .btn {{
      display: inline-block;
      background: linear-gradient(to right, #1A6515, #124d10);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 4px;
    }}

    .link-fallback {{
      font-size: 12px;
      color: #777777;
      word-break: break-all;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px dashed #eaeaea;
    }}

    .link-fallback a {{
      color: #1A6515;
    }}

    .footer {{
      padding-top: 20px;
      border-top: 1px solid #eaeaea;
      font-size: 12px;
      color: #777777;
      line-height: 1.5;
    }}
    
    .footer a {{
      color: #555555;
    }}

    /* Dark Mode - letting the client naturally invert where appropriate */
    @media (prefers-color-scheme: dark) {{
      .brand-name, h2, .info-box p {{ color: #ffffff !important; }}
      p {{ color: #e5e5e5 !important; }}
      .header, .content-area, .footer {{ background-color: transparent !important; }}
      .info-box {{ background-color: #222222 !important; border-color: #333333 !important; }}
      .header, .link-fallback, .footer {{ border-color: #333333 !important; }}
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle" width="54">
            {LOGO_SVG}
          </td>
          <td valign="middle">
            <h1 class="brand-name">Quota Hire</h1>
          </td>
        </tr>
      </table>
    </div>

    <div class="content-area">
      {body_rows}
    </div>

    <div class="footer">
      <p>
        &copy; 2026 Quota Hire. All rights reserved.<br>
        You received this email because you have an account on <a href="https://quotahire.org">quotahire.org</a>.
      </p>
    </div>
  </div>
</body>
</html>"""


def _info_box(text: str) -> str:
    return f'<div class="info-box"><p>{text}</p></div>'


def _cta_btn(href: str, label: str) -> str:
    return (
        f'<div class="btn-wrap"><a href="{href}" class="btn">{label}</a></div>'
    )


def _link_fallback(url: str) -> str:
    return (
        f'<div class="link-fallback">'
        f'If the button does not work, copy and paste this link into your browser:<br><br>'
        f'<a href="{url}">{url}</a></div>'
    )


def _p(text: str) -> str:
    return f'<p>{text}</p>'


def _h2(text: str) -> str:
    return f'<h2>{text}</h2>'


def _sign_off() -> str:
    return _p('Best regards,<br><b>The Quota Hire Team</b>')


# ─────────────────────────────────────────────────────────────────────────────
# 1. VERIFICATION EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_verification_email_html(user: str, redirect: str) -> str:
    content = (
        _h2("Verify your email address") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Welcome to Quota Hire. Before you can access your account, please verify your email address by clicking the button below.") +
        _cta_btn(redirect, "Verify Email") +
        _p("This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.") +
        _sign_off() +
        _link_fallback(redirect)
    )
    return _build_email(title="Verify your email — Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# 2. PASSWORD RESET EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_recovery_email_html(user: str, redirect: str) -> str:
    content = (
        _h2("Password Reset Request") +
        _p(f"Hi <b>{user}</b>,") +
        _p("We received a request to reset the password for your Quota Hire account. Click the button below to set a new password. This link will expire in 10 minutes.") +
        _cta_btn(redirect, "Reset Password") +
        _p("If you did not request a password reset, you can safely ignore this email.") +
        _sign_off() +
        _link_fallback(redirect)
    )
    return _build_email(title="Reset your password — Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# 3. WELCOME EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_welcome_email_html(user: str) -> str:
    content = (
        _h2("Welcome to Quota Hire") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Your email has been verified and your account is now active. We are thrilled to have you as part of the Quota Hire network.") +
        _p("To get the full experience and increase your visibility, please take a moment to complete your profile.") +
        _cta_btn("https://quotahire.org/dashboard", "Complete Profile") +
        _sign_off()
    )
    return _build_email(title="Welcome to Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# 4. JOB SUBMITTED EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_job_submitted_email_html(user: str, job_title: str) -> str:
    content = (
        _h2("Job Listing Submitted") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Your job listing has been received and is currently under review by our team.") +
        _info_box(job_title) +
        _p("Once approved, your listing will go live on the platform. This typically happens within a few hours. You can track the status from your company dashboard.") +
        _cta_btn("https://quotahire.org/dashboard", "Go to Dashboard") +
        _sign_off()
    )
    return _build_email(title="Job submitted for review — Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# 5. JOB APPROVED EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_job_approved_email_html(user: str, job_title: str) -> str:
    content = (
        _h2("Job Listing Approved") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Your job listing has been reviewed and approved. It is now live on the Quota Hire platform.") +
        _info_box(f"{job_title} — Now Live") +
        _p("You can review, manage, and respond to applicants directly from your dashboard.") +
        _cta_btn("https://quotahire.org/dashboard", "View Dashboard") +
        _sign_off()
    )
    return _build_email(title="Your job is live — Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# 6. JOB REJECTED EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_job_rejected_email_html(user: str, job_title: str) -> str:
    content = (
        _h2("Job Listing Update") +
        _p(f"Hi <b>{user}</b>,") +
        _p("After review, we were unfortunately unable to approve your recent job listing. This may be due to incomplete information or content that does not meet our guidelines.") +
        _info_box(f"{job_title} — Needs Revision") +
        _p("Please review our posting guidelines and update your listing accordingly. You can submit a revised version from your dashboard.") +
        _cta_btn("https://quotahire.org/dashboard", "Go to Dashboard") +
        _sign_off()
    )
    return _build_email(title="Job listing needs revision — Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# 7. APPLICATION CONFIRMATION EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_application_confirmed_email_html(user: str, job_title: str) -> str:
    content = (
        _h2("Application Submitted") +
        _p(f"Hi <b>{user}</b>,") +
        _p("Your application has been sent successfully. The hiring team will review your profile and be in touch if you are a good fit.") +
        _info_box(job_title) +
        _p("You can track your application status from your dashboard at any time.") +
        _cta_btn("https://quotahire.org/dashboard", "Track Application") +
        _sign_off()
    )
    return _build_email(title="Application submitted — Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# 8. GENERIC NOTIFICATION MIRROR EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_notification_email_html(user: str, title: str, message: str) -> str:
    content = (
        _h2(title) +
        _p(f"Hi <b>{user}</b>,") +
        _p(message) +
        _cta_btn("https://quotahire.org/dashboard", "Go to Dashboard") +
        _sign_off()
    )
    return _build_email(title=f"{title} — Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# 9. NEWSLETTER EMAIL
# ─────────────────────────────────────────────────────────────────────────────

def get_newsletter_email_html(subject: str, plain_body: str) -> str:
    paragraphs = [p.strip() for p in plain_body.strip().split('\n') if p.strip()]
    body_html = ''.join(_p(para) for para in paragraphs)

    content = (
        _h2(subject) +
        body_html +
        _cta_btn("https://quotahire.org", "Visit Quota Hire") +
        _sign_off()
    )
    return _build_email(title=f"{subject} — Quota Hire", body_rows=content)


# ─────────────────────────────────────────────────────────────────────────────
# COURIER API SENDER
# ─────────────────────────────────────────────────────────────────────────────

def send_courier_email(to_email: str, subject: str, text_content: str, html_content: str) -> bool:
    """
    Sends an email via the Courier REST API.
    Uses 'html' property to send raw HTML, bypassing the default 'Hello World' brand wrapper.
    """
    url = "https://api.courier.com/send"

    payload = {
        "message": {
            "to": {
                "email": to_email
            },
            "content": {
                "title": subject,
                "html": html_content
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
