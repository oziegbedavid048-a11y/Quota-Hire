"""
Quotahire — transactional email templates.

The rules this file follows, and why:

* **The body is plain text set in HTML.** No cards, no panels, no coloured
  boxes, no buttons, no badges, no rules. Just paragraphs and inline links,
  the way a person writes an email. Anything decorative was removed on
  purpose; please do not add it back.
* **The logo is a hosted PNG.** Every mail client of consequence — Gmail,
  Outlook and Yahoo among them — strips inline ``<svg>``, so the SVG logo
  this file used to carry never once reached a recipient's screen. A hosted
  PNG is the only form all of them render.
* **Brand colour appears once, in the footer.** A gradient with a solid
  ``bgcolor`` underneath it, because Outlook ignores CSS gradients.
* **Every style is inline.** Gmail's handling of ``<style>`` blocks is not
  dependable, so the ``<head>`` carries only the responsive media query.
* **Copy is short.** One purpose per email: what happened, what to do, what
  happens next.
* **Everything user-supplied is escaped** before it reaches the HTML
  (QH-18) — these messages are sent from a domain that passes SPF and DKIM,
  so injected markup would read as entirely genuine.
"""

from django.utils.html import escape
from html import unescape
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging
import re

logger = logging.getLogger(__name__)


# =============================================================================
# BRAND
# =============================================================================

# Served from the marketing site's public/ directory. Absolute and hard-coded:
# a logo URL that resolves to localhost in one environment is a broken image in
# every email that environment sends.
LOGO_URL = "https://quotahire.org/email-logo.png"

SITE_URL = "https://quotahire.org"
SUPPORT_EMAIL = "support@quotahire.org"

# Quotahire's regional domains, primary first. All three resolve to the same
# application, so the footer lists every one and a reader can use whichever
# belongs to their region. Links inside the body of a message deliberately do
# not use this list: those are built from FRONTEND_URL, because a verification
# or password-reset link must land on the domain the token was minted for.
DOMAINS = ("quotahire.co.uk", "quotahire.ng", "quotahire.org")

# A postal address in the footer is not decoration. Bulk commercial mail is
# required to carry one (CAN-SPAM in the US, and it is expected under PECR and
# the GDPR's transparency rules here), and its absence is a well-known spam
# signal. This is the address published in the site's privacy policy.
POSTAL_ADDRESS = "128 City Road, London EC1V 2NX, United Kingdom"

# Footer navigation. Every path is a real route in src/App.tsx — a dead link in
# a footer that goes to every user is worse than no link at all.
FOOTER_LINKS = (
    ("Browse jobs", "/jobs"),
    ("My dashboard", "/dashboard"),
    ("Contact us", "/contact"),
    ("Privacy policy", "/privacy"),
    ("Email preferences", "/settings"),
)

BRAND_DARK = "#15750a"

# The dashboard overview's hero card gradient, which is what the brand
# gradient means here: a pale green wash through white into a pale amber.
# In Tailwind that card is `from-accent-500/10 via-white to-warm-500/10`;
# these are those three tints flattened onto white, because email clients
# have no notion of an alpha-composited colour.
FOOTER_TINT_GREEN = "#e8f1e7"   # accent-500 #15750a at 10% over white
FOOTER_TINT_AMBER = "#fef5e7"   # warm-500   #f59e0b at 10% over white
FOOTER_GRADIENT = f"linear-gradient(135deg,{FOOTER_TINT_GREEN} 0%,#ffffff 52%,{FOOTER_TINT_AMBER} 100%)"
# Outlook ignores CSS gradients, so it gets a single tint from the same family.
FOOTER_FALLBACK = "#f4f7f2"

FONT = ("-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,"
        "Helvetica,Arial,sans-serif")
MONO = "'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace"

P_STYLE = f"margin:0 0 16px;font-family:{FONT};font-size:15px;line-height:1.65;color:#2b2f33;"
A_STYLE = f"color:{BRAND_DARK};text-decoration:underline;"
CODE_STYLE = (f"margin:4px 0 20px;font-family:{MONO};font-size:30px;line-height:1.2;"
              "font-weight:700;letter-spacing:8px;color:#111111;")
