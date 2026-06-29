import os
import django
import sys
import re

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quotahire.settings')
django.setup()

from api.models import CustomUser, Job

def clean_and_truncate_text(text):
    if not text:
        return ""
    
    # Replace smart quotes to preserve them
    text = text.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"').replace("–", "-").replace("—", "-")
    
    # Remove all remaining non-ASCII characters (this removes emojis)
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    
    # Split into lines and remove empty ones
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Keep the first 10 meaningful lines
    truncated_lines = lines[:10]
    
    cleaned_text = '\n'.join(truncated_lines)
    
    # Truncate by character limit as a fallback
    max_length = 800
    if len(cleaned_text) > max_length:
        cleaned_text = cleaned_text[:max_length]
        # Try to cut cleanly at the last space
        last_space = cleaned_text.rfind(' ')
        if last_space > 0:
            cleaned_text = cleaned_text[:last_space]
        cleaned_text += "..."
    elif len(lines) > 10:
        cleaned_text += "\n..."
        
    return cleaned_text

def fix_jobs():
    email = "admin_jobs@quotahire.com"
    try:
        user = CustomUser.objects.get(email=email)
        jobs = Job.objects.filter(company=user)
        count = 0
        for job in jobs:
            new_desc = clean_and_truncate_text(job.description)
            job.description = new_desc
            job.save()
            count += 1
        print(f"Successfully updated {count} jobs.")
    except CustomUser.DoesNotExist:
        print("Dummy company user not found.")

if __name__ == "__main__":
    fix_jobs()
