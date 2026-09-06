# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: July | Week No: 3 | Date: 13/7/2026

### DAYS | NATURE OF WORK DONE

**Monday – 13/07/2026**
Continued Chrysalias escrow platform development. Worked on all the marketing subpages — rich content, image assets, statistics banners, FAQ accordions, and process flowcharts. Implemented separate header rules: full nav header for marketing pages, minimal header for login/signup pages.

**Tuesday – 14/07/2026**
Built the Start Transaction creation flow for the Chrysalias platform. Created a clean 2-step wizard: Step 1 collects transaction and item details, Step 2 shows a summary with live fee calculations and counterparty details. Added a "Skip to Dashboard" button on both steps. Verified the full flow works.

**Wednesday – 15/07/2026**
Worked on the Chrysalias dashboard. Fixed a right-side horizontal overflow issue on the transaction table. Wrapped tables in a responsive container with overflow-x: auto so they scroll horizontally on smaller screens instead of breaking the layout. Also fine-tuned font sizes across the dashboard.

**Thursday – 16/07/2026**
Updated the Chrysalias brand name across the entire codebase — all HTML files, JS files, meta tags, and copyright notices were updated from "Escrow.com" to "Chrysalias.com". Updated header logos and navigation links. Ran a search to confirm no old brand references remained.

**Friday – 17/07/2026**
Performed a security review on the Quota Hire backend (sec_scan.py). Checked for common vulnerabilities like SQL injection risks, missing authentication on endpoints, and debug mode being left on in production. Compiled a report of findings and submitted to the senior developer.

### Special Project/Job for the Week (if any):
Chrysalias full subpage completion and brand update; Quota Hire backend security review.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
A legacy JavaScript bundle in the Chrysalias project was auto-rendering a second navigation header. Had to remove the data-component attribute from a specific div to prevent the duplicate render.

### Comment by Student:
This week taught me the importance of consistency in branding and the discipline required for a proper security review. Both are skills I will carry into future projects.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 13/07/2026 To 17/07/2026

**Description of work done during the week:**
Built all rich marketing subpages for the Chrysalias platform with full-bleed hero banners, FAQ accordions, and trust statistics. Implemented separate header rules for marketing pages versus auth pages. Built the Start Transaction 2-step wizard with live fee calculation. Updated all brand references from Escrow.com to Chrysalias.com across the entire codebase. Conducted a backend security review on the Quota Hire Django API.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
The Quota Hire backend security scan revealed that some API endpoints lacked rate limiting, making them vulnerable to brute-force attempts. Researching Django REST Framework throttle classes and IP-based rate limiting middleware as a comprehensive solution.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