NOTE_STYLE = f"margin:0 0 16px;font-family:{FONT};font-size:13px;line-height:1.6;color:#6b7280;"


# =============================================================================
# HTML SHELL
# =============================================================================

def _preheader_from(body_html):
    """First real sentence of the email, for the inbox preview line.

    Mail clients show the opening body text beside the subject. Left alone
    that is the greeting — "Hi David," — which tells the reader nothing.
    Skipping the greeting puts the actual news in the preview.
    """
    for para in re.findall(r"<p[^>]*>(.*?)</p>", body_html, re.S):
        text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", para)).strip()
        if not text or text.lower().startswith("hi "):
            continue
        return text[:140]
    return ""


def _footer_html():
    """The footer: who sent this, where to go next, and where we are.

    A few short lines rather than one. A transactional footer is the only part
    of the message that is the same every time, so it is where the things a
    reader occasionally needs belong — a way back into the product, a way to
    reach a person, the preferences page, and the postal address that bulk
    mail is required to carry. Kept to small type on the pale brand wash so it
    reads as a signature block and never competes with the message above it.
    """
    dot = '<span style="color:#a3ab9f;">&nbsp;&middot;&nbsp;</span>'

    nav = dot.join(
        f'<a href="{SITE_URL}{path}" style="color:{BRAND_DARK};text-decoration:none;'
        f'white-space:nowrap;">{label}</a>'
        for label, path in FOOTER_LINKS
    )
    domains = dot.join(
        f'<a href="https://{d}" style="color:#3f4a3d;text-decoration:none;'
        f'white-space:nowrap;">{d}</a>'
        for d in DOMAINS
    )

    return (
        f'<p style="margin:0 0 10px;font-family:{FONT};font-size:14px;line-height:1.4;'
        'font-weight:700;color:#111111;letter-spacing:-0.2px;">Quotahire</p>'

        f'<p style="margin:0 0 8px;font-family:{FONT};font-size:12.5px;line-height:1.9;'
        f'font-weight:600;">{nav}</p>'

        f'<p style="margin:0 0 16px;font-family:{FONT};font-size:12.5px;line-height:1.9;'
        f'">{domains}</p>'

        '<div style="height:1px;line-height:1px;font-size:0;background-color:#dfe5db;'
        'margin:0 0 14px;">&nbsp;</div>'

        f'<p style="margin:0 0 6px;font-family:{FONT};font-size:11.5px;line-height:1.65;'
        f'color:#7b837a;">{POSTAL_ADDRESS}<br>'
        f'<a href="mailto:{SUPPORT_EMAIL}" style="color:#7b837a;text-decoration:underline;">'
        f'{SUPPORT_EMAIL}</a></p>'

        f'<p style="margin:0;font-family:{FONT};font-size:11.5px;line-height:1.65;'
        'color:#7b837a;">&copy; 2026 Quotahire. You are receiving this because you have '
        'an account with us.</p>'
    )


