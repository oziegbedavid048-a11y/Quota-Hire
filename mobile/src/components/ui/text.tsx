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
  ({ maxFontSizeMultiplier, ...rest }, ref) => (
    <RNText
      ref={ref}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_FONT_SCALE}
      {...rest}
    />
  ),
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
