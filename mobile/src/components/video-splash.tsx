import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface VideoSplashProps {
  onFinish: () => void;
}

// ─── Layout maths ─────────────────────────────────────────────────────────────
// Combined lockup: logo 80 + gap 8 + text 150 = 238px
// Flex-row centres the full 238px block so logo centre = screenCenter − 79
// LOGO_CENTER_OFFSET = +79 shifts logo to true screen-centre
const SCREEN_W           = Dimensions.get('window').width;
const LOGO_CENTER_OFFSET = 79;                  // offset so logo starts at screen-center
const LOGO_EXIT_LEFT     = -150;                // rolls completely to the left side

export default function VideoSplash({ onFinish }: VideoSplashProps) {
  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoOpacity    = useSharedValue(1); // Start fully visible so it transitions seamlessly from native splash
  const logoTranslateX = useSharedValue(LOGO_CENTER_OFFSET); // start: screen-centre
  const logoRotate     = useSharedValue(0);

  // ── Text ──────────────────────────────────────────────────────────────────
  const textOpacity    = useSharedValue(0);
  const textTranslateX = useSharedValue(SCREEN_W * 0.7);  // start: far right off-screen

  // ── Container ─────────────────────────────────────────────────────────────
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Hide native splash screen and trigger JS animation immediately
    SplashScreen.hideAsync().finally(() => {
      // Wait for a small frame delay to ensure React Native has mounted and painted the view in the center
      setTimeout(() => {
        // ─── Phase 1 (0 – 900ms): Logo rolls LEFT entirely immediately ─────────
        //   translateX: +79 → LOGO_EXIT_LEFT  (-150px)
        //   rotate:      0  → -720            (two counter-clockwise turns)
        logoTranslateX.value = withTiming(LOGO_EXIT_LEFT, {
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
        });

        logoRotate.value = withTiming(-720, {
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
        });

        // ─── Phase 2 (1000 – 1950ms): Text slides in from right to centre ───────
        //   Starts after the logo has fully finished its roll left.
        textOpacity.value = withDelay(
          1000,
          withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) })
        );

        textTranslateX.value = withDelay(
          1000,
          withSequence(
            withTiming(-6, {
              duration: 820,
              easing: Easing.out(Easing.cubic),
            }),
            withTiming(0, {
              duration: 130,
              easing: Easing.inOut(Easing.quad),
            })
          )
        );

        // ─── Phase 3 (2000 – 2940ms): Logo rolls BACK from left to meet text ────
        //   Starts after the text is fully centered.
        //   translateX: -150 → 0  (natural balanced position next to text)
        //   rotate: -720 → 0      (two clockwise turns back to 0)
        logoTranslateX.value = withDelay(
          2000,
          withSequence(
            withTiming(0, {
              duration: 720,
              easing: Easing.inOut(Easing.cubic),
            }),
            withTiming(6,  { duration: 100, easing: Easing.out(Easing.quad) }),
            withTiming(0,  { duration: 120, easing: Easing.inOut(Easing.quad) })
          )
        );

        logoRotate.value = withDelay(
          2000,
          withTiming(0, {
            duration: 940,
            easing: Easing.inOut(Easing.cubic),
          })
        );

        // ─── Phase 4 (3700ms): Hold → fade entire splash out ────────────────────
        containerOpacity.value = withDelay(
          3700,
          withTiming(0, { duration: 500 }, (finished) => {
            if (finished) {
              runOnJS(onFinish)();
            }
          })
        );
      }, 150);
    });
  }, [onFinish]);

  // ── Animated styles ───────────────────────────────────────────────────────
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateX: logoTranslateX.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: textTranslateX.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={['#EDEEDE', '#E2E1D4']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.row}>
        {/* Logo — starts centred, rolls left, rolls back to meet text */}
        <Animated.View style={logoStyle}>
          <Image
            source={require('@/assets/images/expo-logo.webp')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
        {/* Text — slides in from the right */}
        <Animated.Text style={[styles.text, textStyle]}>
          Quota Hire
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEEDE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  logo: {
    width: 80,
    height: 80,
  },
  text: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.8,
    marginLeft: 8,
    width: 150,
  },
});

