from django.core.mail.backends.base import BaseEmailBackend
import urllib.request
import urllib.parse
import json
import logging
import email.utils

logger = logging.getLogger(__name__)

class ZeptoMailBackend(BaseEmailBackend):
    """
    Custom Django Email Backend that sends emails via ZeptoMail's REST API.
    Bypasses SMTP port blocks on platforms like Render.
    """
    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        from django.conf import settings
        self.api_key = getattr(settings, 'ZEPTOMAIL_API_KEY', '')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@quotahire.org')

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        
        if not self.api_key:
            logger.error("ZeptoMail API Key is not configured in settings (ZEPTOMAIL_API_KEY).")
            if not self.fail_silently:
                raise ValueError("ZeptoMail API Key is not configured.")
            return 0

        sent_count = 0
        for message in email_messages:
            if self._send(message):
                sent_count += 1
        return sent_count

    def _send(self, message):
        recipients = message.to
        if not recipients:
            return False

        subject = message.subject
        html_body = ""
        text_body = message.body

        # Extract HTML body from alternatives if present
        if hasattr(message, 'alternatives'):
            for alt in message.alternatives:
                if alt[1] == 'text/html':
                    html_body = alt[0]
                    break

        if not html_body:
            html_body = f"<div>{text_body.replace(chr(10), '<br>')}</div>"

        # Parse 'From' address
        from_name = ""
        from_address = self.from_email
        parsed_from = email.utils.parseaddr(self.from_email)
        if parsed_from[1]:
            from_name = parsed_from[0]
            from_address = parsed_from[1]

        # Parse recipients
        to_list = []
        for r in recipients:
            parsed_to = email.utils.parseaddr(r)
            to_list.append({
                "email_address": {
                    "address": parsed_to[1] if parsed_to[1] else r,
                    "name": parsed_to[0] if parsed_to[0] else r.split('@')[0]
                }
            })

        payload = {
            "from": {
                "address": from_address
            },
            "to": to_list,
            "subject": subject,
            "htmlbody": html_body,
        }
        if from_name:
            payload["from"]["name"] = from_name
            
        if text_body:
            payload["textbody"] = text_body

        # Process attachments if present
        if getattr(message, 'attachments', None):
            import base64
            import mimetypes
            from email.mime.base import MIMEBase
            
            payload["attachments"] = []
            for attachment in message.attachments:
                if isinstance(attachment, tuple):
                    filename, content, mimetype = attachment
                    # Convert content to bytes if string
                    if isinstance(content, str):
                        content_bytes = content.encode('utf-8')
                    else:
                        content_bytes = content
                    
                    encoded_content = base64.b64encode(content_bytes).decode('utf-8')
                    payload["attachments"].append({
                        "name": filename,
                        "content": encoded_content,
                        "mime_type": mimetype or mimetypes.guess_type(filename)[0] or "application/octet-stream"
                    })
                elif isinstance(attachment, MIMEBase):
                    filename = attachment.get_filename() or "attachment"
                    content_bytes = attachment.get_payload(decode=True)
                    encoded_content = base64.b64encode(content_bytes).decode('utf-8')
                    payload["attachments"].append({
                        "name": filename,
                        "content": encoded_content,
                        "mime_type": attachment.get_content_type()
                    })

        # Setup Authorization Header correctly
        auth_header = self.api_key.strip()
        if not auth_header.startswith("Zoho-enczapikey"):
            auth_header = f"Zoho-enczapikey {auth_header}"

        url = "https://api.zeptomail.com/v1.1/email"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": auth_header
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers=headers,
                method='POST'
            )
            # 10s timeout to prevent thread blocking indefinitely
            with urllib.request.urlopen(req, timeout=10) as response:
                resp_data = response.read().decode('utf-8')
                logger.info(f"ZeptoMail API response: {resp_data}")
                return True
        except Exception as e:
            logger.error(f"Failed to send email via ZeptoMail API: {e}", exc_info=True)
            if not self.fail_silently:
                raise
            return False
