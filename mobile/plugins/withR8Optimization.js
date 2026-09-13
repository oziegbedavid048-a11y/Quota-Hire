/**
 * Turns on the two R8 settings Play Console flagged as missing on 1.0.8.
 *
 * The generated android/app/build.gradle already has minifyEnabled and
 * shrinkResources on (via expo-build-properties). What it does not do is
 * optimise: it asks for getDefaultProguardFile("proguard-android.txt"), and that
 * file contains -dontoptimize, so R8 shrinks and obfuscates the app but skips
 * every optimisation pass. That is Play's "Optimization isn't enabled".
 *
 * expo-build-properties for SDK 57 has no option for either setting — its
 * Android R8 surface is enableMinifyInReleaseBuilds,
 * enableShrinkResourcesInReleaseBuilds and extraProguardRules — so this plugin
 * writes them into the generated project instead.
 *
 * Options, both defaulting to true, set in app.json:
 *
 *   ["./plugins/withR8Optimization", { "optimize": true,
 *                                      "optimizedResourceShrinking": true }]
 *
 * optimize
 *   Swaps proguard-android.txt for proguard-android-optimize.txt. This is the
 *   setting with real risk. Optimisation inlines, merges and removes code, and
 *   anything a library reaches by reflection or from native code is protected
 *   only by that library's own keep rules. When one is missing the build still
 *   succeeds and the failure is a crash at runtime, in whichever screen touches
 *   that code. Expo's and React Native's templates ship the non-optimising file
 *   by default, which is a reason to test rather than assume. If a release
 *   build misbehaves, set this to false first.
 *
 * optimizedResourceShrinking
 *   Sets android.r8.optimizedResourceShrinking=true, which lets R8 shrink
 *   resources and code together so that resources referenced only from removed
 *   code are removed too. Supported from Android Gradle Plugin 8.6; this
 *   project resolves 8.12.0 through React Native 0.86.3, and it becomes the
 *   default in AGP 9. It changes which resources ship, not how code runs.
 *
 * Play's third point, upgrading to AGP 9, is not something this project can do
 * on its own: the plugin version is pinned by React Native's Gradle plugin, and
 * forcing a different one breaks the React Native build. It arrives with a
 * future Expo SDK.
 */

const {
  withAppBuildGradle,
  withGradleProperties,
  WarningAggregator,
} = require('expo/config-plugins');

const PLAIN = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZING = 'getDefaultProguardFile("proguard-android-optimize.txt")';
const RESOURCE_KEY = 'android.r8.optimizedResourceShrinking';
const TAG = 'withR8Optimization';

const withOptimizingProguardFile = (config) =>
  withAppBuildGradle(config, (config) => {
    const gradle = config.modResults.contents;

    if (gradle.includes(OPTIMIZING)) {
      return config;
    }

    if (!gradle.includes(PLAIN)) {
      // A future template has changed the line. Say so rather than silently
      // producing a build that is not optimised.
      WarningAggregator.addWarningAndroid(
        TAG,
        `Expected ${PLAIN} in android/app/build.gradle and did not find it, so R8 ` +
          'optimisation was not enabled. The Android template has probably changed.',
      );
      return config;
    }

    config.modResults.contents = gradle.replace(PLAIN, OPTIMIZING);
    return config;
  });

const withOptimizedResourceShrinking = (config) =>
  withGradleProperties(config, (config) => {
    const props = config.modResults.filter(
      (item) => !(item.type === 'property' && item.key === RESOURCE_KEY),
    );
    props.push({ type: 'property', key: RESOURCE_KEY, value: 'true' });
    config.modResults = props;
    return config;
  });

module.exports = (config, options = {}) => {
  const { optimize = true, optimizedResourceShrinking = true } = options;

  if (optimize) {
    config = withOptimizingProguardFile(config);
  }
  if (optimizedResourceShrinking) {
    config = withOptimizedResourceShrinking(config);
  }
  return config;
};
