# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: May | Week No: 3 | Date: 18/5/2026

### DAYS | NATURE OF WORK DONE

**Monday – 18/05/2026**
Worked on the Quota Hire web platform's frontend. Assisted in building the employee Resume Upload page. Added a file picker, integrated it with the backend API, and verified that uploaded resumes were saved correctly to the user profile. Fixed a bug where the form state cleared on failed upload.

**Tuesday – 19/05/2026**
Worked on building the CV Generator Modal for the Quota Hire web platform. The modal allows employees to build a Standard or Europass format CV step by step. Implemented the first two wizard steps — Personal Info and Work Experience. Connected the form to the backend save API.

**Wednesday – 20/05/2026**
Continued the CV wizard. Added the Education and Skills steps. Implemented PDF preview using react-pdf BlobProvider so users can see their generated CV before downloading. Worked on styling the PDF template to look professional.

**Thursday – 21/05/2026**
Tested the CV wizard end-to-end. Found an issue where the PDF preview would sometimes not render on retry. Fixed it by adding a renderKey state that forces a fresh render on retry tap. Also added error banners with "Try Again" buttons on all failure states.

**Friday – 22/05/2026**
Helped test and push the CV feature update to the staging environment. Ran a final round of UI testing on different screen sizes. Checked that the API responses were correctly handled. Documented the feature for the team.

### Special Project/Job for the Week (if any):
CV Generator Modal with multi-step wizard and PDF preview for Quota Hire web platform.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
React-PDF rendering was inconsistent on some browsers. Had to implement a key-based re-render workaround to force the component to refresh cleanly.

### Comment by Student:
Building the CV generator was one of the most complex features I have worked on so far. I learned a lot about PDF generation on the web and handling multi-step form state in React.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 18/05/2026 To 22/05/2026

**Description of work done during the week:**
Built the CV Generator Modal for the Quota Hire web platform — a multi-step wizard supporting Standard and Europass CV formats. Implemented personal info, work experience, education, and skills steps. Added live PDF preview using react-pdf BlobProvider. Fixed a rendering glitch with a key-based re-render approach and added "Try Again" retry buttons on all error states. Deployed and tested on staging.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
React-PDF's BlobProvider does not guarantee a fresh render on component remount in all browsers. Research into a more reliable PDF rendering strategy — such as server-side PDF generation with Puppeteer — may provide a more stable solution for production.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
