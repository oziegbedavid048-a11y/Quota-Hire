/**
 * Font-scaling helpers — iOS Dynamic Type and Android Font size / Display size.
 *
 * React Native already scales `fontSize`, `lineHeight` and `letterSpacing` on
 * every <Text> by default (`allowFontScaling` defaults to true). What it does
 * NOT do is grow the containers around that text. A row written as
 * `height: 42` stays 42px tall while its label doubles, so the text clips or
 * overflows. That mismatch — not the text itself — is what breaks the layout.
 *
 * The fix is mostly structural: give text-bearing containers `minHeight`
 * instead of `height` so flexbox can grow them. These helpers cover the cases
 * where a dimension genuinely has to be computed.
 */
import { useWindowDimensions } from 'react-native';

/**
 * Upper bound applied to app chrome — tab bars, badges, pills — where the box
 * cannot grow without pushing other controls off screen.
 *
 * Body copy is deliberately NOT capped: someone who needs 3x text should get
 * 3x text. This only limits furniture that has nowhere to expand into.
 */
export const CHROME_FONT_SCALE_CAP = 1.3;

/**
 * A slightly looser cap for controls that have some room but not unlimited
 * room — compact buttons, input affixes, table headers.
 */
export const CONTROL_FONT_SCALE_CAP = 1.6;

/**
 * Current text scale as set by the OS.
 *
 * Read from useWindowDimensions rather than PixelRatio.getFontScale() on
 * purpose: PixelRatio takes a one-off reading and will not re-render if the
 * user changes the setting while the app is open, which on Android happens
 * without the app restarting.
 */
export function useFontScale(): number {
  const { fontScale } = useWindowDimensions();
  return fontScale || 1;
}

/**
 * Grow a fixed dimension in step with the text inside it.
 *
 * Use for boxes that must stay a specific size relative to their label —
 * a circular badge, a square avatar-with-initials — where `minHeight` alone
 * would let the box grow in one axis only and lose its shape.
 *
 * The result is clamped so an extreme accessibility setting cannot produce a
 * control taller than the screen.
 */
export function useScaledSize(base: number, cap: number = CONTROL_FONT_SCALE_CAP): number {
  const scale = useFontScale();
  return Math.round(base * Math.min(scale, cap));
}

/**
 * True when the user is running a noticeably enlarged text size.
 *
 * Useful for switching a horizontal row to a vertical stack, which is the
 * recommended adaptation once labels no longer fit side by side, rather than
 * letting them squash or truncate.
 */
export function useIsLargeTextMode(threshold: number = 1.3): boolean {
  return useFontScale() >= threshold;
}
