import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface VideoSplashProps {
  onFinish: () => void;
}

const SCREEN_W = Dimensions.get("window").width;

// ─── Animation constants ──────────────────────────────────────────────────────

// When translateX = LOGO_SOLO_OFFSET, the logo appears visually centred on
// screen (compensates for the row layout shifting it left when text is hidden).
const LOGO_SOLO_OFFSET = 98;

// Logo dimensions
const LOGO_SIZE = 72;

// Pixels between the logo's left edge and the screen's left edge at rest point
const EDGE_PADDING = 20;

// translateX value that places the logo's LEFT edge at EDGE_PADDING from the
// screen's left edge.
//
// Derivation:
//   • At translateX = LOGO_SOLO_OFFSET → logo centre is at SCREEN_W / 2
//   • We want logo centre at: EDGE_PADDING + LOGO_SIZE / 2
//   • So: LEFT_EDGE_OFFSET = (EDGE_PADDING + LOGO_SIZE / 2) − SCREEN_W / 2 + LOGO_SOLO_OFFSET
//                          = EDGE_PADDING + LOGO_SIZE / 2 + LOGO_SOLO_OFFSET − SCREEN_W / 2
//                          = 20 + 36 + 98 − SCREEN_W / 2
//                          = 154 − SCREEN_W / 2
//
// e.g. 390px screen → 154 − 195 = −41  (logo shifts 41px left of row position)
//      360px screen → 154 − 180 = −26
const LEFT_EDGE_OFFSET = 154 - SCREEN_W / 2;

// ─── Component ───────────────────────────────────────────────────────────────

export default function VideoSplash({ onFinish }: VideoSplashProps) {
  // Logo starts at LOGO_SOLO_OFFSET so it appears centred before animating
  const logoTranslateX   = useSharedValue(LOGO_SOLO_OFFSET);
  const logoRotate       = useSharedValue(0);
  const textOpacity      = useSharedValue(0);
  const textTranslateX   = useSharedValue(SCREEN_W * 0.55);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    SplashScreen.hideAsync().finally(() => {
      setTimeout(() => {

        // ── Phase 1 (0–900ms): roll LEFT to near the left screen edge
        // ── Phase 4 (1300–2200ms): roll RIGHT back to centre (after 400ms wait)
        logoTranslateX.value = withSequence(
          withTiming(LEFT_EDGE_OFFSET, {
            duration: 900,
            easing: Easing.inOut(Easing.cubic),
          }),
          // 400ms pause at the left edge before rolling back
          withDelay(
            400,
            withTiming(0, {
              duration: 900,
              easing: Easing.inOut(Easing.cubic),
            })
          )
        );

        // Rotation: Clockwise (0 -> 360 deg) when rolling left, then anticlockwise (360 -> 0 deg) when returning back to text.
        logoRotate.value = withSequence(
          withTiming(360, {
            duration: 900,
            easing: Easing.inOut(Easing.cubic),
          }),
          withDelay(
            400,
            withTiming(0, {
              duration: 900,
              easing: Easing.inOut(Easing.cubic),
            })
          )
        );

        // ── Phase 3 (1100–1930ms): text slides in while logo is waiting
        // Starts 200ms into the logo's 400ms wait → text is fully settled
        // BEFORE the logo begins rolling back, so both meet perfectly at centre.
        textOpacity.value = withDelay(
          1100,
          withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
        );
        textTranslateX.value = withDelay(
          1100,
          withSequence(
            // Slide in from right with a subtle overshoot for a natural spring feel
            withTiming(-6, { duration: 700, easing: Easing.out(Easing.cubic) }),
            withTiming(0,  { duration: 130, easing: Easing.inOut(Easing.quad) })
          )
        );

        // ── Phase 6 (3500ms): fade the whole splash out
        containerOpacity.value = withDelay(
          3500,
          withTiming(0, { duration: 450 }, (finished) => {
            if (finished) runOnJS(onFinish)();
          })
        );

      }, 120);
    });
  }, [onFinish]);

  // ─── Animated styles ────────────────────────────────────────────────────────

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: logoTranslateX.value },
      { rotate: logoRotate.value + "deg" },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: textTranslateX.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <LinearGradient
        colors={["#EDEEDE", "#E2E1D4"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.row}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image
            source={require("@/assets/images/expo-logo.webp")}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
        <Animated.Text style={[styles.text, textStyle]}>QuotaHire</Animated.Text>
      </View>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDEEDE",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: { width: LOGO_SIZE, height: LOGO_SIZE },
  logo:     { width: LOGO_SIZE, height: LOGO_SIZE },
  text: {
    marginLeft: 4,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: "#0f172a",
  },
  textQuota: { color: "#0f172a" },
  textHire:  { color: "#0f172a" },
});
