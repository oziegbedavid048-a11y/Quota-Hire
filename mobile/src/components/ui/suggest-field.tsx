/**
 * A labelled input that offers suggestions for its own field.
 *
 * Replaces the single form-wide auto-fill button. That button filled every
 * field at once from a fixed script, which meant it wrote work history the
 * user had not claimed. This offers a short list of options for the one field
 * being typed in, matched to the target role, and the user picks.
 *
 * Behaviour:
 *   - The affordance appears once two characters have been typed, so it never
 *     covers an empty field or fires on a single stray keystroke.
 *   - Suggestions are scoped to this field only and never touch another.
 *   - For comma-separated fields only the fragment after the last comma is
 *     matched and replaced, so existing entries are preserved.
 */
import { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Text, TextInput } from '@/components/ui/text';
import { Palette, FontSize, FontWeight } from '@/constants/theme';
import {
  getSuggestions,
  splitListValue,
  applySuggestion,
  LIST_FIELDS,
  type SuggestFieldKind,
} from '@/constants/cv-suggestions';

/** Characters required before the affordance appears. */
const MIN_CHARS = 2;

export interface SuggestFieldProps {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  /** Which vocabulary to draw on. */
  field: SuggestFieldKind;
  /** The target role or job title the suggestions should match. */
  role?: string | null;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  colors: {
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
  };
  inputStyle?: TextStyle | TextStyle[];
  containerStyle?: ViewStyle;
  /** Hides the suggestion affordance without changing anything else. */
  suggestionsDisabled?: boolean;
}

export function SuggestField({
  label,
  value,
  onChangeText,
  field,
  role,
  placeholder,
  multiline = false,
  numberOfLines,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  colors,
  inputStyle,
  containerStyle,
  suggestionsDisabled = false,
}: SuggestFieldProps) {
  const [open, setOpen] = useState(false);
  const isList = LIST_FIELDS.includes(field);

  const { chosen, fragment } = useMemo(
    () => splitListValue(value, isList),
    [value, isList],
  );

  const suggestions = useMemo(
    () => (open ? getSuggestions(field, role, fragment, chosen) : []),
    [open, field, role, fragment, chosen],
  );

  // Count against the fragment, not the whole value: on a list field the user
  // starting a new entry has effectively typed nothing yet.
  const canSuggest = !suggestionsDisabled && fragment.trim().length >= MIN_CHARS;

  const choose = (text: string) => {
    Haptics.selectionAsync();
    onChangeText(applySuggestion(value, text, isList));
    setOpen(false);
  };

  return (
    <View style={containerStyle}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={(next) => {
            onChangeText(next);
            if (open) setOpen(false);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.text },
            multiline && styles.inputMultiline,
            // Keep typed text clear of the affordance sitting on the right.
            canSuggest && !multiline && styles.inputWithAction,
            inputStyle as TextStyle,
          ]}
        />

        {canSuggest && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setOpen((o) => !o);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={`Suggestions for ${label}`}
            style={({ pressed }) => [
              styles.action,
              multiline && styles.actionMultiline,
              open && styles.actionOpen,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Feather
              name={open ? 'x' : 'plus'}
              size={11}
              color={open ? '#ffffff' : Palette.accent700}
            />
            <Text
              style={[styles.actionText, { color: open ? '#ffffff' : Palette.accent700 }]}
              numberOfLines={1}
            >
              {open ? 'Close' : 'Suggestions'}
            </Text>
          </Pressable>
        )}
      </View>

      {open && (
        <View style={styles.panel}>
          {suggestions.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No suggestions for that yet — keep typing.
            </Text>
          ) : (
            suggestions.map((item) => (
              <Pressable
                key={item}
                onPress={() => choose(item)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              >
                <Feather name="corner-down-left" size={11} color={Palette.accent600} />
                <Text style={[styles.optionText, { color: colors.text }]}>{item}</Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: 6,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    minHeight: 42,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputWithAction: {
    paddingRight: 116,
  },
  action: {
    position: 'absolute',
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Palette.accent50,
    borderWidth: 1,
    borderColor: Palette.accent200,
    maxWidth: 104,
  },
  actionMultiline: {
    top: 8,
  },
  actionOpen: {
    backgroundColor: Palette.accent600,
    borderColor: Palette.accent600,
  },
  actionText: {
    fontSize: 10.5,
    fontWeight: FontWeight.bold,
  },
  panel: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Palette.accent200,
    borderRadius: 10,
    backgroundColor: Palette.accent50,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  optionPressed: {
    backgroundColor: Palette.accent100,
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  empty: {
    fontSize: FontSize.xs,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
});
