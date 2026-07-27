/**
 * Quota Hire — Shared Skeleton Loading Components
 * Used across all screens to show placeholders while backend data loads.
 * Static UI (layout, labels, navigation) shows instantly.
 * Only data-dependent content (names, numbers, lists) uses skeleton.
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

// ─── Base skeleton box ────────────────────────────────────────────────────────
export function SkeletonBox({
  width = '100%' as any,
  height = 16,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, backgroundColor: '#e2e8f0', borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ─── Skeleton line (text placeholder) ────────────────────────────────────────
export function SkeletonLine({
  width = '80%' as any,
  height = 14,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}) {
  return <SkeletonBox width={width} height={height} borderRadius={6} style={style} />;
}

// ─── Skeleton avatar / circle ─────────────────────────────────────────────────
export function SkeletonAvatar({ size = 44 }: { size?: number }) {
  return <SkeletonBox width={size} height={size} borderRadius={size / 2} />;
}

// ─── Skeleton stat card ───────────────────────────────────────────────────────
export function SkeletonStatCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[sk.statCard, style]}>
      <SkeletonBox width={36} height={36} borderRadius={10} style={{ marginBottom: 12 }} />
      <SkeletonLine width="55%" height={22} style={{ marginBottom: 6 }} />
      <SkeletonLine width="75%" height={11} />
    </View>
  );
}

// ─── Skeleton job card ────────────────────────────────────────────────────────
export function SkeletonJobCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[sk.jobCard, style]}>
      <View style={sk.row}>
        <SkeletonBox width={44} height={44} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
          <SkeletonLine width="65%" height={14} />
          <SkeletonLine width="45%" height={11} />
        </View>
        <SkeletonBox width={28} height={28} borderRadius={14} />
      </View>
      <View style={[sk.row, { gap: 6, marginTop: 10 }]}>
        <SkeletonBox width={70} height={22} borderRadius={8} />
        <SkeletonBox width={80} height={22} borderRadius={8} />
        <SkeletonBox width={60} height={22} borderRadius={8} />
      </View>
      <View style={{ gap: 5, marginTop: 10 }}>
        <SkeletonLine width="100%" height={11} />
        <SkeletonLine width="80%"  height={11} />
      </View>
      <View style={[sk.row, { justifyContent: 'space-between', marginTop: 12 }]}>
        <SkeletonLine width="35%" height={11} />
        <SkeletonBox width={88} height={30} borderRadius={8} />
      </View>
    </View>
  );
}

// ─── Skeleton post card (community feed) ─────────────────────────────────────
export function SkeletonPostCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[sk.postCard, style]}>
      <View style={sk.row}>
        <SkeletonAvatar size={38} />
        <View style={{ flex: 1, marginLeft: 10, gap: 6 }}>
          <SkeletonLine width="50%" height={13} />
          <SkeletonLine width="30%" height={10} />
        </View>
        <SkeletonBox width={55} height={20} borderRadius={6} />
      </View>
      <View style={{ gap: 5, marginTop: 12 }}>
        <SkeletonLine width="100%" height={13} />
        <SkeletonLine width="90%"  height={13} />
        <SkeletonLine width="70%"  height={13} />
      </View>
      <View style={[sk.row, { gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }]}>
        <SkeletonBox width={48} height={18} borderRadius={6} />
        <SkeletonBox width={48} height={18} borderRadius={6} />
      </View>
    </View>
  );
}

// ─── Skeleton notification item ───────────────────────────────────────────────
export function SkeletonNotificationItem({ style }: { style?: ViewStyle }) {
  return (
    <View style={[sk.notifItem, style]}>
      <SkeletonAvatar size={36} />
      <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
        <SkeletonLine width="75%" height={13} />
        <SkeletonLine width="50%" height={10} />
      </View>
    </View>
  );
}

// ─── Skeleton tracker / application card ─────────────────────────────────────
export function SkeletonApplicationCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[sk.appCard, style]}>
      <View style={sk.row}>
        <SkeletonBox width={40} height={40} borderRadius={10} />
        <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
          <SkeletonLine width="60%" height={14} />
          <SkeletonLine width="40%" height={11} />
        </View>
        <SkeletonBox width={72} height={22} borderRadius={10} />
      </View>
      <View style={[sk.row, { gap: 6, marginTop: 10 }]}>
        <SkeletonBox width={70} height={20} borderRadius={6} />
        <SkeletonBox width={80} height={20} borderRadius={6} />
      </View>
    </View>
  );
}

// ─── Skeleton job details screen ─────────────────────────────────────────────
export function SkeletonJobDetails({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ padding: 16, gap: 16 }, style]}>
      {/* Hero card skeleton */}
      <View style={[sk.jobCard, { padding: 20, gap: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
          <SkeletonBox width={60} height={60} borderRadius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <SkeletonLine width="45%" height={12} />
            <SkeletonLine width="85%" height={18} />
            <SkeletonLine width="65%" height={14} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <SkeletonBox width={90} height={26} borderRadius={8} />
          <SkeletonBox width={80} height={26} borderRadius={8} />
        </View>
      </View>

      {/* About section skeleton */}
      <View style={{ gap: 10 }}>
        <SkeletonLine width="35%" height={15} />
        <SkeletonLine width="100%" height={12} />
        <SkeletonLine width="95%" height={12} />
        <SkeletonLine width="80%" height={12} />
        <SkeletonLine width="90%" height={12} />
      </View>

      {/* Requirements skeleton */}
      <View style={{ gap: 10 }}>
        <SkeletonLine width="40%" height={15} />
        {[1,2,3].map(k => (
          <View key={k} style={[sk.jobCard, { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }]}>
            <SkeletonBox width={22} height={22} borderRadius={11} />
            <SkeletonLine width="75%" height={12} />
          </View>
        ))}
      </View>

      {/* Compensation skeleton */}
      <View style={[sk.jobCard, { padding: 16 }]}>
        <SkeletonLine width="35%" height={15} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonLine width="60%" height={10} />
            <SkeletonLine width="80%" height={20} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonLine width="60%" height={10} />
            <SkeletonLine width="80%" height={20} />
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const sk = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    minWidth: 150,
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  appCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
});
