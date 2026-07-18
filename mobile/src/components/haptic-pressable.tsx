import React from 'react';
import { Pressable, PressableProps, GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface HapticPressableProps extends PressableProps {
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export const HapticPressable: React.FC<HapticPressableProps> = ({
  children,
  onPress,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  ...props
}) => {
  const handlePress = async (event: GestureResponderEvent) => {
    try {
      // Soft haptic tap
      await Haptics.impactAsync(hapticStyle);
    } catch (e) {
      // Fail silently if device doesn't support haptics
    }
    if (onPress) {
      onPress(event);
    }
  };

  return (
    <Pressable onPress={handlePress} {...props}>
      {children}
    </Pressable>
  );
};
