# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: May | Week No: 4 | Date: 25/5/2026

### DAYS | NATURE OF WORK DONE

**Monday – 25/05/2026**
Started the week working on the Quota Hire Django backend. Was assigned to review the job listing endpoints and help optimize database queries. Assisted in adding select_related() calls to eliminate N+1 query issues that were slowing down the API response.

**Tuesday – 26/05/2026**
Worked on the Quota Hire employee profile page (web). Added functionality for updating profile details, changing password, and uploading a profile avatar image. Integrated each action with the backend API. Added proper error banners with retry buttons on failure.

**Wednesday – 27/05/2026**
Helped the team work on image optimization for the Quota Hire platform. Reviewed how images uploaded by users are stored via Cloudinary. Wrapped avatar URLs with an optimize helper function to serve images in WebP format automatically. This reduced image load times noticeably.

**Thursday – 28/05/2026**
Took part in an internal QA session for the Quota Hire web app. Went through the application user flow from sign-up to job application, noting any bugs or UX issues. Filed a list of observations including some missing loading states and slow API responses. Also helped fix two minor bugs from the list.

**Friday – 29/05/2026**
Worked on fixing remaining bugs from the QA session. Updated error handling on the sign-up page to preserve form state on failed attempts. Also helped update some meta tags and page titles for better SEO. Committed changes and submitted for review.

### Special Project/Job for the Week (if any):
Backend query optimization and employee profile page completion for Quota Hire.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
Understanding how Django's ORM handles related model queries took some reading. The official Django documentation and team guidance helped clarify the select_related() approach.

### Comment by Student:
A solid week of mixing backend and frontend work. I am becoming more confident in tracing bugs across the full stack and communicating my findings clearly to the team.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 25/05/2026 To 29/05/2026

**Description of work done during the week:**
Optimized the Quota Hire Django backend API by adding select_related() queries to eliminate N+1 performance issues. Completed the employee profile page with avatar upload, password change, and profile update. Integrated Cloudinary WebP image optimization for all user-uploaded profile photos. Participated in a QA session, submitted a bug report, and fixed two confirmed bugs.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
The Cloudinary free tier has monthly bandwidth limits that could be reached as the platform grows. Researching whether a self-hosted image optimization service (such as imgproxy) would be a more cost-effective long-term solution for the company.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