def _build_email(*, title, body_html, preheader=None):
    """Wraps a body in the logo header and the brand footer."""
    preview = preheader if preheader is not None else _preheader_from(body_html)
    # The invisible padding characters stop Gmail from dragging the opening
    # lines of the body into the preview line behind the preheader.
    preview_block = (
        '<div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;'
        'mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;">'
        + preview + ("&#8199;&#65279;&#847;" * 30) +
        "</div>"
    ) if preview else ""

    return (
        "<!DOCTYPE html>"
        '<html lang="en">'
        "<head>"
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        '<meta name="color-scheme" content="light">'
        f"<title>{title}</title>"
        "<style>"
        "body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}"
        "table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}"
        "img{border:0;outline:none;text-decoration:none;}"
        "@media only screen and (max-width:620px){"
        ".qh-shell{width:100%!important;}"
        ".qh-pad{padding-left:22px!important;padding-right:22px!important;}}"
        "</style>"
        "</head>"
        '<body style="margin:0;padding:0;background-color:#ffffff;">'
        + preview_block +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"'
        ' style="background-color:#ffffff;"><tr>'
        '<td align="center" style="padding:0;">'
        '<table role="presentation" class="qh-shell" width="600" cellpadding="0" cellspacing="0"'
        ' border="0" style="width:600px;max-width:600px;">'

        # Header: logo and wordmark, nothing else.
        '<tr><td class="qh-pad" style="padding:32px 36px 22px;">'
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>'
        '<td style="padding-right:12px;vertical-align:middle;">'
        f'<img src="{LOGO_URL}" width="40" height="40" alt="Quotahire"'
        ' style="display:block;width:40px;height:40px;">'
        "</td>"
        f'<td style="vertical-align:middle;font-family:{FONT};font-size:17px;'
        'font-weight:700;color:#111111;letter-spacing:-0.2px;">Quotahire</td>'
        "</tr></table>"
        "</td></tr>"

        # Body.
        f'<tr><td class="qh-pad" style="padding:0 36px 30px;">{body_html}</td></tr>'

        # Footer: the one place brand colour appears. The wash is pale, so the
        # type on it stays dark, and a hairline keeps it from bleeding into
        # the body.
        f'<tr><td class="qh-pad" bgcolor="{FOOTER_FALLBACK}"'
        f' style="background-color:{FOOTER_FALLBACK};background-image:{FOOTER_GRADIENT};'
        'border-top:1px solid #e7ebe4;padding:24px 36px 26px;">'
        + _footer_html() +
        "</td></tr>"

        "</table></td></tr></table>"
        "</body></html>"
    )


# =============================================================================
# BODY PIECES
# =============================================================================

def _esc(value):
    """HTML-escape a value destined for an email body (QH-18).

    These templates build HTML with f-strings, and every field they
    interpolate — display names, job titles, notification text — originates
    from user input. Nothing was escaped, so an attacker could inject markup
    into a message delivered from the platform's own verified domain, which
    passes SPF and DKIM and therefore reads as entirely genuine.

    Falsy values are returned unchanged so that callers relying on
    `if job_title:` style checks keep working, and so None never renders as
    the literal string "None".
    """
    if not value:
        return value
    return escape(str(value))


def _p(text):
    return f'<p style="{P_STYLE}">{text}</p>'


def _note(text):
    """A quieter line, for expiry details, fallback links and small print."""
    return f'<p style="{NOTE_STYLE}">{text}</p>'


def _a(href, label):
    return f'<a href="{href}" style="{A_STYLE}">{label}</a>'


def _action(href, label):
    """The email's single action, as a link on its own line rather than a
    button. A button is layout; a link is how a colleague would send you
    somewhere."""
    return f'<p style="{P_STYLE}font-weight:600;">{_a(href, label)}</p>'


def _code(value):
    return f'<p style="{CODE_STYLE}">{value}</p>'


def _signoff():
    return _p("Kind regards,<br>The Quotahire Team")


def to_plain_text(html_content: str) -> str:
    """The text/plain alternative, derived from the HTML the reader will see.

    Every message goes out as multipart: the HTML part and a plain-text part.
    The text part was previously written by hand at each call site, and had
    drifted — some senders passed the subject line as the whole body, others
    the first two hundred characters of a newsletter. Deriving it from the
    HTML means the two halves of a message can never disagree, and it gives
    text-only clients, screen readers and spam filters a full copy of what
    was actually sent.

    Links are rendered as "label: url" so nothing is lost when the anchor
    cannot be clicked, unless the label already is the URL.
    """
    if not html_content:
        return ""

    # The header and footer are chrome; the reader wants the message.
    body = html_content
    if 'class="qh-pad" style="padding:0 36px 30px;">' in body:
        body = body.split('class="qh-pad" style="padding:0 36px 30px;">', 1)[1]
        body = body.split('<tr><td class="qh-pad" bgcolor', 1)[0]

    def _unwrap_link(match):
        href, label = match.group(1), re.sub(r"<[^>]+>", "", match.group(2)).strip()
        if not label or href.startswith("mailto:") or label in href:
            return label or href
        return f"{label}: {href}"

    body = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', _unwrap_link, body, flags=re.S)
    body = re.sub(r"<br\s*/?>", "\n", body)
    body = re.sub(r"</p\s*>", "\n\n", body)
    body = re.sub(r"<[^>]+>", "", body)

    text = unescape(body)
    lines = [ln.strip() for ln in text.split("\n")]
    out = []
    for line in lines:
        if line or (out and out[-1]):
            out.append(line)
    signature = "\n".join([
        "--",
        "Quotahire",
        "  ".join(DOMAINS),
        POSTAL_ADDRESS,
        SUPPORT_EMAIL,
    ])
    return "\n".join(out).strip() + "\n" + signature


