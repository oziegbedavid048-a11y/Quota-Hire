# Quota Hire � Disaster Recovery Plan

## Recovery Objectives

| Metric | Target | What it means |
|--------|--------|----------------|
| RPO (Recovery Point Objective) | 24 hours | Maximum data we can afford to lose |
| RTO (Recovery Time Objective) | 60 minutes | Maximum time to restore the system |

---

## Infrastructure Overview

| Component | Provider | Backup? |
|-----------|----------|---------|
| Database | Xata (PostgreSQL) | Automatic daily snapshots, 7-day retention |
| Backend | Render (Free Tier) | Stateless � redeploy from GitHub |
| Frontend | Render (Static) | Stateless � redeploy from GitHub |
| File Storage | Cloudinary | Cloudinary manages backups |
| Secrets | Render Dashboard env vars | Must be re-entered manually if lost |

---

## Scenario 1: Database Corruption or Data Loss

### Steps to Restore from Xata Backup

1. Go to https://app.xata.io
2. Select your database > Settings > Backups
3. Choose the most recent backup before the incident
4. Click Restore -> Xata will restore to a new branch
5. Once verified, promote the branch to main
6. Update DATABASE_URL in Render Dashboard if the connection string changes
7. Trigger a Render redeploy

**Estimated time:** 30-45 minutes

---

## Scenario 2: Backend Goes Down on Render

1. Go to https://dashboard.render.com
2. Select quotahire-backend
3. Click Manual Deploy -> Deploy latest commit
4. Watch the build logs - should complete in ~3 minutes
5. If build fails, check Sentry for the error

**Estimated time:** 5-10 minutes

---

## Scenario 3: All Render Secrets Lost

If environment variables in Render are wiped, re-enter these manually:

| Key | Where to get it |
|-----|----------------|
| DATABASE_URL | Xata Dashboard -> your database -> Connection strings |
| REDIS_URL | Upstash Dashboard -> your Redis instance -> Connect |
| PAYSTACK_SECRET_KEY | Paystack Dashboard -> Settings -> API Keys |
| PAYSTACK_PUBLIC_KEY | Paystack Dashboard -> Settings -> API Keys |
| CLOUDINARY_URL | Cloudinary Dashboard -> API Environment variable |
| COURIER_AUTH_TOKEN | Courier Dashboard -> Settings -> API Keys |
| SENTRY_DSN | Sentry -> your project -> Settings -> Client Keys |
| POSTHOG_API_KEY | PostHog -> Project Settings -> Project API Key |
| POSTHOG_HOST | https://us.i.posthog.com |
| DEFAULT_FROM_EMAIL | quotahire.recruit@gmail.com |

---

## Quarterly Backup Test Procedure (every 90 days)

### Step 1: Export from Xata
Run from the backend/ directory:
  python backup_xata.py
This creates a .sql dump file with today's date.

### Step 2: Restore to a local test instance
  docker run --name pg-test -e POSTGRES_PASSWORD=test -d -p 5433:5432 postgres:15
  psql postgresql://postgres:test@localhost:5433/postgres -f backup_YYYY-MM-DD.sql

### Step 3: Verify key tables exist
  SELECT COUNT(*) FROM api_customuser;
  SELECT COUNT(*) FROM api_job;
  SELECT COUNT(*) FROM api_paymenttransaction;

### Step 4: Tear down
  docker stop pg-test && docker rm pg-test

---

## Backup Test Log

| Date | Backup Tested | Tables OK | Restore Time | Tester |
|------|---------------|-----------|--------------|--------|
| Never tested | - | - | - | - |
