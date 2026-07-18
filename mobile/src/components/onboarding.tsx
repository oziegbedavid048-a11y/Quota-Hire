import React, { useState, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const ONBOARDING_PAGES = [
  {
    key: "1",
    title: "Revenue Engines that Work",
    subtitle: "REVENUE SYSTEMS",
    description:
      "We don't just 'give you staff'. We establish, recruit, onboard, and manage functioning Sales & Marketing systems with full process and accountability to turn your business into a consistent revenue machine.",
    image: require("@/assets/images/onboarding/revenue.png"),
  },
  {
    key: "2",
    title: "Pre-Vetted Elite Talent",
    subtitle: "ZERO CV SPAM",
    description:
      "Skip the generic job boards. We source, test, and deliver only pre-vetted Sales, Marketing, Finance & Ops talent. You only interview the top 3-5% of applicants.",
    image: require("@/assets/images/onboarding/talent.png"),
  },
  {
    key: "3",
    title: "Showcase Your Track Record",
    subtitle: "VERIFIED CAREERS",
    description:
      "Automatically generate polished sales CVs featuring transparent OTE metrics, verified performance quotas, and target tracking to stand out directly to high-growth global companies.",
    image: require("@/assets/images/onboarding/speed.png"),
  },
  {
    key: "4",
    title: "Managed Growth & Success",
    subtitle: "ACCOUNTABILITY",
    description:
      "We run weekly sales huddles, monthly reviews, and ongoing training. Underperformers get coached or replaced under our 90-day free replacement warranty.",
    image: require("@/assets/images/onboarding/growth.png"),
  },
];

interface OnboardingProps {
  onFinish: () => void;
}

export default function Onboarding({ onFinish }: OnboardingProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / windowWidth);
    if (
      index !== activeIndex &&
      index >= 0 &&
      index < ONBOARDING_PAGES.length
    ) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    if (activeIndex === ONBOARDING_PAGES.length - 1) {
      onFinish();
    } else {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * windowWidth,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  const backgroundColors = ["#fffbeb", "#f4fbf2"] as const;
  const textColor = "#0f172a";
  const subtextColor = "#475569";
  const activeDotColor = "#15750a"; // Quota Hire Brand Green
  const inactiveDotColor = "rgba(15, 23, 42, 0.15)";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.brandContainer}>
            <Image
              source={require("@/assets/images/logo-glow.png")}
              style={styles.brandLogo}
              contentFit="contain"
            />
            <Text style={[styles.brandText, { color: textColor }]}>
              Quota Hire
            </Text>
          </View>
          {activeIndex < ONBOARDING_PAGES.length - 1 && (
            <Pressable onPress={handleSkip} hitSlop={12}>
              <Text style={[styles.skipText, { color: subtextColor }]}>
                Skip
              </Text>
            </Pressable>
          )}
        </View>

        {/* Scrollable Carousel */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {ONBOARDING_PAGES.map((page) => (
            <View key={page.key} style={[styles.slide, { width: windowWidth }]}>
              <View style={styles.imageContainer}>
                <Image
                  source={page.image}
                  style={styles.image}
                  contentFit="contain"
                  transition={0}
                  cachePolicy="memory"
                  priority="high"
                />
              </View>

              {/* Text Description Section */}
              <View style={styles.textContainer}>
                <Text style={styles.subtitle}>{page.subtitle}</Text>
                <Text style={[styles.title, { color: textColor }]}>
                  {page.title}
                </Text>
                <Text style={[styles.description, { color: subtextColor }]}>
                  {page.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {/* Page Indicators */}
          <View style={styles.indicatorContainer}>
            {ONBOARDING_PAGES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === activeIndex ? activeDotColor : inactiveDotColor,
                    width: i === activeIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.actionButton,
              { opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={styles.actionButtonText}>
              {activeIndex === ONBOARDING_PAGES.length - 1
                ? "Get Started"
                : "Next"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandLogo: {
    width: 22,
    height: 22,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  imageContainer: {
    flex: 1.1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  image: {
    width: "85%",
    height: "85%",
  },
  textContainer: {
    flex: 0.9,
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#72dd15", // Accent Green
    letterSpacing: 3,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 20,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionButton: {
    backgroundColor: "#15750a",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#15750a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