# =============================================================================
# 1. EMAIL VERIFICATION
# =============================================================================

def get_verification_email_html(user, redirect):
    user = _esc(user)
    redirect = _esc(redirect)
    body = (
        _p(f"Hi {user},") +
        _p("Please confirm your email address to finish setting up your Quotahire account.") +
        _action(redirect, "Confirm my email address") +
        _p("The link expires in 24 hours. If you did not create an account, you can ignore "
           "this email.") +
        _note(f"If the link does not open, paste this into your browser:<br>{redirect}") +
        _signoff()
    )
    return _build_email(title="Confirm your email address - Quotahire", body_html=body)


# =============================================================================
# 2. PASSWORD RESET
# =============================================================================

def get_recovery_email_html(user, redirect):
    user = _esc(user)
    redirect = _esc(redirect)
    body = (
        _p(f"Hi {user},") +
        _p("We received a request to reset the password on your Quotahire account.") +
        _action(redirect, "Choose a new password") +
        _p("The link expires in 10 minutes and can be used once. If you did not request this, "
           "no action is needed and your password stays as it is.") +
        _note(f"If the link does not open, paste this into your browser:<br>{redirect}") +
        _signoff()
    )
    return _build_email(title="Reset your password - Quotahire", body_html=body)


def get_mobile_otp_email_html(user, otp_code):
    """Six-digit code for resetting a password in the mobile app."""
    user = _esc(user)
    otp_code = _esc(otp_code)
    body = (
        _p(f"Hi {user},") +
        _p("Enter this code in the Quotahire app to reset your password.") +
        _code(otp_code) +
        _p("The code expires in 30 minutes and can be used once. Please do not share it with "
           "anyone.") +
        _p("If you did not request a password reset, you can ignore this email.") +
        _signoff()
    )
    return _build_email(title="Your password reset code - Quotahire", body_html=body)


def get_login_otp_email_html(user, otp_code):
    """Six-digit code for passwordless sign-in in the mobile app."""
    user = _esc(user)
    otp_code = _esc(otp_code)
    body = (
        _p(f"Hi {user},") +
        _p("Here is your sign-in code for Quotahire.") +
        _code(otp_code) +
        _p("The code expires in 30 minutes and can be used once. Quotahire staff will never "
           "ask you for it.") +
        _p("If you did not try to sign in, you can ignore this email.") +
        _signoff()
    )
    return _build_email(title="Your sign-in code - Quotahire", body_html=body)


# =============================================================================
# 3. WELCOME (sent after email verification)
# =============================================================================

def get_welcome_email_html(user, is_company=False):
    user = _esc(user)
    dashboard = f"{SITE_URL}/dashboard"
    if is_company:
        body = (
            _p(f"Hi {user},") +
            _p("Your email is confirmed and your Quotahire company account is active.") +
            _p("You can now complete your company profile and post your first role. Every "
               "listing is reviewed before it goes live, which usually takes a few hours.") +
            _action(dashboard, "Go to my dashboard") +
            _signoff()
        )
    else:
        body = (
            _p(f"Hi {user},") +
            _p("Your email is confirmed and your Quotahire account is ready.") +
            _p("Add your experience, skills and CV to your profile. Employers search on those "
               "details, and a complete profile is needed before you can apply for a role.") +
            _action(dashboard, "Complete my profile") +
            _signoff()
        )
    return _build_email(title="Your account is ready - Quotahire", body_html=body)


