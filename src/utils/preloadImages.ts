export const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

export const PRELOAD_ILLUSTRATIONS = [
  '/images/about_illustration_nobg.png',
  '/images/ai_coach_orb.png',
  '/images/applicant_reviewer.png',
  '/images/application_tracker.png',
  '/images/browse_jobs_seeker.png',
  '/images/company_profile.png',
  '/images/company_setup.png',
  '/images/employee_profile.png',
  '/images/employee_setup.png',
  '/images/employee_welcome.png',
  '/images/job_detail_3d.png',
  '/images/login_3d_key.png',
  '/images/login_human_3d.png',
  '/images/my_jobs_manager.png',
  '/images/post_job_recruiter.png',
  '/images/reviewing_app_3d.png',
  '/images/saved_jobs_illustration.png',
  '/images/signup_3d_welcome.png',
  '/images/signup_human_3d.png',
  '/images/success_plane_3d_nobg.png',
  '/images/tracker_illustration.png'
];
