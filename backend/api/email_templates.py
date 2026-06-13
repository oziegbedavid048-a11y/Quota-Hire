"""
Quota Hire — Inline Email Templates

Embedding templates as Python strings removes all file-path dependencies
and guarantees they are always available on any deployment platform.
"""

VERIFICATION_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verify your email for Quota Hire</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #f4fbf2;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
    }}
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #f4fbf2;
      padding: 40px 0;
    }}
    .main {{
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      border: 1px solid #e5f6e2;
      overflow: hidden;
    }}
    .header {{
      padding: 32px;
      text-align: center;
      background: linear-gradient(135deg, #15750a 0%, #116108 100%);
    }}
    .header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }}
    .content {{
      padding: 40px 32px;
      text-align: left;
    }}
    .content h2 {{
      margin-top: 0;
      font-size: 20px;
      color: #0F172A;
    }}
    .content p {{
      font-size: 16px;
      line-height: 1.5;
      color: #475569;
      margin-bottom: 24px;
    }}
    .button-container {{
      text-align: center;
      margin: 32px 0;
    }}
    .button {{
      background: linear-gradient(to right, #15750a, #116108);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 4px 14px rgba(21,117,10,0.3);
    }}
    .footer {{
      padding: 24px 32px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #64748B;
    }}
    .link-fallback {{
      font-size: 12px;
      word-break: break-all;
      color: #94A3B8;
      margin-top: 24px;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <h1>Quota Hire</h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          <h2>Welcome aboard!</h2>
          <p>Hi <b>{user}</b>,</p>
          <p>We're thrilled to have you join Quota Hire — the premier network for sales professionals. To finalise your account setup, please verify your email address by clicking the button below.</p>
          <div class="button-container">
            <a href="{redirect}" class="button">Verify My Email</a>
          </div>
          <p>If you didn't create an account with Quota Hire, you can safely ignore this email.</p>
          <p>Best regards,<br>The Quota Hire Team</p>
          <div class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{redirect}" style="color: #15750a;">{redirect}</a>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; 2026 Quota Hire. All rights reserved.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>"""


RECOVERY_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset your Quota Hire Password</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #f4fbf2;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
    }}
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #f4fbf2;
      padding: 40px 0;
    }}
    .main {{
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05);
      border: 1px solid #e5f6e2;
      overflow: hidden;
    }}
    .header {{
      padding: 32px;
      text-align: center;
      background: linear-gradient(135deg, #15750a 0%, #116108 100%);
    }}
    .header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }}
    .content {{
      padding: 40px 32px;
      text-align: left;
    }}
    .content h2 {{
      margin-top: 0;
      font-size: 20px;
      color: #0F172A;
    }}
    .content p {{
      font-size: 16px;
      line-height: 1.5;
      color: #475569;
      margin-bottom: 24px;
    }}
    .button-container {{
      text-align: center;
      margin: 32px 0;
    }}
    .button {{
      background: linear-gradient(to right, #15750a, #116108);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 4px 14px rgba(21,117,10,0.3);
    }}
    .footer {{
      padding: 24px 32px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #64748B;
    }}
    .link-fallback {{
      font-size: 12px;
      word-break: break-all;
      color: #94A3B8;
      margin-top: 24px;
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="header">
          <h1>Quota Hire</h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          <h2>Password Reset Request</h2>
          <p>Hi <b>{user}</b>,</p>
          <p>We received a request to reset the password associated with your Quota Hire account. You can securely reset your password by clicking the button below.</p>
          <div class="button-container">
            <a href="{redirect}" class="button">Reset Password</a>
          </div>
          <p>If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
          <p>Best regards,<br>The Quota Hire Team</p>
          <div class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{redirect}" style="color: #15750a;">{redirect}</a>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          &copy; 2026 Quota Hire. All rights reserved.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>"""


def get_verification_email_html(user: str, redirect: str) -> str:
    """Return the verification email HTML with placeholders filled in."""
    return VERIFICATION_EMAIL_TEMPLATE.format(user=user, redirect=redirect)


def get_recovery_email_html(user: str, redirect: str) -> str:
    """Return the password recovery email HTML with placeholders filled in."""
    return RECOVERY_EMAIL_TEMPLATE.format(user=user, redirect=redirect)

import json
import urllib.request
import urllib.error
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_courier_email(to_email: str, subject: str, text_content: str, html_content: str):
    """Sends an email using the Courier REST API."""
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
        logger.error(f"Failed to send Courier email: {str(e)}")
        raise e