# =============================================================================
# 4. JOB SUBMITTED FOR REVIEW & PROMOTED JOB PAYMENT
# =============================================================================

PROMOTED_JOB_PRICING = {
    'NGN': {'amount': '50,000',   'symbol': '₦',   'code': 'NGN', 'formatted': '₦50,000 NGN'},
    'USD': {'amount': '35',       'symbol': '$',   'code': 'USD', 'formatted': '$35 USD'},
    'EUR': {'amount': '32',       'symbol': '€',   'code': 'EUR', 'formatted': '€32 EUR'},
    'GBP': {'amount': '28',       'symbol': '£',   'code': 'GBP', 'formatted': '£28 GBP'},
    'CAD': {'amount': '48',       'symbol': 'CA$', 'code': 'CAD', 'formatted': 'CA$48 CAD'},
    'AUD': {'amount': '52',       'symbol': 'AU$', 'code': 'AUD', 'formatted': 'AU$52 AUD'},
    'ZAR': {'amount': '620',      'symbol': 'R',   'code': 'ZAR', 'formatted': 'R620 ZAR'},
    'KES': {'amount': '4,500',    'symbol': 'KSh', 'code': 'KES', 'formatted': 'KSh 4,500 KES'},
    'GHS': {'amount': '520',      'symbol': 'GH₵', 'code': 'GHS', 'formatted': 'GH₵ 520 GHS'},
    'AED': {'amount': '130',      'symbol': 'AED', 'code': 'AED', 'formatted': 'AED 130'},
    'SAR': {'amount': '130',      'symbol': 'SAR', 'code': 'SAR', 'formatted': 'SAR 130'},
    'INR': {'amount': '2,900',    'symbol': '₹',   'code': 'INR', 'formatted': '₹2,900 INR'},
    'JPY': {'amount': '5,200',    'symbol': '¥',   'code': 'JPY', 'formatted': '¥5,200 JPY'},
    'CNY': {'amount': '250',      'symbol': '¥',   'code': 'CNY', 'formatted': '¥250 CNY'},
    'SGD': {'amount': '46',       'symbol': 'S$',  'code': 'SGD', 'formatted': 'S$46 SGD'},
    'NZD': {'amount': '58',       'symbol': 'NZ$', 'code': 'NZD', 'formatted': 'NZ$58 NZD'},
    'CHF': {'amount': '30',       'symbol': 'CHF', 'code': 'CHF', 'formatted': 'CHF 30'},
    'BRL': {'amount': '190',      'symbol': 'R$',  'code': 'BRL', 'formatted': 'R$ 190 BRL'},
    'MXN': {'amount': '650',      'symbol': 'Mex$', 'code': 'MXN', 'formatted': 'Mex$ 650 MXN'},
    'SEK': {'amount': '360',      'symbol': 'kr',  'code': 'SEK', 'formatted': '360 kr SEK'},
    'KRW': {'amount': '47,000',   'symbol': '₩',   'code': 'KRW', 'formatted': '₩47,000 KRW'},
    'RUB': {'amount': '3,200',    'symbol': '₽',   'code': 'RUB', 'formatted': '3,200 ₽ RUB'},
    'TRY': {'amount': '1,150',    'symbol': '₺',   'code': 'TRY', 'formatted': '1,150 ₺ TRY'},
    'ARS': {'amount': '34,000',   'symbol': '$',   'code': 'ARS', 'formatted': '$34,000 ARS'},
    'COP': {'amount': '140,000',  'symbol': '$',   'code': 'COP', 'formatted': '$140,000 COP'},
    'CLP': {'amount': '33,000',   'symbol': '$',   'code': 'CLP', 'formatted': '$33,000 CLP'},
    'PEN': {'amount': '130',      'symbol': 'S/',  'code': 'PEN', 'formatted': 'S/ 130 PEN'},
    'VND': {'amount': '880,000',  'symbol': '₫',   'code': 'VND', 'formatted': '₫880,000 VND'},
    'THB': {'amount': '1,200',    'symbol': '฿',   'code': 'THB', 'formatted': '฿1,200 THB'},
    'IDR': {'amount': '550,000',  'symbol': 'Rp',  'code': 'IDR', 'formatted': 'Rp 550,000 IDR'},
    'MYR': {'amount': '150',      'symbol': 'RM',  'code': 'MYR', 'formatted': 'RM 150 MYR'},
    'PHP': {'amount': '1,950',    'symbol': '₱',   'code': 'PHP', 'formatted': '₱1,950 PHP'},
    'PKR': {'amount': '9,800',    'symbol': '₨',   'code': 'PKR', 'formatted': '₨9,800 PKR'},
    'EGP': {'amount': '1,700',    'symbol': 'E£',  'code': 'EGP', 'formatted': 'E£ 1,700 EGP'},
    'ILS': {'amount': '130',      'symbol': '₪',   'code': 'ILS', 'formatted': '₪130 ILS'},
    'HKD': {'amount': '270',      'symbol': 'HK$', 'code': 'HKD', 'formatted': 'HK$270 HKD'},
}


