# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: June | Week No: 4 | Date: 22/6/2026

### DAYS | NATURE OF WORK DONE

**Monday – 22/06/2026**
Worked on the Quota Hire web app README documentation. Cleaned up and restructured the README.md to properly describe the project setup, environment variables needed, and how to run both the frontend and backend locally. This helps new developers onboard faster.

**Tuesday – 23/06/2026**
Helped diagnose and fix a charset encoding issue in some data files using the fix_mojibake.py script. Characters like accented letters in names were displaying incorrectly due to incorrect encoding on import. The script detected and replaced bad sequences with correct UTF-8 characters.

**Wednesday – 24/06/2026**
Worked on building the Quota Hire LOGO HTML file — a standalone branded HTML display for use in email headers and marketing materials. Verified the logo rendered correctly on different browser backgrounds and zoom levels. Also helped reorganize the project's asset folder structure.

**Thursday – 25/06/2026**
Assisted in updating the Quota Hire Vite build configuration. Adjusted the vite.config.ts to improve code splitting for faster page loads. Tested that all existing routes still loaded correctly after the config change. Ran the production build and confirmed no errors.

**Friday – 26/06/2026**
Worked on background removal for the "why us" section images using remove_why_bg.py. Also assisted in preparing some platform assets for Cloudinary upload. Helped the team verify that all processed images displayed correctly on the live staging environment.

### Special Project/Job for the Week (if any):
Documentation updates, image asset processing, and Vite build config optimization.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
The Vite config change caused one route to temporarily stop loading. Traced it to a missing dynamic import path. Fixed by ensuring all lazy-loaded components had correct paths.

### Comment by Student:
I appreciate that even non-coding tasks like writing documentation and processing assets are important parts of the development process. These details keep the team running smoothly.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 22/06/2026 To 26/06/2026

**Description of work done during the week:**
Rewrote the Quota Hire project README with clear setup instructions for frontend and backend. Fixed character encoding issues in data files using a Python repair script. Created a branded HTML logo file for email/marketing use. Optimized the Vite build config for better code splitting. Processed and uploaded "why us" section images via background removal and Cloudinary.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
Vite's dynamic import code splitting can sometimes create too many small JS chunks, which increases the number of HTTP requests on first load. Research into the optimal chunking strategy — balancing bundle count versus bundle size — would benefit the platform's load performance.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
