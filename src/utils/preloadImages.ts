// Only preload images that are immediately visible above the fold.
// All other dashboard illustrations are loaded lazily via loading="lazy" on <img> tags.
export const preloadImages = (imageUrls: string[]) => {
  imageUrls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
};

// Critical above-the-fold images only — not the full 20.
// Dashboard illustrations are loaded lazily per-page.
export const PRELOAD_ILLUSTRATIONS = [
  '/images/employee_welcome.png',
  '/images/login_3d_key.png',
];
