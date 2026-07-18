import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface VideoSplashProps {
  start: boolean;
  onFinish: () => void;
}

export default function VideoSplash({ start, onFinish }: VideoSplashProps) {
  // Y translation of the logo (starts high up, falls to 0, then bounces)
  const logoY = useSharedValue(-600);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(1.0);
  
  // Centers the logo initially: (marginLeft: 8 + textWidth: 150) / 2 = 79px shift to the right
  const logoTranslateX = useSharedValue(79); 
  
  const textOpacity = useSharedValue(0);
  const textTranslateX = useSharedValue(180); // starts further right for a dramatic slide-in
  
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    if (!start) return;

    // 1. Logo entrance: fade in immediately
    logoOpacity.value = withTiming(1, { duration: 250 });

    // 2. Drop and Bounce Sequence (snappy, premium visual pacing)
    logoY.value = withSequence(
      withTiming(-600, { duration: 0 }), // Start off-screen
      withTiming(0, { duration: 850, easing: Easing.in(Easing.quad) }), // Drop to ground
      withTiming(-90, { duration: 380, easing: Easing.out(Easing.quad) }), // First bounce up
      withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }), // First bounce down
      withTiming(-35, { duration: 240, easing: Easing.out(Easing.quad) }), // Second bounce up
      withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) }) // Second bounce down
    );

    // 3. Logo shifts left past 0 (pushed by text) and then pushes back to 0 (t = 2100ms)
    logoTranslateX.value = withDelay(
      2100,
      withSequence(
        withTiming(-20, { duration: 450, easing: Easing.out(Easing.quad) }), // text pushes logo left
        withTiming(0, { duration: 450, easing: Easing.bezier(0.25, 1, 0.5, 1) }) // logo pushes back and settles
      )
    );
    
    // 4. Text slides in past 0, pushing the logo, and then settles at 0
    textTranslateX.value = withDelay(
      2100,
      withSequence(
        withTiming(-20, { duration: 450, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 450, easing: Easing.bezier(0.25, 1, 0.5, 1) })
      )
    );
    
    textOpacity.value = withDelay(
      2100,
      withTiming(1, { duration: 450 })
    );

    // 5. Fade out the splash overlay and transition to app
    containerOpacity.value = withDelay(
      4500,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      })
    );
  }, [start, logoOpacity, logoY, logoTranslateX, textOpacity, textTranslateX, containerOpacity, onFinish]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: logoY.value },
      { scale: logoScale.value },
      { translateX: logoTranslateX.value },
    ],
  }));

  const shadowStyle = useAnimatedStyle(() => {
    // Shadow only appears when the logo is touching/very close to the ground (logoY close to 0)
    // Scale and opacity are dynamically linked to logoY (max opacity is light/subtle 0.05)
    const scale = interpolate(logoY.value, [-15, 0], [0.5, 1.0], Extrapolation.CLAMP);
    const opacity = interpolate(logoY.value, [-15, 0], [0, 0.05], Extrapolation.CLAMP);
    
    return {
      opacity: opacity,
      transform: [
        { translateX: logoTranslateX.value },
        { scaleX: scale },
        { scaleY: scale },
      ],
    };
  });

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
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.shadow, shadowStyle]} />
          <AnimatedImage
            source={require('@/assets/images/expo-logo.png')}
            style={[styles.logo, logoStyle]}
            contentFit="contain"
          />
        </View>
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
    backgroundColor: '#FAFCF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  logo: {
    width: 80,
    height: 80,
  },
  shadow: {
    width: 28,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#000000',
    position: 'absolute',
    bottom: 0, // sits directly touching the bottom of the logo
  },
  text: {
    fontSize: 32, // reduced to perfectly match the size weight of the 80x80 logo icon
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.8,
    marginLeft: 8, // closer to the logo for balanced lockup layout
    width: 150, // adjusted for the smaller text width
  },
});