def get_promoted_job_fee(currency_code: str = 'USD') -> dict:
    """Returns the localized fee equivalent of 50,000 NGN for the given currency code."""
    code = (currency_code or 'USD').strip().upper()
    if code in PROMOTED_JOB_PRICING:
        return PROMOTED_JOB_PRICING[code]
    return PROMOTED_JOB_PRICING['USD']


def get_job_submitted_email_html(user, job_title, package=None, currency='USD'):
    user = _esc(user)
    job_title = _esc(job_title)
    dashboard = f"{SITE_URL}/dashboard"

    if package == 'promoted':
        fee = _esc(get_promoted_job_fee(currency)['formatted'])
        paystack_url = "https://paystack.shop/pay/li1aaf6q8c"
        body = (
            _p(f"Hi {user},") +
            _p(f"We have received your listing for <strong>{job_title}</strong> under the "
               "Promoted Job and Direct Applicant Access plan.") +
            _p(f"The one-time promotion fee is <strong>{fee}</strong>. Your listing goes live "
               "as soon as the payment clears.") +
            _p("The plan gives you priority placement in the job feed, applicant profiles and "
               "contact details as they apply, full CV and cover letter downloads, and no "
               "placement fee when you hire.") +
            _action(paystack_url, "Pay securely via Paystack") +
            _note(f"Payment link: {paystack_url}") +
            _p(f"You can review the submission on your {_a(dashboard, 'dashboard')} at any time. "
               f"For an invoice or bank transfer details, reply to this email or write to "
               f"{_a('mailto:' + SUPPORT_EMAIL, SUPPORT_EMAIL)}.") +
            _signoff()
        )
        return _build_email(
            title="Complete payment to publish your job - Quotahire",
            body_html=body,
        )

    body = (
        _p(f"Hi {user},") +
        _p(f"Your listing for <strong>{job_title}</strong> has been submitted and is now in "
           "our review queue.") +
        _p("We review every listing before it goes live. You will get an email as soon as "
           "yours is approved, usually within one to six hours.") +
        _action(dashboard, "View my dashboard") +
        _signoff()
    )
    return _build_email(title="Job listing submitted - Quotahire", body_html=body)


# =============================================================================
# 5. JOB APPROVED
# =============================================================================

