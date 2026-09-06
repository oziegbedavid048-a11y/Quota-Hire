# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: August | Week No: 4 | Date: 24/8/2026

### DAYS | NATURE OF WORK DONE

**Monday – 24/08/2026**
Worked on a production scalability upgrade for the Quota Hire backend. Replaced the single-worker server configuration with a 3-worker Gunicorn setup with threading support. This allows the backend to handle multiple simultaneous requests without queuing them one by one.

**Tuesday – 25/08/2026**
Added background async email dispatch to the Quota Hire sign-up endpoint. Moved email sending into a background daemon thread so the API returns a response immediately instead of waiting for the SMTP connection. This reduced sign-up response time from ~2 seconds to under 100ms.

**Wednesday – 26/08/2026**
Worked on fixing the Quota Hire mobile app notification badge count. Identified the root cause: the backend only accepted PUT requests for marking notifications read, but the mobile app was sending POST requests, causing 405 errors. Fixed the backend to accept both methods. Also registered the missing mark-all-read endpoint in the URL config.

**Thursday – 27/08/2026**
Fixed the notification state synchronization across the Quota Hire mobile app. Different components (header bell, quick actions menu, notifications screen) were each maintaining their own unread count state. Implemented a DeviceEventEmitter broadcast so all components update simultaneously when notifications are marked as read.

**Friday – 28/08/2026**
Worked on the Quota Hire app's error sanitization. Ensured no raw error tracebacks or database details are ever exposed to users. Added clean "Something went wrong. Please try again." messages and 1-click retry buttons across all screens without clearing user input on failure.

### Special Project/Job for the Week (if any):
Quota Hire backend scalability upgrade; notification read bug fix; error sanitization across the app.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
Getting all notification components to share state without a global state library required a pub/sub approach using React Native's DeviceEventEmitter. It worked cleanly once properly implemented.

### Comment by Student:
This week focused heavily on production quality — scalability, reliability, and graceful error handling. These are the qualities that separate a hobby project from a professional application.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 24/08/2026 To 28/08/2026

**Description of work done during the week:**
Implemented server-level concurrency upgrades (Gunicorn multi-worker with gthread workers), async SMTP email dispatch via background threading, notification system bug fixes across backend and mobile frontend (HTTP method mismatch, missing URL endpoints, global state sync via DeviceEventEmitter), and universal error message sanitization with 1-click retry buttons across the entire Quota Hire application. All changes verified through Django system checks and TypeScript compilation.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
The Google Play IAP acknowledgment timing issue (purchases auto-refunded by Google after 3 days if not acknowledged) is a live revenue risk. Researching a scheduled background task (Django management command with cron) that automatically retries acknowledgment for any transactions flagged as google_ack_failed in the database before the 3-day deadline.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
