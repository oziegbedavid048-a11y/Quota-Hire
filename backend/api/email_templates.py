"""
Quota Hire - Professional Email Templates

- All emails are detailed, professional, and contain no emojis.
- Logo is embedded as an inline SVG in the email header.
- Subjects use ASCII-safe characters only to prevent encoding issues.
"""

import json
import urllib.request
import urllib.error
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
# Wraps every email in a consistent, professional layout.
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
        "body{margin:0;padding:0;background-color:#ffffff;"
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}"
        ".wrap{width:100%;background-color:#ffffff;padding:20px 0;box-sizing:border-box;}"
        ".card{max-width:620px;margin:0 auto;background-color:#ffffff;"
        "overflow:hidden;border:1px solid #e4e4e7;border-radius:8px;}"
        ".hdr{padding:28px 40px 24px;border-bottom:2px solid #f0fdf0;background-color:#fafafa;}"
        ".bdy{padding:36px 40px 40px;}"
        "h1{font-size:24px;font-weight:700;color:#111111;margin:0 0 6px;letter-spacing:-0.3px;line-height:1.3;}"
        ".sub{font-size:14px;color:#71717a;margin:0 0 28px;}"
        "hr{border:none;border-top:1px solid #e4e4e7;margin:28px 0;}"
        "p{font-size:15px;line-height:1.75;color:#3f3f46;margin:0 0 18px;}"
        ".dbox{background-color:#f8fffe;border:1px solid #d1fae5;border-left:4px solid #1A6515;"
        "border-radius:6px;padding:18px 20px;margin:24px 0;}"
        ".dlbl{font-size:11px;font-weight:600;color:#1A6515;text-transform:uppercase;"
        "letter-spacing:0.8px;margin:0 0 6px;}"
        ".dval{font-size:16px;font-weight:600;color:#111111;margin:0;}"
        ".badge{display:inline-block;padding:6px 14px;border-radius:20px;font-size:13px;"
        "font-weight:600;margin:4px 0 20px;}"
        ".b-green{background-color:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;}"
        ".b-yellow{background-color:#fefce8;color:#ca8a04;border:1px solid #fde68a;}"
        ".b-blue{background-color:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;}"
        ".b-red{background-color:#fef2f2;color:#dc2626;border:1px solid #fecaca;}"
        ".b-gray{background-color:#f9fafb;color:#374151;border:1px solid #e5e7eb;}"
        ".btnw{margin:32px 0 28px;}"
        ".btn{display:inline-block;background-color:#1A6515;color:#ffffff !important;"
        "text-decoration:none;font-size:14px;font-weight:600;padding:13px 32px;"
        "border-radius:6px;letter-spacing:0.2px;}"
        ".lf{margin-top:24px;padding:16px 20px;background-color:#fafafa;"
        "border-radius:6px;border:1px dashed #d4d4d8;}"
        ".lf p{font-size:12px;color:#71717a;margin:0 0 8px;}"
        ".lf a{font-size:12px;color:#1A6515;word-break:break-all;}"
        "ol.steps{margin:16px 0 24px;padding-left:22px;}"
        "ol.steps li{font-size:14px;color:#3f3f46;padding:7px 0;border-bottom:1px solid #f4f4f5;line-height:1.65;}"
        "ol.steps li:last-child{border-bottom:none;}"
        ".signoff{margin-top:32px;padding-top:24px;border-top:1px solid #f4f4f5;}"
        ".signoff p{font-size:14px;color:#3f3f46;margin:0 0 4px;}"
        ".signoff .tname{font-size:14px;font-weight:700;color:#111111;margin:0;}"
        ".ftr{background-color:#fafafa;border-top:1px solid #e4e4e7;padding:24px 40px;text-align:center;}"
        ".ftr p{font-size:12px;color:#a1a1aa;margin:0 0 6px;line-height:1.6;}"
        ".ftr a{color:#71717a;text-decoration:underline;}"
        "@media only screen and (max-width:600px){"
        ".hdr,.bdy,.ftr{padding-left:24px!important;padding-right:24px!important;}"
        "h1{font-size:20px!important;}}"
        "</style>"
        "</head>"
        "<body>"
        '<div class="wrap"><div class="card">'
        '<div class="hdr">' + LOGO_SVG + "</div>"
        '<div class="bdy">' + body_html + "</div>"
        '<div class="ftr">'
        "<p>&copy; 2026 Quota Hire. All rights reserved.<br>"
        'You received this email because you have an account on <a href="https://quotahire.org">quotahire.org</a>.</p>'
        '<p><a href="https://quotahire.org">Visit Platform</a>&nbsp;&middot;&nbsp;'
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
        "<p>If the button above does not work, copy and paste the link below into your browser:</p>"
        f'<a href="{url}">{url}</a>'
        "</div>"
    )