def get_job_approved_email_html(user, job_title, job_code):
    user = _esc(user)
    job_title = _esc(job_title)
    job_code = _esc(job_code)
    frontend_url = getattr(settings, 'FRONTEND_URL', SITE_URL).strip()
    share_link = f"{frontend_url}/jobs?code={job_code}"
    body = (
        _p(f"Hi {user},") +
        _p(f"Your listing for <strong>{job_title}</strong> has been approved and is now live "
           "on Quotahire.") +
        _p(f"Its job code is <strong>{job_code}</strong>. Share the link below with candidates "
           "so they can go straight to the role. Anyone without an account is asked to sign up "
           "first.") +
        _action(share_link, "View the live listing") +
        _note(f"Shareable link: {share_link}") +
        _signoff()
    )
    return _build_email(title="Your job listing is live - Quotahire", body_html=body)


# =============================================================================
# 6. JOB REJECTED
# =============================================================================

def get_job_rejected_email_html(user, job_title):
    user = _esc(user)
    job_title = _esc(job_title)
    dashboard = f"{SITE_URL}/dashboard"
    body = (
        _p(f"Hi {user},") +
        _p(f"We have reviewed your listing for <strong>{job_title}</strong> and cannot approve "
           "it as it stands.") +
        _p("That is usually down to an incomplete job description, missing compensation "
           "details, or wording that does not meet our listing guidelines. Update the listing "
           "on your dashboard and resubmit it, and we will prioritise the re-review.") +
        _action(dashboard, "Revise my listing") +
        _p(f"If you would like to know exactly what to change, write to "
           f"{_a('mailto:' + SUPPORT_EMAIL, SUPPORT_EMAIL)}.") +
        _signoff()
    )
    return _build_email(title="Your job listing needs a revision - Quotahire", body_html=body)


# =============================================================================
# 7. APPLICATION CONFIRMED
# =============================================================================

def get_application_confirmed_email_html(user, job_title):
    user = _esc(user)
    job_title = _esc(job_title)
    dashboard = f"{SITE_URL}/dashboard"
    body = (
        _p(f"Hi {user},") +
        _p(f"Your application for <strong>{job_title}</strong> has been sent to the hiring "
           "team. This email is your confirmation.") +
        _p("We will email you each time the status of your application changes. You can also "
           "follow it from your dashboard.") +
        _action(dashboard, "Track my application") +
        _signoff()
    )
    return _build_email(title="Application submitted - Quotahire", body_html=body)


# =============================================================================
# 8. APPLICATION STATUS UPDATE
# =============================================================================

# One entry per status. `intro` is used when no job title is available;
# `intro_job` takes the escaped job title when there is one.
_STATUS_CONFIG = {
    "Application Under Review": {
        "intro": "Your application is now being reviewed by the hiring team.",
        "intro_job": "Your application for <strong>{job}</strong> is now being reviewed by "
                     "the hiring team.",
        "detail": "Nothing is needed from you at this stage. Keep your contact details current, "
                  "as the team may reach out directly, and we will email you the moment "
                  "anything changes.",
        "cta": ("/dashboard", "View my application"),
    },
    "Interview Invitation": {
        "intro": "You have been shortlisted for an interview.",
        "intro_job": "You have been shortlisted for an interview for the <strong>{job}</strong> "
                     "position.",
        "detail": "Someone from the company will contact you to agree the format, date and "
                  "time. Please keep an eye on your inbox and reply promptly. Good luck.",
        "cta": ("/dashboard", "View the details"),
    },
    "Decision Pending": {
        "intro": "You have completed the interview stage and the hiring team is making its "
                 "final decision.",
        "intro_job": "You have completed the interview stage for <strong>{job}</strong> and the "
                     "hiring team is making its final decision.",
        "detail": "We will write to you as soon as there is an outcome. Nothing is needed from "
                  "you in the meantime.",
        "cta": ("/dashboard", "View my applications"),
    },
    "Application Accepted": {
        "intro": "Your application has been successful and the hiring team has chosen you for "
                 "the role. Congratulations.",
        "intro_job": "Your application for <strong>{job}</strong> has been successful and the "
                     "hiring team has chosen you for the role. Congratulations.",
        "detail": "A representative from the company will contact you shortly about the offer, "
                  "your start date and the contract terms. Please watch your inbox.",
        "cta": ("/dashboard", "View my offer"),
    },
    "Application Update": {
        "intro": "Thank you for applying. The hiring team has decided to go forward with "
                 "another candidate.",
        "intro_job": "Thank you for applying for <strong>{job}</strong>. The hiring team has "
                     "decided to go forward with another candidate.",
        "detail": "This is not a reflection of your experience. Your profile stays active, and "
                  "we will keep putting matching roles in front of you.",
        "cta": ("", "Browse other roles"),
    },
}

