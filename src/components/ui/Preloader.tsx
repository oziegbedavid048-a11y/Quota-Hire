import { useEffect, useRef, useState } from 'react';

/**
 * The opening animation, carried over from the mobile app's splash screen.
 *
 * Choreography, matching mobile/src/components/video-splash.tsx beat for beat:
 *
 *   0ms      the logo sits alone in the centre of the screen
 *   0-900    it rolls to the left edge, turning a full clockwise revolution
 *   900-1300 it waits there
 *   1100     the wordmark slides in from the right and fades up, overshooting
 *            slightly before settling, so it has some weight
 *   1300-2200 the logo rolls back, unwinding the revolution, and lands beside
 *            the wordmark with the pair centred
 *   2200     the whole thing fades away
 *
 * The mobile version then idles until 3500ms before fading. That pause exists
 * because a native app has a real splash to hand over from. On the web it is
 * dead time in front of the content, so the fade begins as soon as the logo
 * lands.
 *
 * On why this is measured rather than hardcoded: the native version computes
 * its offsets from constants tuned to a phone (LOGO_SOLO_OFFSET = 98,
 * LEFT_EDGE_OFFSET = 154 - SCREEN_W / 2). Those numbers do not survive a
 * desktop monitor, a tablet, or a 320px phone. Here both distances are derived
 * at runtime from the real measured width of the wordmark and the real
 * viewport, and recomputed if the window changes mid-animation, so the logo
 * genuinely starts centred and genuinely reaches the edge at any size.
 */

/** Beat timings, in milliseconds.
 *
 * Slower than the mobile original, which ran 900/400/900. On a phone the
 * splash covers a cold start and is gone before it registers; on a desktop the
 * same timings read as a flicker rather than an animation.
 *
 * The ratio between the beats is preserved, because the keyframe percentages
 * in index.css are that ratio: ROLL_OUT / TOTAL and (ROLL_OUT + PAUSE) / TOTAL.
 * Change one beat without the others and the CSS stops lining up.
 */
const ROLL_OUT = 1200;
const PAUSE = 500;
const ROLL_BACK = 1200;
const FADE = 500;
const TOTAL = ROLL_OUT + PAUSE + ROLL_BACK;

/** The wordmark starts halfway through, as it does on mobile, and settles
 *  before the logo begins its return so the two meet rather than collide. */
const WORD_DELAY = Math.round(TOTAL * 0.5);
const WORD_DURATION = ROLL_OUT - 100;

/** Gap between the logo and the wordmark once they meet. */
const GAP = 12;

/** How far the logo's left edge stops from the side of the screen. */
const EDGE_PADDING = 20;

export const Preloader = () => {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);
  const [started, setStarted] = useState(false);

  const wordRef = useRef<HTMLSpanElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Measure, then drive the animation from CSS custom properties. Writing them
  // onto the element rather than into a stylesheet is what lets the distances
  // depend on the viewport.
  useEffect(() => {
    const root = rootRef.current;
    const word = wordRef.current;
    const logo = logoRef.current;
    if (!root || !word || !logo) return;

    const measure = () => {
      const wordWidth = word.getBoundingClientRect().width;
      // Measured from the element, not from the custom property. Reading
      // --qh-logo back gives the literal string "clamp(3.5rem, 13vw, 5.5rem)",
      // which parseFloat turns into NaN, and a NaN inside a keyframe makes the
      // whole transform invalid so the logo never moves at all.
      const logoSize = logo.getBoundingClientRect().width;
      if (!wordWidth || !logoSize) return;

      // The pair is laid out as a centred row: [logo][gap][wordmark]. With the
      // wordmark still invisible, the logo has to shift right by half of what
      // the wordmark and gap occupy for it to read as centred on its own.
      const soloOffset = (wordWidth + GAP) / 2;

      // Where the row's left edge sits, which is where the logo's left edge
      // sits when nothing is translated.
      const rowWidth = logoSize + GAP + wordWidth;
      const rowLeft = (window.innerWidth - rowWidth) / 2;

      // Both keyframe values are absolute translateX, not deltas, so this is
      // simply "how far from its untranslated position must the logo move for
      // its left edge to land EDGE_PADDING from the screen".
      const travel = EDGE_PADDING - rowLeft;

      root.style.setProperty('--qh-solo', `${soloOffset}px`);
      root.style.setProperty('--qh-travel', `${travel}px`);
    };

    root.style.setProperty('--qh-total', `${TOTAL}ms`);
    root.style.setProperty('--qh-fade', `${FADE}ms`);
    root.style.setProperty('--qh-word-delay', `${WORD_DELAY}ms`);
    root.style.setProperty('--qh-word-dur', `${WORD_DURATION}ms`);

    measure();
    window.addEventListener('resize', measure);

    // The wordmark's width depends on the font. Measuring before a webfont
    // settles would centre the logo against the fallback's metrics, so measure
    // again once the real face is in.
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    // One frame after the variables are set, so the animation never starts
    // from an unmeasured position.
    const raf = requestAnimationFrame(() => setStarted(true));

    const fadeAt = window.setTimeout(() => {
      // The page is only its full height once the lazily loaded route has
      // arrived, which is after App's own scroll-to-top has already run
      // against a short document. The browser restores its remembered offset
      // at that later moment and wins, so a reload surfaces partway down the
      // page. Putting it back here, immediately before the curtain lifts, is
      // the last point at which it is certain to be both tall and unseen.
      window.scrollTo(0, 0);
      setFading(true);
    }, TOTAL);
    const goneAt = window.setTimeout(() => setGone(true), TOTAL + FADE);

    return () => {
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
      clearTimeout(fadeAt);
      clearTimeout(goneAt);
    };
  }, []);

  // Nothing is left in the tree once it has played, so it cannot intercept a
  // click or trap focus afterwards.
  if (gone) return null;

  return (
    <div
      ref={rootRef}
      className={`qh-preloader${started ? ' qh-preloader--run' : ''}${fading ? ' qh-preloader--out' : ''}`}
      role="status"
      aria-label="Loading Quotahire"
      aria-live="polite"
    >
      <div className="qh-preloader__stage">
        <img
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          ref={logoRef}
          className="qh-preloader__logo"
          width={72}
          height={72}
        />
        <span ref={wordRef} className="qh-preloader__word">
          Quotahire
        </span>
      </div>
    </div>
  );
};
