"""
Quota Hire — Inline Email Templates

Embedding templates as Python strings removes all file-path dependencies
and guarantees they are always available on any deployment platform.
"""

VERIFICATION_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Verify your email for Quota Hire</title>
  <style>
    /* Reset and Base */
    body {{
      margin: 0;
      padding: 0;
      background-color: #f4fbf2;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      -webkit-font-smoothing: antialiased;
    }}
    
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #f4fbf2;
      padding: 60px 0;
    }}
    
    .main {{
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(21, 117, 10, 0.1), 0 8px 10px -6px rgba(21, 117, 10, 0.1);
      border: 1px solid #e5f6e2;
      overflow: hidden;
    }}

    /* Shader Animation Simulation */
    @keyframes gradientFlow {{
      0% {{ background-position: 0% 50%; }}
      50% {{ background-position: 100% 50%; }}
      100% {{ background-position: 0% 50%; }}
    }}

    .header {{
      padding: 40px 32px;
      text-align: center;
      /* Animated gradient simulating a shader */
      background: linear-gradient(270deg, #15750a, #1a8f0c, #0d4d06, #116108);
      background-size: 300% 300%;
      animation: gradientFlow 8s ease infinite;
      position: relative;
    }}

    .header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }}
    
    .content {{
      padding: 48px 40px;
      text-align: left;
    }}
    
    .content h2 {{
      margin-top: 0;
      font-size: 24px;
      color: #0F172A;
      font-weight: 700;
    }}
    
    .content p {{
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }}

    .button-container {{
      text-align: center;
      margin: 40px 0;
    }}

    .button {{
      background: linear-gradient(to right, #15750a, #116108);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 8px 20px rgba(21, 117, 10, 0.25);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      letter-spacing: 0.5px;
    }}
    
    .button:hover {{
      box-shadow: 0 10px 25px rgba(21, 117, 10, 0.4);
    }}

    .footer {{
      padding: 32px 40px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #64748B;
    }}

    .link-fallback {{
      font-size: 13px;
      word-break: break-all;
      color: #94A3B8;
      margin-top: 32px;
      padding: 16px;
      background-color: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }}

    .link-fallback a {{
      color: #15750a;
      font-weight: 600;
    }}

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {{
      body, .wrapper {{
        background-color: #09090b !important;
      }}
      .main {{
        background-color: #18181b !important;
        border-color: #27272a !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
      }}
      .content h2 {{
        color: #f4f4f5 !important;
      }}
      .content p {{
        color: #a1a1aa !important;
      }}
      .footer {{
        background-color: #18181b !important;
        border-top-color: #27272a !important;
        color: #71717a !important;
      }}
      .link-fallback {{
        background-color: #27272a !important;
        border-color: #3f3f46 !important;
        color: #a1a1aa !important;
      }}
      .link-fallback a {{
        color: #4ade80 !important;
      }}
      .button {{
        box-shadow: 0 8px 20px rgba(74, 222, 128, 0.15) !important;
      }}
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
          <p>Best regards,<br><b>The Quota Hire Team</b></p>
          
          <div class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br><br>
            <a href="{redirect}">{redirect}</a>
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
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset your Quota Hire Password</title>
  <style>
    /* Reset and Base */
    body {{
      margin: 0;
      padding: 0;
      background-color: #f4fbf2;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      -webkit-font-smoothing: antialiased;
    }}
    
    .wrapper {{
      width: 100%;
      table-layout: fixed;
      background-color: #f4fbf2;
      padding: 60px 0;
    }}
    
    .main {{
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 24px;
      box-shadow: 0 10px 25px -5px rgba(21, 117, 10, 0.1), 0 8px 10px -6px rgba(21, 117, 10, 0.1);
      border: 1px solid #e5f6e2;
      overflow: hidden;
    }}

    /* Shader Animation Simulation */
    @keyframes gradientFlow {{
      0% {{ background-position: 0% 50%; }}
      50% {{ background-position: 100% 50%; }}
      100% {{ background-position: 0% 50%; }}
    }}

    .header {{
      padding: 40px 32px;
      text-align: center;
      /* Animated gradient simulating a shader */
      background: linear-gradient(270deg, #15750a, #1a8f0c, #0d4d06, #116108);
      background-size: 300% 300%;
      animation: gradientFlow 8s ease infinite;
      position: relative;
    }}

    .header h1 {{
      margin: 0;
      color: #ffffff;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }}
    
    .content {{
      padding: 48px 40px;
      text-align: left;
    }}
    
    .content h2 {{
      margin-top: 0;
      font-size: 24px;
      color: #0F172A;
      font-weight: 700;
    }}
    
    .content p {{
      font-size: 16px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }}

    .button-container {{
      text-align: center;
      margin: 40px 0;
    }}

    .button {{
      background: linear-gradient(to right, #15750a, #116108);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 8px 20px rgba(21, 117, 10, 0.25);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      letter-spacing: 0.5px;
    }}
    
    .button:hover {{
      box-shadow: 0 10px 25px rgba(21, 117, 10, 0.4);
    }}

    .footer {{
      padding: 32px 40px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #64748B;
    }}

    .link-fallback {{
      font-size: 13px;
      word-break: break-all;
      color: #94A3B8;
      margin-top: 32px;
      padding: 16px;
      background-color: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }}

    .link-fallback a {{
      color: #15750a;
      font-weight: 600;
    }}

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {{
      body, .wrapper {{
        background-color: #09090b !important;
      }}
      .main {{
        background-color: #18181b !important;
        border-color: #27272a !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
      }}
      .content h2 {{
        color: #f4f4f5 !important;
      }}
      .content p {{
        color: #a1a1aa !important;
      }}
      .footer {{
        background-color: #18181b !important;
        border-top-color: #27272a !important;
        color: #71717a !important;
      }}
      .link-fallback {{
        background-color: #27272a !important;
        border-color: #3f3f46 !important;
        color: #a1a1aa !important;
      }}
      .link-fallback a {{
        color: #4ade80 !important;
      }}
      .button {{
        box-shadow: 0 8px 20px rgba(74, 222, 128, 0.15) !important;
      }}
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
          <p>Best regards,<br><b>The Quota Hire Team</b></p>
          
          <div class="link-fallback">
            If the button doesn't work, copy and paste this link into your browser:<br><br>
            <a href="{redirect}">{redirect}</a>
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