# Stages where the employer may still ask for the CV that was submitted.
_CV_REMINDER_STAGES = (
    "Application Under Review",
    "Interview Invitation",
)


def get_notification_email_html(user, title, message, job_title=None, is_remote=False,
                                employment_type=None):
    """Renders an application-status update.

    `is_remote` and `employment_type` are accepted because the existing
    callers pass them. They no longer change the wording: the old version
    appended "(remote/freelance)" to the interview line, which added length
    without telling the candidate anything the listing had not already said.
    """
    user = _esc(user)
    title = _esc(title)
    message = _esc(message)
    job_title = _esc(job_title)
    cfg = _STATUS_CONFIG.get(title, {})

    if cfg:
        intro = cfg["intro_job"].format(job=job_title) if job_title else cfg["intro"]
    else:
        # An ad-hoc notification: its own message is the body.
        intro = message

    body = _p(f"Hi {user},") + _p(intro)

    if cfg.get("detail"):
        body += _p(cfg["detail"])

    if title in _CV_REMINDER_STAGES:
        body += _p("Have the CV you applied with ready, as the hiring team may ask for it. "
                   "You can download it from your dashboard.")

    path, label = cfg.get("cta", ("/dashboard", "Go to my dashboard"))
    body += _action(f"{SITE_URL}{path}", label) + _signoff()

    return _build_email(title=f"{title} - Quotahire", body_html=body)


# =============================================================================
# 9. NEWSLETTER / ADMIN BROADCAST
# =============================================================================

def get_newsletter_email_html(subject, plain_body):
    paragraphs = [p.strip() for p in plain_body.strip().split("\n") if p.strip()]
    body = "".join(_p(para) for para in paragraphs) + _signoff()
    return _build_email(title=f"{subject} - Quotahire", body_html=body)


# =============================================================================
# ZEPTOMAIL SMTP SENDER
# =============================================================================

def send_courier_email(to_email: str, subject: str, text_content: str, html_content: str) -> bool:
    """
    Dispatches the email sending task to Celery's task queue so it is sent
    asynchronously without blocking the HTTP request thread.
    If Celery or Redis is unreachable/down, falls back to synchronous sending to ensure delivery.
    """
    # The plain-text part always mirrors the HTML, so the two cannot drift.
    # `text_content` is only used for the rare message that has no HTML at all.
    if html_content:
        text_content = to_plain_text(html_content)

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


# =============================================================================
# 10. CUSTOM ADMIN MESSAGE
# =============================================================================

def get_custom_admin_email_html(plain_body, attachment_name=None, attachment_is_image=False,
                                attachments=None):
    """A message typed by an administrator, in the same shell as every other
    email. Any attachments are named at the end, and inline images are shown.
    """
    paragraphs = [p.strip() for p in plain_body.strip().split("\n") if p.strip()]
    body = "".join(_p(para) for para in paragraphs)

    # Keep the older single-attachment arguments working.
    unified = list(attachments) if attachments else []
    if not unified and attachment_name:
        unified.append({
            'name': attachment_name,
            'is_image': attachment_is_image,
            'cid': 'attached_image',
        })

    for att in unified:
        name = _esc(att.get('name')) or 'Attachment'
        cid = att.get('cid')
        if att.get('is_image') and cid:
            body += _note(f"Attached image: {name}")
            body += (f'<img src="cid:{cid}" alt="{name}" style="display:block;max-width:100%;'
                     'height:auto;margin:0 0 16px;">')
        else:
            body += _note(f"Attached file: {name}")

    return _build_email(title="A message from Quotahire", body_html=body)