def _hr():
    return "<hr>"


def _steps(items):
    lis = "".join(f"<li>{it}</li>" for it in items)
    return f'<ol class="steps">{lis}</ol>'


def _signoff():
    return (
        '<div class="signoff">'
        "<p>Warm regards,</p>"
        '<p class="tname">The Quota Hire Team</p>'
        "</div>"
    )


# =============================================================================
# 1. EMAIL VERIFICATION
# =============================================================================

def get_verification_email_html(user, redirect):
    body = (
        _h1("Verify Your Email Address",
            "One final step to activate your Quota Hire account") +
        _p(f"Dear <strong>{user}</strong>,") +
        _p(
            "Thank you for registering on Quota Hire, a professional recruitment platform "
            "connecting skilled candidates with top employers across Africa and beyond. "
            "To complete your registration and gain full access to your account, please "
            "verify that this email address belongs to you by clicking the button below."
        ) +
        _p(
            "This verification link is valid for <strong>24 hours</strong> from the time "
            "this email was sent. After verification, your account will be fully activated "
            "and you can begin building your professional profile or posting job opportunities "
            "for your company immediately."
        ) +
        _cta(redirect, "Verify My Email Address") +
        _hr() +
        _p(
            "<strong>What happens after verification?</strong><br>"
            "You will be redirected to your dashboard where you can complete your profile, "
            "upload your CV, set your job preferences, and start exploring the opportunities "
            "available on the platform. A complete profile significantly increases your "
            "visibility to employers and improves the quality of matches you receive."
        ) +
        _p(
            "If you did not create a Quota Hire account, please disregard this email. "
            "No action is required and your information will not be used in any way."
        ) +
        _lf(redirect) +
        _signoff()
    )
    return _build_email(title="Verify your email - Quota Hire", body_html=body)


# =============================================================================
# 2. PASSWORD RESET
# =============================================================================

def get_recovery_email_html(user, redirect):
    body = (
        _h1("Password Reset Request",
            "A request was made to reset your Quota Hire account password") +
        _p(f"Dear <strong>{user}</strong>,") +
        _p(
            "We received a request to reset the password associated with your Quota Hire account. "
            "If you initiated this request, please click the button below to proceed with "
            "creating a new password. This reset link is valid for <strong>10 minutes</strong> "
            "and can only be used once."
        ) +
        _cta(redirect, "Reset My Password") +
        _hr() +
        _p("<strong>Important security guidelines:</strong>") +
        _steps([
            "This link expires in 10 minutes. If it has expired, request a new reset from the login page.",
            "This link can only be used once. After use, it becomes immediately invalid.",
            "Choose a strong, unique password that you do not use on any other website or service.",
            "Quota Hire staff will never ask you for your password via email, phone, or any other channel.",
        ]) +
        _p(
            "If you did not request a password reset, please ignore this email. "
            "Your account password will remain unchanged and no further action is required. "
            "However, if you continue to receive unexpected password reset requests, "
            "we strongly recommend contacting our support team at "
            "<a href='mailto:support.qutahire@gmail.com' style='color:#1A6515;'>support.qutahire@gmail.com</a> "
            "immediately so we can investigate and secure your account."
        ) +
        _lf(redirect) +
        _signoff()
    )
    return _build_email(title="Reset your password - Quota Hire", body_html=body)


# =============================================================================
# 3. WELCOME EMAIL (sent after email verification)
# =============================================================================

