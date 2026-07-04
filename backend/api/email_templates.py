"""
Quota Hire - Professional Email Templates

- Concise, straight-to-the-point messaging — only the essential information.
- Logo is embedded as an inline SVG in the email header.
- Subjects use ASCII-safe characters only to prevent encoding issues.
- Emails are delivered via Elastic Email SMTP using Django's send_mail.
"""

from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# LOGO (Inline SVG)
# =============================================================================

LOGO_SVG = """\
<table cellpadding="0" cellspacing="0" border="0">
<tr>
  <td style="width:52px;vertical-align:middle;padding-right:14px;">
    <svg width="48" height="48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"
         style="display:block;" aria-label="Quota Hire Logo">
      <circle cx="50" cy="50" r="48" fill="#1A6515"/>
      <circle cx="50" cy="50" r="35" fill="#5DDE2A"/>
      <circle cx="50" cy="50" r="21" fill="#1A6515"/>
      <rect x="39" y="46" width="22" height="14" rx="2.5" fill="white"/>
      <path d="M43.5 46 L43.5 42 Q43.5 40 50 40 Q56.5 40 56.5 42 L56.5 46"
            stroke="white" stroke-width="2.8" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="39" y="52.5" width="22" height="2" rx="1" fill="#1A6515"/>
      <rect x="47" y="51" width="6" height="5.5" rx="1.5" fill="#1A6515"/>
    </svg>
  </td>
  <td style="vertical-align:middle;">
    <div style="font-size:22px;font-weight:700;color:#111111;letter-spacing:-0.4px;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Quota Hire</div>
    <div style="font-size:11px;color:#1A6515;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;margin:3px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Professional Recruitment Platform</div>
  </td>
</tr>
</table>"""


# =============================================================================
# HTML SHELL
# =============================================================================

def _build_email(*, title, body_html):
    """Assembles the complete HTML email document."""
    return (
        "<!DOCTYPE html>"
        '<html lang="en">'
        "<head>"
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1.0">'
        '<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">'
        f"<title>{title}</title>"
        "<style>"
        "body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}"
        "table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}"
        "img{border:0;outline:none;text-decoration:none;display:block;}"
        "body{margin:0;padding:0;background-color:#f4f4f5;"
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}"
        ".wrap{width:100%;background-color:#f4f4f5;padding:32px 0;box-sizing:border-box;}"
        ".card{max-width:560px;margin:0 auto;background-color:#ffffff;"
        "overflow:hidden;border:1px solid #e4e4e7;border-radius:10px;}"
        ".hdr{padding:24px 36px;border-bottom:1px solid #f0fdf0;background-color:#ffffff;}"
        ".bdy{padding:32px 36px 36px;}"
        "h1{font-size:20px;font-weight:700;color:#111111;margin:0 0 4px;letter-spacing:-0.3px;line-height:1.3;}"
        ".sub{font-size:13px;color:#71717a;margin:0 0 20px;}"
        "hr{border:none;border-top:1px solid #e4e4e7;margin:20px 0;}"
        "p{font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 16px;}"
        ".dbox{background-color:#f0fdf4;border-left:4px solid #1A6515;"
        "border-radius:6px;padding:14px 18px;margin:18px 0;}"
        ".dlbl{font-size:11px;font-weight:600;color:#1A6515;text-transform:uppercase;"
        "letter-spacing:0.8px;margin:0 0 4px;}"
        ".dval{font-size:16px;font-weight:600;color:#111111;margin:0;}"
        ".badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;"
        "font-weight:600;margin:0 0 16px;}"
        ".b-green{background-color:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;}"
        ".b-yellow{background-color:#fefce8;color:#ca8a04;border:1px solid #fde68a;}"
        ".b-blue{background-color:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;}"
        ".b-red{background-color:#fef2f2;color:#dc2626;border:1px solid #fecaca;}"
        ".b-gray{background-color:#f9fafb;color:#374151;border:1px solid #e5e7eb;}"
        ".btnw{margin:24px 0 20px;}"
        ".btn{display:inline-block;background-color:#1A6515;color:#ffffff !important;"
        "text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;"
        "border-radius:6px;letter-spacing:0.2px;}"
        ".lf{margin-top:16px;padding:12px 16px;background-color:#fafafa;"
        "border-radius:6px;border:1px dashed #d4d4d8;}"
        ".lf p{font-size:12px;color:#71717a;margin:0 0 6px;}"
        ".lf a{font-size:12px;color:#1A6515;word-break:break-all;}"
        ".ftr{background-color:#fafafa;border-top:1px solid #e4e4e7;padding:20px 36px;text-align:center;}"
        ".ftr p{font-size:12px;color:#a1a1aa;margin:0 0 4px;line-height:1.6;}"
        ".ftr a{color:#71717a;text-decoration:underline;}"
        "@media only screen and (max-width:600px){"
        ".hdr,.bdy,.ftr{padding-left:20px!important;padding-right:20px!important;}"
        "h1{font-size:18px!important;}}"
        "</style>"
        "</head>"
        "<body>"
        '<div class="wrap"><div class="card">'
        '<div class="hdr">' + LOGO_SVG + "</div>"
        '<div class="bdy">' + body_html + "</div>"
        '<div class="ftr">'
        "<p>&copy; 2026 Quota Hire. All rights reserved.</p>"
        '<p><a href="https://quotahire.org">quotahire.org</a></p>'
        "</div>"
        "</div></div>"
        "</body></html>"
    )


