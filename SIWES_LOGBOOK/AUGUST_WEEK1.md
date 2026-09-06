# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: August | Week No: 1 | Date: 3/8/2026

### DAYS | NATURE OF WORK DONE

**Monday – 03/08/2026**
Continued work on the Quota CRM mobile app. Added the Floating Bottom Navigation Bar with a dynamic context-aware center button. When on the Overview or Companies screen, the center button shows a plus icon to add a lead. On other screens, it shows the company logo to return to Overview.

**Tuesday – 04/08/2026**
Built the interactive SVG Trend Overview Graph for the Quota CRM dashboard using react-native-svg. The graph features smooth bezier curves, gradient shading, and interactive month selector pills (Jan–Oct). Users can tap any past month to see that period's trend data.

**Wednesday – 05/08/2026**
Added a dedicated Company Profile page inside the Quota CRM app. When a user taps a company in the Sales Pipeline, a full profile page opens showing the company's SLA status, revenue generated, contact info, request logs, and the assigned staff roster. All data is pulled from the local state.

**Thursday – 06/08/2026**
Upgraded the Financial Record mobile application from Expo SDK 54 to Expo SDK 57. Updated the core expo package and ran expo install --fix to bump all dependent native modules to their compatible versions. Cleaned up obsolete properties from app.json. Ran expo-doctor and confirmed 20/20 checks passed.

**Friday – 07/08/2026**
Worked on fixing a JavaScript syntax error on the Chrysalias dashboard that was causing the entire script to halt on page load. An unclosed code block in the updateJointAccountOverview function was the culprit. Fixed the block, rebuilt the database data pipeline, and confirmed live data loads instantly on login.

### Special Project/Job for the Week (if any):
Quota CRM mobile app features; Financial Record Expo SDK upgrade; Chrysalias dashboard bug fix.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
The SVG bezier graph required manual calculation of curve control points. Studied the SVG path spec and referenced examples to implement smooth, natural-looking curves.

### Comment by Student:
This was one of my most technically varied weeks. Moving across SDK upgrades, SVG graphics, and JavaScript debugging gave me exposure to a very wide range of real development scenarios.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 03/08/2026 To 07/08/2026

**Description of work done during the week:**
Added the dynamic context-aware floating navigation bar to the Quota CRM app. Built an interactive SVG bezier trend chart with monthly selectors for the CRM dashboard. Added a dedicated Company Profile page with SLA data, revenue, and staff roster. Upgraded the Financial Record app from Expo SDK 54 to SDK 57 — all 20 expo-doctor checks passed. Fixed a critical JavaScript syntax error on the Chrysalias dashboard that was blocking all data from loading on login.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
Expo SDK upgrades often break native module compatibility without clear error messages. Researching an automated compatibility matrix checker or CI pipeline step that validates all native module versions against the active SDK before an upgrade is merged to production.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