def get_welcome_email_html(user):
    body = (
        _h1("Welcome to Quota Hire",
            "Your account is now fully activated and ready to use") +
        _p(f"Dear <strong>{user}</strong>,") +
        _p(
            "Congratulations. Your email has been successfully verified and your Quota Hire "
            "account is now fully active. We are genuinely delighted to have you as part of "
            "our growing professional community."
        ) +
        _p(
            "Quota Hire is built to bridge the gap between talented professionals and "
            "forward-thinking organisations. Whether you are seeking your next career opportunity "
            "or looking to hire exceptional talent for your company, our platform provides "
            "the tools, visibility, and connections you need to succeed."
        ) +
        _hr() +
        _p("<strong>Here is how to get the most out of Quota Hire:</strong>") +
        _steps([
            "<strong>Complete your profile</strong> - A fully completed profile dramatically "
            "increases your visibility to employers and ensures our platform can match you "
            "with the most relevant opportunities. Add your photo, skills, experience, and education.",
            "<strong>Upload your CV</strong> - Ensure your CV is current, clearly formatted, "
            "and highlights your most significant achievements and qualifications. "
            "Employers can request access to your CV during the application review process.",
            "<strong>Set your job preferences</strong> - Specify your preferred industries, "
            "locations, and role types so we can surface the most relevant listings for you.",
            "<strong>Explore and apply</strong> - Browse our curated listings from verified "
            "employers and submit targeted applications. Track every application in real time "
            "from your personal dashboard.",
            "<strong>Stay informed</strong> - Keep your notification settings updated so you "
            "never miss an update on your applications, new job listings, or platform news.",
        ]) +
        _cta("https://quotahire.org/dashboard", "Complete My Profile Now") +
        _p(
            "If you need any assistance at any stage of your journey on Quota Hire, "
            "our support team is always available at "
            "<a href='mailto:support.qutahire@gmail.com' style='color:#1A6515;'>support.qutahire@gmail.com</a>. "
            "We are committed to ensuring your experience on the platform is smooth, "
            "productive, and rewarding. We wish you every success."
        ) +
        _signoff()
    )
    return _build_email(title="Welcome to Quota Hire", body_html=body)


# =============================================================================
# 4. JOB SUBMITTED FOR REVIEW
# =============================================================================

def get_job_submitted_email_html(user, job_title):
    body = (
        _h1("Job Listing Submitted for Review",
            "Your listing has been received and is pending our team review") +
        _p(f"Dear <strong>{user}</strong>,") +
        _p(
            "Thank you for submitting a job listing on Quota Hire. We have successfully "
            "received your submission and it has been placed in our review queue. "
            "Our team carefully reviews every listing to verify that it is complete, "
            "accurate, and meets our platform standards before it goes live to candidates."
        ) +
        _dbox("Job Listing Submitted", job_title) +
        _p("<strong>What happens next?</strong>") +
        _steps([
            "<strong>Review in progress</strong> - Our team will assess your listing for "
            "accuracy, completeness, appropriate job description detail, and compliance "
            "with our posting guidelines. This process typically takes 1 to 6 hours "
            "during standard business hours.",
            "<strong>Approval and publication</strong> - Once approved, your listing will go "
            "live on the platform immediately and will be visible to thousands of active "
            "job seekers. You will receive an email confirmation the moment it is published.",
            "<strong>Candidate applications</strong> - Qualified candidates can begin applying "
            "to your listing right away. You will receive real-time notifications for each "
            "new application and can manage all applicants from your dashboard.",
            "<strong>Revision requests (if applicable)</strong> - In the rare event that your "
            "listing requires amendments before approval, you will receive a detailed email "
            "specifying exactly what needs to be corrected.",
        ]) +
        _cta("https://quotahire.org/dashboard", "View My Dashboard") +
        _p(
            "If you need to make any changes to your listing before it is reviewed, "
            "please log in to your dashboard and update it immediately. Once a listing "
            "has been approved and is live, any significant edits may require a fresh "
            "review cycle to ensure the information remains accurate for candidates."
        ) +
        _p(
            "Thank you for choosing Quota Hire to support your recruitment needs. "
            "We look forward to helping you find the right candidate quickly and efficiently."
        ) +
        _signoff()
    )
    return _build_email(title="Job listing submitted for review - Quota Hire", body_html=body)


# =============================================================================
# 5. JOB APPROVED
# =============================================================================

