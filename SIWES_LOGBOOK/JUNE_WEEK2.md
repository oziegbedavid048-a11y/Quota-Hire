# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: June | Week No: 2 | Date: 8/6/2026

### DAYS | NATURE OF WORK DONE

**Monday – 08/06/2026**
Worked on the Quota Hire web platform's job listing API. Helped add serializer optimization by creating a JobListSerializer that removes unnecessary fields from the response. This reduced the payload size and improved page load speed for the job listing page significantly.

**Tuesday – 09/06/2026**
Continued backend optimization work. Added database indexes to frequently queried fields such as job status, title, and creation date on the Job model. Also indexed application status and notification read fields. Generated and applied a new database migration successfully.

**Wednesday – 10/06/2026**
Worked on fixing a bug in the Quota Hire mobile layout where job cards were scaling incorrectly on different phone screen sizes. Used a helper script (scale_layout.cjs) to calculate proper scale ratios. Tested the fixes across emulators for different Android screen densities.

**Thursday – 11/06/2026**
Helped process and clean up profile image assets for the Quota Hire platform. Ran background removal scripts on applicant profile images and review section images. Verified all processed images were transparent and displayed correctly on the platform.

**Friday – 12/06/2026 — PUBLIC HOLIDAY (Democracy Day)**
Today is Democracy Day, a public holiday observed in Nigeria. Office was closed. No work done.

### Special Project/Job for the Week (if any):
Backend API optimization with serializer trimming and database indexing for Quota Hire.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
Writing database migrations carefully is important — one wrong field reference caused a migration conflict. Learned to always run makemigrations before applying to avoid conflicts.

### Comment by Student:
This week gave me strong hands-on experience with backend optimization. I now understand how database indexing and payload trimming directly impact performance and user experience.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 08/06/2026 To 12/06/2026

**Description of work done during the week:**
Optimized the Quota Hire backend API by building trimmed serializers for job listings, applicant lists, and applications — reducing JSON payload sizes by up to 80%. Added database indexes on the most queried model fields and generated a new migration. Fixed a mobile layout scaling bug using a scale ratio helper script. Friday was Democracy Day — public holiday, office closed.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 4 (12/06 — Democracy Day, Public Holiday)

**Any challenges currently facing the company for UAT Research attention?**
As the database grows, full-table scans on unindexed fields will increasingly slow down API responses. Research into database query profiling tools (such as Django Silk or pgBadger) would help identify slow queries proactively before they affect production performance.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