# =============================================================================
# HELPER BUILDERS
# =============================================================================

def _h1(title, subtitle=""):
    sub = f'<p class="sub">{subtitle}</p>' if subtitle else ""
    return f"<h1>{title}</h1>{sub}"


def _p(text):
    return f"<p>{text}</p>"


def _dbox(label, value):
    return (
        '<div class="dbox">'
        f'<p class="dlbl">{label}</p>'
        f'<p class="dval">{value}</p>'
        "</div>"
    )


def _badge(text, color="green"):
    return f'<span class="badge b-{color}">{text}</span>'


def _cta(href, label):
    return f'<div class="btnw"><a href="{href}" class="btn">{label}</a></div>'


def _lf(url):
    return (
        '<div class="lf">'
        "<p>Or copy this link into your browser:</p>"
        f'<a href="{url}">{url}</a>'
        "</div>"
    )


def _hr():
    return "<hr>"


def _signoff():
    return (
        '<p style="margin-top:24px;font-size:14px;color:#3f3f46;">'
        'The Quota Hire Team</p>'
    )


# =============================================================================
# 1. EMAIL VERIFICATION
# =============================================================================

def get_verification_email_html(user, redirect):
    body = (
        _h1("Verify Your Email Address") +
        _p(f"Hi <strong>{user}</strong>,") +
        _p("Click the button below to verify your email and activate your Quota Hire account.") +
        _cta(redirect, "Verify My Email") +
        _p('<span style="color:#71717a;font-size:13px;">This link expires in <strong>24 hours</strong>. '
           'If you did not create an account, ignore this email.</span>') +
        _lf(redirect) +
        _signoff()
    )
    return _build_email(title="Verify your email - Quota Hire", body_html=body)


# =============================================================================
# 2. PASSWORD RESET
# =============================================================================

def get_recovery_email_html(user, redirect):
    body = (
        _h1("Reset Your Password") +
        _p(f"Hi <strong>{user}</strong>,") +
        _p("We received a request to reset your password. Click below to create a new one.") +
        _cta(redirect, "Reset My Password") +
        _p('<span style="color:#71717a;font-size:13px;">This link expires in <strong>10 minutes</strong> '
           'and can only be used once. If you did not request this, ignore this email.</span>') +
        _lf(redirect) +
        _signoff()
    )
    return _build_email(title="Reset your password - Quota Hire", body_html=body)


# =============================================================================
# 3. WELCOME EMAIL (sent after email verification)
# =============================================================================

def get_welcome_email_html(user, is_company=False):
    if is_company:
        body = (
            _h1("Welcome to Quota Hire!") +
            _p(f"Hi <strong>{user}</strong>,") +
            _p("Your company account is now active. Start by completing your profile and posting your first job.") +
            _cta("https://quotahire.org/dashboard", "Go to Dashboard") +
            _signoff()
        )
    else:
        body = (
            _h1("Welcome to Quota Hire!") +
            _p(f"Hi <strong>{user}</strong>,") +
            _p("Your account is now active. Complete your profile and start exploring job opportunities.") +
            _cta("https://quotahire.org/dashboard", "Complete My Profile") +
            _signoff()
        )
    return _build_email(title="Welcome - Quota Hire", body_html=body)


# =============================================================================
# 4. JOB SUBMITTED FOR REVIEW
# =============================================================================

def get_job_submitted_email_html(user, job_title):
    body = (
        _h1("Job Listing Submitted") +
        _p(f"Hi <strong>{user}</strong>,") +
        _p("Your job listing has been submitted for review. We'll notify you once it goes live.") +
        _dbox("Submitted Job", job_title) +
        _cta("https://quotahire.org/dashboard", "View Dashboard") +
        _signoff()
    )
    return _build_email(title="Job listing submitted - Quota Hire", body_html=body)


# =============================================================================
# 5. JOB APPROVED
# =============================================================================

def get_job_approved_email_html(user, job_title):
    body = (
        _h1("Your Job Listing is Live!") +
        _p(f"Hi <strong>{user}</strong>,") +
        _badge("Approved &amp; Published", "green") +
        _p("Your job listing has been approved and is now live on Quota Hire.") +
        _dbox("Live Job", job_title) +
        _cta("https://quotahire.org/dashboard", "Manage Applications") +
        _signoff()
    )
    return _build_email(title="Your job listing is now live - Quota Hire", body_html=body)


