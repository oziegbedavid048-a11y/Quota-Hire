import os
import django
import sys
import requests
from bs4 import BeautifulSoup
import random

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quotahire.settings')
django.setup()

from api.models import CustomUser, CompanyProfile, Job, JobStatus, JobPackage

def clean_html(html_text):
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, "html.parser")
    # Replace common block elements with newlines for better text formatting
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for p in soup.find_all("p"):
        p.insert_after("\n\n")
    for li in soup.find_all("li"):
        li.insert_before("- ")
        li.insert_after("\n")
    
    text = soup.get_text()
    # Clean up excessive newlines
    lines = text.split('\n')
    cleaned_lines = [line.strip() for line in lines]
    cleaned_text = '\n'.join(line for line in cleaned_lines if line)
    return cleaned_text

def get_or_create_dummy_company():
    email = "admin_jobs@quotahire.com"
    user, created = CustomUser.objects.get_or_create(
        email=email,
        defaults={
            'username': email,
            'first_name': 'QuotaHire',
            'last_name': 'Partners',
            'role': 'company',
            'is_staff': False,
            'setup_completed': True,
        }
    )
    if created:
        user.set_password('quotahire123!')
        user.save()
        CompanyProfile.objects.create(
            user=user,
            company_name="External Partners",
            industry="Technology",
            description="Jobs sourced from verified external partners.",
        )
    return user

def populate_jobs():
    print("Fetching jobs from Remotive API...")
    try:
        response = requests.get("https://remotive.com/api/remote-jobs?limit=200")
        response.raise_for_status()
        data = response.json()
        jobs_data = data.get('jobs', [])
    except Exception as e:
        print(f"Error fetching from Remotive API: {e}")
        return

    company_user = get_or_create_dummy_company()

    # We want mostly UK, some US, Canada, Worldwide
    uk_jobs = []
    us_jobs = []
    canada_jobs = []
    worldwide_jobs = []

    for j in jobs_data:
        loc = j.get('candidate_required_location', '').lower()
        if 'uk' in loc or 'united kingdom' in loc or 'london' in loc:
            uk_jobs.append(j)
        elif 'us' in loc or 'united states' in loc or 'usa' in loc:
            us_jobs.append(j)
        elif 'canada' in loc:
            canada_jobs.append(j)
        elif 'worldwide' in loc or 'anywhere' in loc:
            worldwide_jobs.append(j)

    # Let's target: 20 UK, 15 US, 5 Canada, 10 Worldwide
    selected_jobs = []
    selected_jobs.extend(uk_jobs[:20])
    selected_jobs.extend(us_jobs[:15])
    selected_jobs.extend(canada_jobs[:5])
    selected_jobs.extend(worldwide_jobs[:(50 - len(selected_jobs))])

    print(f"Selected {len(selected_jobs)} jobs. Saving to database...")
    
    count = 0
    for j in selected_jobs:
        # Check if job already exists by URL
        if Job.objects.filter(external_apply_url=j.get('url')).exists():
            continue

        description = clean_html(j.get('description', ''))
        
        # Build requirements from tags
        tags = j.get('tags', [])
        reqs = [f"Experience with {tag.capitalize()}" for tag in tags[:5]]
        if not reqs:
            reqs = ["Relevant experience in the role", "Strong communication skills", "Ability to work remotely"]

        # Determine job type and salary
        jtype = j.get('job_type', '').replace('_', ' ').title()
        if 'Freelance' in jtype:
            jtype = 'Freelance'
        elif 'Contract' in jtype:
            jtype = 'Contract'
        else:
            jtype = random.choice(['Freelance', 'Contract', 'Remote'])

        # Set specific salaries based on job type
        if jtype in ['Freelance', 'Remote']:
            salary = '$50 - $75 / hour'
        else:
            salary = '$90 - $150 / hour'

        Job.objects.create(
            company=company_user,
            title=j.get('title', 'Remote Professional'),
            description=description[:10000],  # Limit length just in case
            requirements=reqs,
            employment_type=jtype,
            is_remote=True,
            location=j.get('candidate_required_location', 'Worldwide'),
            salary_range=salary,
            currency='USD' if 'us' in j.get('candidate_required_location', '').lower() else 'GBP' if 'uk' in j.get('candidate_required_location', '').lower() else 'USD',
            custom_company_name=j.get('company_name', 'External Company'),
            external_apply_url=j.get('url'),
            status=JobStatus.APPROVED,
            package=JobPackage.PIPELINE,
        )
        count += 1

    print(f"Successfully added {count} new real remote jobs.")

if __name__ == '__main__':
    populate_jobs()
