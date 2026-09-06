# STUDENT'S DAILY RECORD OF ACTIVITIES
## Month: August | Week No: 3 | Date: 17/8/2026

### DAYS | NATURE OF WORK DONE

**Monday – 17/08/2026**
Worked on building the Visa Letter Generator web application. This tool allows conference attendees to generate official visa invitation letters. Built the form with attendee details, digital signature upload section, and a live PDF preview that renders both pages of the letter simultaneously.

**Tuesday – 18/08/2026**
Added mobile responsiveness to the Visa Letter Generator. Fixed the TechEx conference logo sizing on small screens, ensured input fields have 16px font to prevent iOS Safari auto-zoom, and made the signature upload cards stack vertically on mobile. Verified on 320px, 360px, and 768px viewports.

**Wednesday – 19/08/2026**
Worked on fixing critical bugs in the Quota Hire Google Play In-App Purchase (IAP) flow. Identified and fixed a stale closure bug where the purchase success handler was capturing an old undefined version of itself. Also fixed the finishTransaction call that was using the wrong argument format — purchases were not being acknowledged properly.

**Thursday – 20/08/2026**
Continued the IAP bug fixes. Added a retry download feature that lets users download their CV again if the download fails after payment — without being charged again. Also improved error messages to show meaningful text instead of raw error codes. Added a "download failed" pay state with a dedicated retry button.

**Friday – 21/08/2026**
Implemented fingerprint and FaceID biometric sign-in for the Quota Hire mobile app using expo-local-authentication. Added a biometric auth handler that retrieves stored credentials from SecureStore on a successful scan. Added a styled "Sign in with Fingerprint / FaceID" button on the login screen.

### Special Project/Job for the Week (if any):
Visa Letter Generator app; Quota Hire IAP critical bug fixes; Biometric authentication implementation.

### Department/Section:
Software Development / IT Department

### Challenges Encountered During the Week (if any):
The stale closure bug in the IAP handler was difficult to trace because it only manifested after a purchase attempt — not during normal app usage. Required careful reading of the expo-iap hook lifecycle to identify the root cause.

### Comment by Student:
Fixing IAP bugs was the most high-stakes work I have done so far because payment flows directly affect user trust and revenue. I learned to approach these issues with patience and systematic debugging.

---

### WEEKLY RECORD OF WORK DONE
**Period of Training:** From 17/08/2026 To 21/08/2026

**Description of work done during the week:**
Built the Visa Letter Generator web application with a live dual-page PDF preview and digital signature upload. Fixed mobile responsiveness across all viewports. Identified and fixed two critical bugs in the Quota Hire Google Play IAP flow — a stale closure bug that caused the purchase handler to silently do nothing, and an incorrect finishTransaction argument that prevented Google from receiving purchase acknowledgment (would cause auto-refund after 3 days). Added biometric fingerprint/FaceID sign-in to the mobile app.

**Comments by the Industry Based Supervisor:** _______________________________________________

**Number of days Present at work for the week:** 5

**Any challenges currently facing the company for UAT Research attention?**
Google's 3-day auto-refund policy for unacknowledged in-app purchases is a significant revenue risk. Researching a background job (cron task) that monitors unacknowledged transactions flagged in the database and retries the acknowledgment API call automatically before the deadline.

**Name of Supervisor:** ___________________ **Rank/Status:** ___________________

**Signature:** ___________________ **Date:** ___________________

**Remarks of UAT Supervising Staff:** _______________________________________________
