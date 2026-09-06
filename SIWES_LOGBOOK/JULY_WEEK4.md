# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: July | Week No: 4 | Date: 20/7/2026

### DAYS | NATURE OF WORK DONE

**Monday – 20/07/2026**
Worked on the Quota Hire mobile app CV wizard. Added the cover letter builder step that appears when a user applies for a specific job. The wizard auto-generates a 4-paragraph formal cover letter tailored to the job role and company. Users can also manually edit the generated text before submitting.

**Tuesday – 21/07/2026**
Implemented a CV design preview inside the final step of the CV wizard on mobile. Used a React Native WebView to render the user's compiled HTML CV as a visual preview. Added a transparent overlay to disable touch interaction on the preview, keeping it purely visual.

**Wednesday – 22/07/2026**
Worked on the Chrysalias Django backend setup. Built and configured the complete Django 5.2 backend with a custom User model, Transaction model, PartneredPayment model, and full REST API. Set up the branded Django Admin portal with KYC status badges, bulk actions, and transaction inlines.

**Thursday – 23/07/2026**
Added Cloudflare CDN configuration for the Quota Hire domain. Set up CNAME records for the frontend and backend on Cloudflare. Configured SSL/TLS to Full (strict) mode. Enabled Brotli compression and Auto Minify for JS, CSS, and HTML. Verified cache hit status using curl headers.

**Friday – 24/07/2026**
Worked on implementing email signatures for the Quota Hire team. Created three HTML email signatures (hello@, info@, support@) with a minimal horizontal layout, black-and-white color scheme, and a green CTA button. Each signature stacks correctly on mobile screens via a CSS media query.

### Special Project/Job for the Week (if any):
CV cover letter integration for mobile; Chrysalias Django backend; Quota Hire email signatures.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
Getting the WebView preview to render correctly on Android took multiple attempts. The transparency overlay approach was the cleanest solution to disable user interaction while still showing the preview.

### Comment by Student:
A packed week covering backend, frontend, mobile, and infrastructure work. I am building a wide range of skills and beginning to see how every piece fits together in a production system.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 20/07/2026 To 24/07/2026

**Description of work done during the week:**
Built the CV cover letter builder step in the Quota Hire mobile CV wizard — auto-generates a formal 4-paragraph cover letter tailored to the job and company, with user editing capability. Integrated a WebView-based CV design preview in the final wizard step. Set up Cloudflare CDN for the Quota Hire domain with SSL, Brotli compression, and cache rules. Created three professional HTML email signatures for the Quota Hire team with responsive mobile stacking.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
Cloudflare CDN caching can sometimes serve stale versions of the API responses. Researching a cache-bypass strategy for authenticated API endpoints while keeping public endpoints cached — to avoid users seeing outdated job listings or profile data after a backend update.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
