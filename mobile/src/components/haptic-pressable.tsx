import React from 'react';
import {
  Pressable,
  PressableProps,
  GestureResponderEvent,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export interface HapticPressableProps extends Omit<PressableProps, 'style'> {
  children?: React.ReactNode;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
  activeScale?: number;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Apple Design compliant interactive pressable:
 * 1. Responds instantly on pointer-down / touch-down (no tap-lag)
 * 2. Provides micro-tactile haptic feedback on touch-down
 * 3. Uses interruptible spring physics for scale transitions
 */
export const HapticPressable: React.FC<HapticPressableProps> = ({
  children,
  onPress,
  onPressIn,
  onPressOut,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  activeScale = 0.96,
  style,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    // Instant touch-down response (Apple Design #1)
    scale.value = withSpring(activeScale, { damping: 20, stiffness: 350 });
    try {
      Haptics.impactAsync(hapticStyle);
    } catch {
      // Fail silently if device does not support haptics
    }
    if (onPressIn) {
      onPressIn(event);
    }
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    // Critically damped spring return on release
    scale.value = withSpring(1, { damping: 18, stiffness: 300 });
    if (onPressOut) {
      onPressOut(event);
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style as any]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};
