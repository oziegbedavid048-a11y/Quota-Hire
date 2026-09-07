/**
 * App-wide Text and TextInput.
 *
 * React Native honours the OS text-size setting on every <Text> already, with
 * no upper bound: at Android's largest Font size combined with Display size,
 * or an iOS accessibility size, a 13px label can pass 30px. No hand-built
 * layout survives that, which is why raising the setting scattered the UI.
 *
 * `maxFontSizeMultiplier` is React Native's own answer. It bounds how far a
 * node may scale while honouring everything below that bound, and it inherits
 * down nested <Text> nodes — so setting it here covers the whole tree without
 * touching the ~683 <Text> call sites.
 *
 * Why a wrapper rather than a global default: Text.defaultProps was the old
 * trick, but RN 0.86's Text is a function component and React 19 removed
 * defaultProps for those. Re-exporting from one module is the supported way to
 * set an app-wide default now — call sites keep writing <Text>, only the
 * import changes.
 *
 * This is a bound, not a refusal to scale. Text still grows with the user's
 * setting up to MAX_FONT_SCALE; past that the layout would break badly enough
 * to be unusable, which serves nobody.
 */
import { forwardRef } from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  useWindowDimensions,
  type TextProps,
  type TextInputProps,
} from 'react-native';

/**
 * Ceiling for body copy.
 *
 * This is the one number to tune. 1.3 is deliberately conservative: it is the
 * value these layouts are known to survive, and a still-useful 30% increase.
 * Raise it toward 1.5 once the screens have been checked at the larger size on
 * a real device — a bound that is too generous produces exactly the scattered
 * layout this is meant to prevent, so it is better to loosen from a working
 * baseline than to guess high and ship broken.
 */
export const MAX_FONT_SCALE = 1.3;

/**
 * Tighter ceiling for furniture with nowhere to expand into — count badges,
 * pills, chips in a horizontal row. Pass explicitly where it applies.
 */
export const MAX_FONT_SCALE_COMPACT = 1.2;

// The instance types are re-exported under the same names so existing
// annotations such as `useRef<TextInput>(null)` keep resolving. A type and a
// value may share a name in TypeScript, so importing { TextInput } from here
// gives the component in value position and the instance type in type
// position, exactly as importing it from react-native did.
export type Text = RNText;
export type TextInput = RNTextInput;

export const Text = forwardRef<RNText, TextProps>(
  ({ maxFontSizeMultiplier, style, numberOfLines, ...rest }, ref) => {
    // numberOfLines is written for the default text size. At a larger size the
    // same words need more lines, so a hard numberOfLines={1} silently drops
    // content — the label looks truncated to nothing rather than merely
    // smaller. Granting proportionally more lines keeps the text readable;
    // containers were converted to minHeight so they can grow to fit.
    const { fontScale } = useWindowDimensions();
    const effectiveScale = Math.min(fontScale || 1, MAX_FONT_SCALE);
    // adjustsFontSizeToFit means the caller wants the text squeezed into
    // exactly the lines it asked for — a nav label that must stay on one
    // line, for instance. Granting extra lines there would defeat it, so
    // the line count is left alone whenever that prop is present.
    const lines =
      numberOfLines &&
      numberOfLines > 0 &&
      effectiveScale > 1.05 &&
      !(rest as { adjustsFontSizeToFit?: boolean }).adjustsFontSizeToFit
        ? Math.ceil(numberOfLines * effectiveScale)
        : numberOfLines;

    return (
    <RNText
      ref={ref}
      numberOfLines={lines}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_FONT_SCALE}
      // React Native defaults flexShrink to 0, unlike the web's 1. Inside a
      // flexDirection: 'row' that means a label physically cannot give up any
      // width: as the OS text size grows it pushes its siblings out of the row
      // and off screen, and numberOfLines cannot help because there is no
      // narrower box to truncate into. Allowing text to shrink is what lets it
      // wrap or ellipsize instead of overflowing.
      //
      // Applied only once the text is actually enlarged. At the default or a
      // smaller size the layout must render exactly as it did before any of
      // this scaling work existed — flexShrink changes how a row distributes
      // space, so leaving it on permanently altered alignment and spacing for
      // everyone, not just users who had raised their text size.
      //
      // Listed before `style` so any call site that sets its own flexShrink,
      // width or flex still wins.
      style={[effectiveScale > 1.05 ? { flexShrink: 1 } : null, style]}
      {...rest}
    />
    );
  },
);
Text.displayName = 'Text';

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
  ({ maxFontSizeMultiplier, ...rest }, ref) => (
    <RNTextInput
      ref={ref}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_FONT_SCALE}
      {...rest}
    />
  ),
);
TextInput.displayName = 'TextInput';