# =============================================================================
# 6. JOB REJECTED
# =============================================================================

def get_job_rejected_email_html(user, job_title):
    body = (
        _h1("Job Listing Needs Revision") +
        _p(f"Hi <strong>{user}</strong>,") +
        _badge("Needs Revision", "yellow") +
        _p("Your job listing was not approved. Please review and update it before resubmitting.") +
        _dbox("Listing", job_title) +
        _cta("https://quotahire.org/dashboard", "Revise &amp; Resubmit") +
        _p('<span style="color:#71717a;font-size:13px;">Need help? Contact us at '
           '<a href="mailto:noreply@quotahire.org" style="color:#1A6515;">noreply@quotahire.org</a>.</span>') +
        _signoff()
    )
    return _build_email(title="Job listing needs revision - Quota Hire", body_html=body)


# =============================================================================
# 7. APPLICATION CONFIRMED
# =============================================================================

def get_application_confirmed_email_html(user, job_title):
    body = (
        _h1("Application Submitted!") +
        _p(f"Hi <strong>{user}</strong>,") +
        _p("Your application has been successfully submitted. We'll notify you of any updates.") +
        _dbox("Position Applied For", job_title) +
        _cta("https://quotahire.org/dashboard", "Track My Application") +
        _signoff()
    )
    return _build_email(title="Application submitted - Quota Hire", body_html=body)


# =============================================================================
# 8. APPLICATION STATUS UPDATE (generic notification mirror)
# =============================================================================

_STATUS_CONFIG = {
    "Application Under Review": {
        "badge": ("Under Review", "blue"),
        "message": "Your application is currently being reviewed by the hiring team.",
        "cta": ("https://quotahire.org/dashboard", "View Application"),
    },
    "Interview Invitation": {
        "badge": ("Interview Invited", "green"),
        "message": "Congratulations! You have been shortlisted for an interview. The company will contact you with details.",
        "cta": ("https://quotahire.org/dashboard", "View Details"),
    },
    "Decision Pending": {
        "badge": ("Decision Pending", "yellow"),
        "message": "You have completed the interview stage. The hiring team is making their final decision.",
        "cta": ("https://quotahire.org/dashboard", "View My Applications"),
    },
    "Application Accepted": {
        "badge": ("Accepted", "green"),
        "message": "Congratulations! Your application has been accepted. The company will be in touch with next steps.",
        "cta": ("https://quotahire.org/dashboard", "View Offer Details"),
    },
    "Application Update": {
        "badge": ("Application Closed", "gray"),
        "message": "After careful review, the hiring team has decided to move forward with another candidate. Keep applying — the right role is out there!",
        "cta": ("https://quotahire.org", "Browse More Jobs"),
    },
}


def get_notification_email_html(user, title, message, job_title=None, is_remote=False, employment_type=None):
    cfg = _STATUS_CONFIG.get(title, {})

    badge_html = ""
    if cfg.get("badge"):
        badge_html = _badge(*cfg["badge"])

    body_message = cfg.get("message", message)
    href, lbl = cfg.get("cta", ("https://quotahire.org/dashboard", "Go to Dashboard"))

    body = (
        _h1(title) +
        _p(f"Hi <strong>{user}</strong>,") +
        badge_html
    )

    if job_title:
        body += _dbox("Position", job_title)

    body += (
        _p(body_message) +
        _cta(href, lbl) +
        _signoff()
    )

    return _build_email(title=f"{title} - Quota Hire", body_html=body)


# =============================================================================
# 9. NEWSLETTER / ADMIN BROADCAST
# =============================================================================

def get_newsletter_email_html(subject, plain_body):
    paragraphs = [p.strip() for p in plain_body.strip().split("\n") if p.strip()]
    inner = "".join(_p(para) for para in paragraphs)

    body = (
        _h1(subject) +
        _hr() +
        inner +
        _hr() +
        _cta("https://quotahire.org", "Visit Quota Hire") +
        _signoff()
    )
    return _build_email(title=f"{subject} - Quota Hire", body_html=body)


# =============================================================================
# ELASTIC EMAIL SMTP SENDER
# =============================================================================

def send_courier_email(to_email: str, subject: str, text_content: str, html_content: str) -> bool:
    """
    Sends a transactional email via Elastic Email SMTP using Django's built-in
    EmailMultiAlternatives. The HTML body is attached as the primary alternative;
    text_content serves as the plain-text fallback for email clients that do
    not render HTML.

    Configuration is driven entirely by Django settings:
      EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD,
      EMAIL_USE_TLS, DEFAULT_FROM_EMAIL
    """
    from_email = settings.DEFAULT_FROM_EMAIL

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info("Email sent via Elastic Email to %s (subject=%r)", to_email, subject)
        return True
    except Exception as e:
        logger.error(
            "Elastic Email send failed (to=%s subject=%r): %s",
            to_email, subject, e, exc_info=True,
        )
        raise
