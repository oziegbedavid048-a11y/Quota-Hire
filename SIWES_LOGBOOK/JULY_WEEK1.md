# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: July | Week No: 1 | Date: 1/7/2026

### DAYS | NATURE OF WORK DONE

**Monday – 29/06/2026**
Worked on the Quota Hire backend API. Assisted in verifying the ZeptoMail email provider integration by running validation tests. Confirmed all transactional emails (OTP, welcome, notifications) were going out correctly to test addresses.

**Tuesday – 30/06/2026**
Worked on building the Quota Hire public static site and adding a robots.txt and sitemap for SEO. Studied how the Render deployment pipeline works and helped verify that the vercel.json routing configuration was set up correctly for the frontend.

**Wednesday – 01/07/2026**
Assisted the team in implementing code splitting on the Quota Hire React frontend. Refactored the app routing to use React.lazy() and Suspense for all page components. This significantly reduced the initial JS bundle size downloaded by users on first load.

**Thursday – 02/07/2026**
Helped build and test the bandwidth-saving strategy for Quota Hire. Added a Cache-Control middleware in Django to inject proper cache headers on API responses. Also added cache headers in render.yaml for static assets — 1 year for JS/CSS and 1 week for images.

**Friday – 03/07/2026**
Worked on the Kneadmassage (spa) client website project. Was assigned to review the site and fix the mobile header. Removed the desktop CTA button from the mobile header and replaced it with a hamburger toggle. Built a right-side slide-out drawer for mobile navigation.

### Special Project/Job for the Week (if any):
Frontend code splitting and cache optimization for Quota Hire; Mobile header fix for Kneadmassage website.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
The Suspense fallback caused a brief white flash on slow connections. Added a smooth page loader component as the fallback to improve user experience during lazy-loaded route transitions.

### Comment by Student:
This week helped me understand web performance optimization in depth. Reducing bundle sizes and caching assets are things that directly affect real users, and I now know how to implement them.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 29/06/2026 To 03/07/2026

**Description of work done during the week:**
Verified ZeptoMail transactional email integration. Implemented React.lazy() code splitting on all Quota Hire frontend routes, reducing the initial JS bundle size significantly. Added Cache-Control headers via Django middleware and in render.yaml for static assets. Fixed the Kneadmassage spa website mobile header — replaced desktop CTA with a hamburger toggle and built a right-side slide-out drawer.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
Cache invalidation is a persistent challenge — when a new deployment is pushed, users on older cached versions may not receive updated JS or CSS files immediately. Researching content-hash-based asset naming combined with Cloudflare cache purge automation as a reliable solution.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