def get_job_approved_email_html(user, job_title):
    body = (
        _h1("Your Job Listing is Now Live",
            "Approved and published - candidates can now apply") +
        _p(f"Dear <strong>{user}</strong>,") +
        _p(
            "We are pleased to inform you that your job listing has been reviewed and "
            "approved by our team. It is now live and fully visible on the Quota Hire "
            "platform to our community of professionals and active job seekers."
        ) +
        _dbox("Live Job Listing", job_title) +
        _badge("Active and Published", "green") +
        _p("<strong>What you can do now:</strong>") +
        _steps([
            "<strong>Monitor incoming applications</strong> - All applications are accessible "
            "in real time from your company dashboard. You will also receive email "
            "notifications as each new candidate applies.",
            "<strong>Review candidate profiles and CVs</strong> - Assess each applicant's "
            "qualifications, work experience, skills, and profile to identify your "
            "strongest candidates efficiently.",
            "<strong>Progress applicants through stages</strong> - Move candidates through "
            "the recruitment pipeline by updating their status (Under Review, Interview, "
            "Decision Pending, Accepted, or Rejected). Candidates are automatically "
            "notified by email at each stage.",
            "<strong>Schedule interviews</strong> - Reach out directly to shortlisted "
            "candidates to arrange interview times and share any preparatory information "
            "they may need.",
            "<strong>Manage the listing</strong> - You can update the listing, extend its "
            "duration, or close it at any time directly from your dashboard.",
        ]) +
        _cta("https://quotahire.org/dashboard", "Manage My Listing and Applications") +
        _p(
            "Thank you for trusting Quota Hire with your recruitment needs. "
            "We are committed to connecting you with well-qualified, motivated candidates "
            "as quickly and efficiently as possible. Should you need any assistance, "
            "please do not hesitate to contact us at "
            "<a href='mailto:support.qutahire@gmail.com' style='color:#1A6515;'>support.qutahire@gmail.com</a>."
        ) +
        _signoff()
    )
    return _build_email(title="Your job listing is now live - Quota Hire", body_html=body)


# =============================================================================
# 6. JOB REJECTED
# =============================================================================

def get_job_rejected_email_html(user, job_title):
    body = (
        _h1("Your Job Listing Requires Revision",
            "Your listing was not approved in its current form") +
        _p(f"Dear <strong>{user}</strong>,") +
        _p(
            "Thank you for submitting your job listing on Quota Hire. After a careful "
            "review by our team, we were unable to approve the listing in its current "
            "state. We understand this is not the outcome you were hoping for, and we "
            "want to help you get your listing successfully published as quickly as possible."
        ) +
        _dbox("Listing Requiring Revision", job_title) +
        _badge("Needs Revision", "yellow") +
        _p("<strong>The most common reasons a listing may require revision include:</strong>") +
        _steps([
            "<strong>Incomplete or vague job description</strong> - The responsibilities, "
            "required qualifications, and expectations for the role should be clearly and "
            "specifically defined to attract the right candidates.",
            "<strong>Missing or unclear compensation information</strong> - Listings that "
            "include salary ranges or clear benefit packages consistently attract more "
            "qualified and relevant applicants.",
            "<strong>Incomplete company profile</strong> - A fully completed and verified "
            "company profile builds trust with candidates. Please ensure all company "
            "details are accurate and up to date.",
            "<strong>Guideline non-compliance</strong> - The listing may contain content "
            "that does not meet our platform posting standards. Please review our "
            "guidelines before resubmitting.",
        ]) +
        _p(
            "Please log in to your dashboard, review the listing details, and make the "
            "necessary corrections. Once updated, you can resubmit for approval and our "
            "team will prioritise your re-review to minimise any delay."
        ) +
        _cta("https://quotahire.org/dashboard", "Revise and Resubmit My Listing") +
        _p(
            "If you believe your listing was declined in error, or if you would like "
            "specific guidance on what amendments are required, please contact our support "
            "team directly at "
            "<a href='mailto:support.qutahire@gmail.com' style='color:#1A6515;'>support.qutahire@gmail.com</a> "
            "and reference the job title above. We are here to assist you."
        ) +
        _signoff()
    )
    return _build_email(title="Job listing requires revision - Quota Hire", body_html=body)


# =============================================================================
# 7. APPLICATION CONFIRMED
# =============================================================================

