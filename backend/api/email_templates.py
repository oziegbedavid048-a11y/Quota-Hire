"""
Quota Hire - Professional Email Templates

- Concise yet professional messaging — 3 to 4 sentences per email.
- Logo is embedded as an inline SVG in the email header.
- Subjects use ASCII-safe characters only to prevent encoding issues.
- Emails are delivered via ZeptoMail SMTP using Django's send_mail.
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
        "p{font-size:15px;line-height:1.7;color:#3f3f46;margin:0 0 14px;}"
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
        '<p>You are receiving this because you have an account on '
        '<a href="https://quotahire.org">quotahire.org</a>.</p>'
        '<p><a href="https://quotahire.org">Visit Platform</a> &nbsp;&middot;&nbsp; '
        '<a href="https://quotahire.org/dashboard">My Dashboard</a></p>'
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
        "<p>If the button above does not work, copy and paste this link into your browser:</p>"
        f'<a href="{url}">{url}</a>'
        "</div>"
    )


def _hr():
    return "<hr>"


def _signoff():
    return (
        '<p style="margin-top:24px;font-size:14px;color:#3f3f46;">'
        'Warm regards,<br><strong>The Quota Hire Team</strong></p>'
    )


# =============================================================================
# 1. EMAIL VERIFICATION
# =============================================================================

def get_verification_email_html(user, redirect):
    body = (
        _h1("Verify Your Email Address", "One step away from your Quota Hire account") +
        _p(f"Hi <strong>{user}</strong>,") +
        _p(
            "Thank you for registering on Quota Hire. To activate your account and gain full "
            "access to the platform, please verify your email address by clicking the button below."
        ) +
        _p(
            "This verification link is valid for <strong>24 hours</strong>. "
            "If you did not create a Quota Hire account, please ignore this email — no action is required."
        ) +
        _cta(redirect, "Verify My Email Address") +
        _lf(redirect) +
        _signoff()
    )
    return _build_email(title="Verify your email - Quota Hire", body_html=body)


# =============================================================================
# 2. PASSWORD RESET
# =============================================================================

def get_recovery_email_html(user, redirect):
    body = (
        _h1("Reset Your Password", "A password reset was requested for your account") +
        _p(f"Hi <strong>{user}</strong>,") +
        _p(
            "We received a request to reset the password on your Quota Hire account. "
            "Click the button below to create a new password. "
            "This link is valid for <strong>10 minutes</strong> and can only be used once."
        ) +
        _p(
            "If you did not request a password reset, please ignore this email. "
            "Your current password will remain unchanged and your account is secure."
        ) +
        _cta(redirect, "Reset My Password") +
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
            _h1("Welcome to Quota Hire!", "Your company account is now active") +
            _p(f"Hi <strong>{user}</strong>,") +
            _p(
                "Congratulations — your email has been verified and your Quota Hire company account is fully activated. "
                "You can now start attracting top talent by completing your company profile and posting your first job listing."
            ) +
            _p(
                "Our team reviews all job listings to ensure quality, so your listing will go live shortly after submission. "
                "Head to your dashboard to get started."
            ) +
            _cta("https://quotahire.org/dashboard", "Go to My Dashboard") +
            _signoff()
        )
    else:
        body = (
            _h1("Welcome to Quota Hire!", "Your account is fully activated") +
            _p(f"Hi <strong>{user}</strong>,") +
            _p(
                "Congratulations — your email has been verified and your Quota Hire account is ready. "
                "We are excited to help you find your next great career opportunity from our growing list of verified employers."
            ) +
            _p(
                "Complete your profile, upload your CV, and start exploring job listings tailored to your skills. "
                "A complete profile increases your visibility to employers significantly."
            ) +
            _cta("https://quotahire.org/dashboard", "Complete My Profile") +
            _signoff()
        )
    return _build_email(title="Welcome - Quota Hire", body_html=body)


# =============================================================================
# 4. JOB SUBMITTED FOR REVIEW
# =============================================================================

def get_job_submitted_email_html(user, job_title):
    body = (
        _h1("Job Listing Submitted for Review") +
        _p(f"Hi <strong>{user}</strong>,") +
        _p(
            "Your job listing has been successfully submitted and is now in our review queue. "
            "Our team carefully reviews every listing to ensure it meets our platform standards before going live."
        ) +
        _dbox("Submitted Job", job_title) +
        _p(
            "You will receive an email confirmation the moment your listing is approved and live. "
            "This typically takes 1 to 6 hours during business hours."
        ) +
        _cta("https://quotahire.org/dashboard", "View My Dashboard") +
        _signoff()
    )
    return _build_email(title="Job listing submitted - Quota Hire", body_html=body)


# =============================================================================
# 5. JOB APPROVED
# =============================================================================

def get_job_approved_email_html(user, job_title, job_code):
    frontend_url = getattr(settings, 'FRONTEND_URL', 'https://quotahire.org').strip()
    share_link = f"{frontend_url}/jobs?code={job_code}"
    body = (
        _h1("Your Job Listing is Now Live!") +
        _p(f"Hi <strong>{user}</strong>,") +
        _badge("Approved &amp; Published", "green") +
        _p(
            "Your job listing has been reviewed and approved. "
            "It is now live and fully visible to our community of active job seekers on Quota Hire."
        ) +
        _dbox("Live Job", job_title) +
        _dbox("Unique Job Code", job_code) +
        _p(
            "Share this job code or the direct link below with candidates so they can find and apply for your role easily. "
            "If they do not have a Quota Hire account yet, they will be guided to sign up first:"
        ) +
        _p(f'Shareable Link: <a href="{share_link}" style="color:#1A6515; font-weight:bold; word-break:break-all;">{share_link}</a>') +
        _cta(share_link, "View Live Job Listing") +
        _signoff()
    )
    return _build_email(title="Your job listing is now live - Quota Hire", body_html=body)


# =============================================================================
# 6. JOB REJECTED
# =============================================================================

def get_job_rejected_email_html(user, job_title):
    body = (
        _h1("Your Job Listing Needs Revision") +
        _p(f"Hi <strong>{user}</strong>,") +
        _badge("Needs Revision", "yellow") +
        _p(
            "Thank you for submitting your job listing on Quota Hire. "
            "After a careful review, our team was unable to approve it in its current form."
        ) +
        _dbox("Listing Requiring Revision", job_title) +
        _p(
            "Common reasons include an incomplete job description, missing compensation details, or content that does not meet our guidelines. "
            "Please log in to your dashboard, update the listing, and resubmit — our team will prioritise your re-review."
        ) +
        _p(
            'If you need guidance on what to correct, contact us at '
            '<a href="mailto:noreply@quotahire.org" style="color:#1A6515;">noreply@quotahire.org</a>.'
        ) +
        _cta("https://quotahire.org/dashboard", "Revise &amp; Resubmit") +
        _signoff()
    )
    return _build_email(title="Job listing needs revision - Quota Hire", body_html=body)


# =============================================================================
# 7. APPLICATION CONFIRMED
# =============================================================================

def get_application_confirmed_email_html(user, job_title):
    body = (
        _h1("Application Submitted Successfully!") +
        _p(f"Hi <strong>{user}</strong>,") +
        _p(
            "Your application has been successfully submitted through Quota Hire and this email serves as your official confirmation. "
            "The hiring team has received your application and it is now in their review queue."
        ) +
        _dbox("Position Applied For", job_title) +
        _p(
            "You will receive a separate email notification at each stage of the recruitment process, "
            "so you are always kept informed. You can also track your application status at any time from your dashboard."
        ) +
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
        "subtitle": "Your application is being evaluated by the hiring team",
        "intro": (
            "We are pleased to let you know that your application is now being actively reviewed by the hiring team. "
            "This is a positive sign that your profile has passed the initial screening stage."
        ),
        "detail": (
            "No action is required from you at this stage. "
            "Please ensure your contact details are up to date and your notifications are enabled, "
            "as the hiring team may reach out to you directly. You will be notified immediately when your status changes."
        ),
        "cta": ("https://quotahire.org/dashboard", "View Application Status"),
    },
    "Interview Invitation": {
        "badge": ("Interview Invited", "green"),
        "subtitle": "Congratulations — you have been shortlisted for an interview",
        "intro": (
            "We are delighted to inform you that you have been shortlisted and invited for an interview for this position. "
            "This is a significant achievement and reflects the hiring team's genuine interest in your profile and experience."
        ),
        "detail": (
            "A representative from the company will contact you to confirm the interview format, date, and time. "
            "Please monitor your email inbox and Quota Hire dashboard closely and respond promptly to any outreach from the employer. "
            "We wish you every success — prepare well, be confident, and bring your best self."
        ),
        "cta": ("https://quotahire.org/dashboard", "View Interview Details"),
    },
    "Decision Pending": {
        "badge": ("Decision Pending", "yellow"),
        "subtitle": "The hiring team is making their final decision",
        "intro": (
            "Thank you for your continued engagement with this opportunity. "
            "You have successfully completed the interview stage and the hiring team is now in the final stages of their deliberation."
        ),
        "detail": (
            "A decision is expected very soon and you will be notified the moment it is made. "
            "Please continue to monitor your email and Quota Hire dashboard closely. "
            "We appreciate your patience and look forward to sharing the outcome with you shortly."
        ),
        "cta": ("https://quotahire.org/dashboard", "View My Applications"),
    },
    "Application Accepted": {
        "badge": ("Accepted", "green"),
        "subtitle": "Congratulations — your application has been successful!",
        "intro": (
            "We are absolutely thrilled to inform you that your application has been successful. "
            "The hiring team has made their final decision and selected you as their preferred candidate for this position — congratulations!"
        ),
        "detail": (
            "A company representative will be contacting you very shortly to discuss the offer details, including your start date and contract terms. "
            "Please ensure you are available and responsive to their communication. "
            "We wish you a successful and fulfilling career ahead — well done from the entire Quota Hire team."
        ),
        "cta": ("https://quotahire.org/dashboard", "View Offer Details"),
    },
    "Application Update": {
        "badge": ("Application Closed", "gray"),
        "subtitle": "An update on your recent application",
        "intro": (
            "Thank you sincerely for applying through Quota Hire and for the time and effort you invested in this opportunity. "
            "After a careful review of all applications, the hiring team has decided to move forward with another candidate for this role."
        ),
        "detail": (
            "Please be assured this outcome does not reflect on your overall skills, potential, or professional value. "
            "We sincerely encourage you not to be discouraged — keep your profile updated and continue exploring other relevant "
            "opportunities on the platform. The right role for you is out there and we remain committed to helping you find it."
        ),
        "cta": ("https://quotahire.org", "Browse More Opportunities"),
    },
}


def get_notification_email_html(user, title, message, job_title=None, is_remote=False, employment_type=None):
    cfg = _STATUS_CONFIG.get(title, {})

    badge_html = ""
    if cfg.get("badge"):
        badge_html = _badge(*cfg["badge"])

    subtitle = cfg.get("subtitle", "")
    intro = cfg.get("intro", message)
    detail = cfg.get("detail", "")
    href, lbl = cfg.get("cta", ("https://quotahire.org/dashboard", "Go to My Dashboard"))

    # Personalise intro with job title if available
    if job_title and title == "Application Under Review":
        intro = (
            f"We are pleased to let you know that your application for the <strong>{job_title}</strong> position "
            f"is now being actively reviewed by the hiring team. "
            f"This is a positive sign that your profile has passed the initial screening stage."
        )
    elif job_title and title == "Interview Invitation":
        is_remote_role = is_remote or (employment_type and "freelance" in employment_type.lower())
        role_type = "remote/freelance" if is_remote_role else "on-site"
        intro = (
            f"We are delighted to inform you that you have been shortlisted and invited for an interview for the "
            f"<strong>{job_title}</strong> ({role_type}) position. "
            f"This reflects the hiring team's genuine interest in your profile — congratulations on reaching this stage."
        )
    elif job_title and title == "Decision Pending":
        intro = (
            f"You have successfully completed the interview stage for the <strong>{job_title}</strong> position "
            f"and the hiring team is now in the final stages of their deliberation. "
            f"A decision is expected very soon and you will be notified the moment it is made."
        )
    elif job_title and title == "Application Accepted":
        intro = (
            f"We are absolutely thrilled to inform you that your application for the <strong>{job_title}</strong> position "
            f"has been successful. The hiring team has selected you as their preferred candidate — congratulations!"
        )
    elif job_title and title == "Application Update":
        intro = (
            f"Thank you sincerely for applying for the <strong>{job_title}</strong> position through Quota Hire. "
            f"After careful consideration, the hiring team has decided to move forward with another candidate for this role."
        )

    body = (
        _h1(title, subtitle) +
        _p(f"Hi <strong>{user}</strong>,") +
        badge_html
    )

    if job_title:
        body += _dbox("Position", job_title)

    body += _p(intro)

    if detail:
        body += _p(detail)

    if title in ["Application Under Review", "Interview Invitation", "Decision Pending", "Application Accepted"]:
        body += _p(
            "<strong>Reminder:</strong> Please make sure you have the CV or resume that you used to apply "
            "for this role prepared. We highly recommend downloading a copy of the specific CV you submitted "
            "from your Quota Hire profile dashboard, as the hiring team may request it during the recruitment process."
        )

    body += (
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
        _h1(subject, "An important update from the Quota Hire team") +
        _hr() +
        inner +
        _hr() +
        _cta("https://quotahire.org", "Visit Quota Hire") +
        _signoff()
    )
    return _build_email(title=f"{subject} - Quota Hire", body_html=body)


# =============================================================================
# ZEPTOMAIL SMTP SENDER
# =============================================================================

def send_courier_email(to_email: str, subject: str, text_content: str, html_content: str) -> bool:
    """
    Dispatches the email sending task to Celery's task queue so it is sent
    asynchronously without blocking the HTTP request thread.
    If Celery or Redis is unreachable/down, falls back to synchronous sending to ensure delivery.
    """
    try:
        from .tasks import send_courier_email_task
        send_courier_email_task.delay(to_email, subject, text_content, html_content)
        return True
    except Exception as e:
        logger.error(
            "Failed to dispatch email asynchronously via Celery (Redis down?): %s. "
            "Falling back to synchronous send.", e, exc_info=True
        )
        try:
            from django.core.mail import EmailMultiAlternatives
            from django.conf import settings
            
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[to_email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send(fail_silently=False)
            logger.info("Sent email synchronously as a fallback to %s (subject=%r)", to_email, subject)
            return True
        except Exception as sync_exc:
            logger.error("Synchronous fallback email send failed: %s", sync_exc, exc_info=True)
            return False


def get_custom_admin_email_html(plain_body, attachment_name=None, attachment_is_image=False, attachments=None):
    """
    Renders a plain HTML body featuring only the paragraph-separated 
    message text and the standard platform footer. No heavy design headers.
    If attachments are present, displays them (either inline image or attachment link) 
    before the footer.
    """
    paragraphs = [p.strip() for p in plain_body.strip().split("\n") if p.strip()]
    inner = "".join(f"<p>{para}</p>" for para in paragraphs)
    
    # Maintain backward compatibility with single attachment params
    unified_attachments = []
    if attachments:
        unified_attachments.extend(attachments)
    elif attachment_name:
        unified_attachments.append({
            'name': attachment_name,
            'is_image': attachment_is_image,
            'cid': 'attached_image'
        })
    
    attachment_html_parts = []
    for att in unified_attachments:
        name = att.get('name')
        is_image = att.get('is_image', False)
        cid = att.get('cid')
        
        if is_image and cid:
            part_html = (
                '<div style="margin-top:20px; padding:12px 16px; background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; display:inline-block; font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'
                '<span style="font-size:14px; font-weight:600; color:#111827;">📎 Attached image:</span>'
                f'<span style="font-size:14px; color:#4b5563; margin-left:8px;">{name}</span>'
                '</div>'
                '<div style="margin-top:12px;">'
                f'<img src="cid:{cid}" alt="Attached Image" style="max-width:100%; height:auto; display:block; border-radius:6px; border:1px solid #e4e4e7;">'
                '</div>'
            )
        else:
            part_html = (
                '<div style="margin-top:20px; padding:12px 16px; background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; display:inline-block; font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;">'
                '<span style="font-size:14px; font-weight:600; color:#111827;">📎 Attached file:</span>'
                f'<span style="font-size:14px; color:#4b5563; margin-left:8px;">{name}</span>'
                '</div>'
            )
        attachment_html_parts.append(part_html)
        
    attachment_html = "".join(attachment_html_parts)

    body = (
        "<!DOCTYPE html>"
        '<html lang="en">'
        "<head>"
        '<meta charset="UTF-8">'
        '<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">'
        "</head>"
        '<body style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#3f3f46;padding:20px;max-width:600px;margin:0 auto;">'
        f"<div>{inner}</div>"
        f"{attachment_html}"
        '<hr style="border:none;border-top:1px solid #e4e4e7;margin:30px 0 20px;">'
        '<div style="font-size:12px;color:#a1a1aa;line-height:1.6;text-align:center;">'
        "<p>&copy; 2026 Quota Hire. All rights reserved.</p>"
        '<p>You are receiving this because you have an account on '
        '<a href="https://quotahire.org" style="color:#71717a;text-decoration:underline;">quotahire.org</a>.</p>'
        '<p><a href="https://quotahire.org" style="color:#71717a;text-decoration:underline;">Visit Platform</a> &nbsp;&middot;&nbsp; '
        '<a href="https://quotahire.org/dashboard" style="color:#71717a;text-decoration:underline;">My Dashboard</a></p>'
        "</div>"
        "</body></html>"
    )
    return body
