// ── FIX: Replace JS-driven Framer Motion infinite animations with pure CSS ──
// Framer Motion rotate+scale+opacity on blur-[140px] elements runs on the JS
// thread and forces constant GPU compositing during scroll. Pure CSS @keyframes
// run on the compositor thread — zero JS overhead, same visual result.
// The animation is defined in index.css as .animate-blob / .animation-delay-5000
export const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-warm-300/20 dark:bg-warm-900/10 rounded-full blur-[120px] animate-blob"
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-accent-300/15 dark:bg-accent-900/10 rounded-full blur-[100px] animate-blob animation-delay-5000"
      />
    </div>
  );
};