def get_application_confirmed_email_html(user, job_title):
    body = (
        _h1("Application Successfully Submitted",
            "Your application has been received by the hiring team") +
        _p(f"Dear <strong>{user}</strong>,") +
        _p(
            "Your application has been successfully submitted through Quota Hire and this "
            "email serves as your official confirmation. The hiring team has received your "
            "application and it is now in their review queue."
        ) +
        _dbox("Position Applied For", job_title) +
        _p(
            "You can monitor the status of this application at any time from your Quota Hire "
            "dashboard. As your application moves through the recruitment process, you will "
            "receive a separate email notification at each stage so you are always kept informed "
            "and never left wondering about the progress of your application."
        ) +
        _hr() +
        _p("<strong>A typical recruitment journey on Quota Hire looks like this:</strong>") +
        _steps([
            "<strong>Application Received</strong> - Your application is now in the hiring "
            "team queue awaiting their review. This is your current stage.",
            "<strong>Under Review</strong> - The hiring team is actively reviewing your "
            "profile, CV, skills, and application details against the requirements of the role.",
            "<strong>Interview Invitation</strong> - If you are shortlisted, you will be "
            "invited for an interview. All details including format, date, and time will "
            "be communicated to you via email and on your dashboard.",
            "<strong>Decision Pending</strong> - The hiring team has completed interviews "
            "and is in the process of making their final decision.",
            "<strong>Final Outcome</strong> - You will be formally notified of the outcome, "
            "whether successful or otherwise, with a clear and respectful communication.",
        ]) +
        _cta("https://quotahire.org/dashboard", "Track My Application") +
        _p(
            "While you wait, we encourage you to keep your profile fully updated and "
            "continue exploring other relevant opportunities on the platform. "
            "Applying to multiple suitable roles maximises your chances of securing "
            "the right position in the shortest time possible."
        ) +
        _p("We wish you the very best of luck with your application.") +
        _signoff()
    )
    return _build_email(title="Application submitted - Quota Hire", body_html=body)


# =============================================================================
# 8. APPLICATION STATUS UPDATE (generic notification mirror)
# =============================================================================

_STATUS_CONFIG = {
    "Application Under Review": {
        "badge": ("Under Review", "blue"),
        "intro": (
            "We are writing to let you know that your application is now being actively "
            "reviewed by the hiring team. This is a positive indication that your profile "
            "has passed the initial screening and your application is being given serious "
            "consideration by the employer."
        ),
        "detail": (
            "During this stage, the hiring team is carefully evaluating your qualifications, "
            "work experience, skills, and the overall strength of your application against "
            "the requirements of the role. They may also be comparing your profile with "
            "other shortlisted candidates. This stage typically takes between a few days "
            "and one week depending on the volume and complexity of the applications received."
        ),
        "advice": (
            "No action is required from you at this stage. However, we recommend ensuring "
            "that your contact details are accurate and your notification settings are "
            "enabled so you do not miss any updates. Keep your phone and email accessible "
            "as the hiring team may attempt to reach you directly. We will notify you "
            "immediately as soon as your status changes."
        ),
        "cta": ("https://quotahire.org/dashboard", "View Application Status"),
    },
    "Interview Invitation": {
        "badge": ("Interview Invited", "green"),
        "intro": (
            "We are delighted to inform you that you have been shortlisted and invited "
            "for an interview for this position. This is a significant achievement and "
            "reflects the hiring team's genuine interest in your profile, experience, "
            "and the quality of your application. Congratulations on reaching this stage."
        ),
        "detail": (
            "A representative from the company will be in contact with you to arrange the "
            "interview schedule, confirm the format (in-person, virtual video call, or "
            "telephone), and provide any relevant preparation materials or instructions. "
            "Please ensure you are actively monitoring your email inbox and Quota Hire "
            "dashboard for their communication. Respond promptly to any outreach from the employer."
        ),
        "advice": (
            "To prepare effectively for your interview: research the company in depth, "
            "review the full job description carefully, and be prepared to articulate how "
            "your specific skills and experience make you the right fit for this role. "
            "Dress professionally, arrive on time (or join punctually if virtual), bring "
            "copies of your CV, and come with thoughtful questions to ask the interviewer. "
            "Professionalism, preparedness, and genuine enthusiasm go a long way. We wish you every success."
        ),
        "cta": ("https://quotahire.org/dashboard", "View Interview Details"),
    },
    "Decision Pending": {
        "badge": ("Decision Pending", "yellow"),
        "intro": (
            "Thank you for your continued engagement with this opportunity. We are writing "
            "to inform you that you have successfully completed the interview stage and "
            "the hiring team is now in the final stages of their deliberation. A decision "
            "is expected very soon and you will be notified the moment it is made."
        ),
        "detail": (
            "Final hiring decisions involve careful and thorough consideration of all "
            "interviewed candidates in relation to the specific requirements and priorities "
            "of the role. The hiring team is working diligently to reach the right decision "
            "and to communicate it to all candidates in a timely and respectful manner."
        ),
        "advice": (
            "Please continue to monitor your email inbox and Quota Hire dashboard closely. "
            "If you have not received a final decision within a timeframe that seems "
            "unreasonably long, please feel free to contact our support team at "
            "<a href='mailto:support.qutahire@gmail.com' style='color:#1A6515;'>support.qutahire@gmail.com</a> "
            "and we will follow up on your behalf. We appreciate your patience."
        ),
        "cta": ("https://quotahire.org/dashboard", "View My Applications"),
    },
    "Application Accepted": {
        "badge": ("Offer Extended", "green"),
        "intro": (
            "We are absolutely thrilled to inform you that your application has been "
            "successful. The hiring team has made their final decision and selected you "
            "as their preferred candidate for this position. This is a fantastic result "
            "and a true reflection of your qualifications, professionalism, and the "
            "strength of your interview performance. Congratulations."
        ),
        "detail": (
            "A company representative will be contacting you very shortly to discuss "
            "the formal offer details, including your start date, compensation and benefits "
            "package, contract terms, and any onboarding requirements. Please ensure "
            "you are available and responsive to their communications in the coming days "
            "to facilitate a smooth transition into this new role."
        ),
        "advice": (
            "Before formally accepting any offer, please take the time to review all terms "
            "carefully to ensure they align with your expectations. If you have any questions "
            "or require clarification on any aspect of the offer, raise them professionally "
            "and directly with the employer. Once you are satisfied with the offer, "
            "confirming your acceptance in writing is always recommended. "
            "Congratulations once again from the entire Quota Hire team. "
            "We wish you a successful and fulfilling career ahead."
        ),
        "cta": ("https://quotahire.org/dashboard", "View Offer Details"),
    },
    "Application Update": {
        "badge": ("Application Closed", "gray"),
        "intro": (
            "Thank you sincerely for applying through Quota Hire and for the time, "
            "effort, and dedication you invested in pursuing this particular opportunity. "
            "After a thorough and careful review of all applications received, the hiring "
            "team has made the difficult decision to move forward with another candidate "
            "for this role."
        ),
        "detail": (
            "Please be assured that this decision was not made lightly. The level of "
            "competition for this position was significant and the selection process "
            "was conducted with great care and fairness. The outcome of this particular "
            "application does not in any way reflect a judgement on your overall skills, "
            "potential, or professional value. Many highly successful professionals "
            "navigate multiple applications before securing the role that is the right fit."
        ),
        "advice": (
            "We sincerely encourage you not to be discouraged. Continue to build on your "
            "experience, keep your profile and CV up to date, and apply actively to other "
            "relevant roles on the platform. Quota Hire has a growing database of verified "
            "employers across multiple industries, and the right opportunity for your "
            "skills and ambitions is out there. We remain committed to helping you find it. "
            "Thank you again for being part of the Quota Hire community, and we wish you "
            "every success in your continued job search."
        ),
        "cta": ("https://quotahire.org", "Browse More Opportunities"),
    },
}


def get_notification_email_html(user, title, message):
    cfg = _STATUS_CONFIG.get(title, {})

    badge_html = ""
    if cfg.get("badge"):
        badge_html = _badge(*cfg["badge"])

    intro  = cfg.get("intro", message)
    detail = cfg.get("detail", "")
    advice = cfg.get("advice", "")
    href, lbl = cfg.get("cta", ("https://quotahire.org/dashboard", "Go to My Dashboard"))

    body = (
        _h1(title, "An update on your Quota Hire activity") +
        _p(f"Dear <strong>{user}</strong>,") +
        badge_html +
        _p(intro)
    )

    if detail:
        body += _p(detail)

    body += _cta(href, lbl)

    if advice:
        body += _hr() + _p(advice)

    body += _signoff()
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
# COURIER API SENDER
# =============================================================================

def send_courier_email(to_email: str, subject: str, text_content: str, html_content: str) -> bool:
    """
    Sends an email via the Courier REST API.
    Uses channel override to send raw HTML, bypassing the default brand template wrapper.

    The Courier `message.content.body` only accepts plain text.
    To deliver a fully custom HTML email we use `message.channels.email.override`
    which lets us supply `subject` and `html_body` directly.
    """
    url = "https://api.courier.com/send"

    payload = {
        "message": {
            "to": {
                "email": to_email
            },
            "content": {
                "title": subject,
                "body": text_content   # plain-text fallback (subject line used as body)
            },
            "routing": {
                "method": "all",
                "channels": ["email"]
            },
            "channels": {
                "email": {
                    "override": {
                        "subject": subject,
                        "html_body": html_content
                    }
                }
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
