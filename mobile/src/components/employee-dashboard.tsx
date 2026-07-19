/**
 * Quota Hire — Employee Dashboard (Mobile)
 * EXACT visual clone of src/pages/employee/EmployeeDashboard.tsx
 *
 * Sections (in order, matching web):
 *  1. Hero banner  — gradient + 3D employee_welcome.png + CTA buttons
 *  2. KPI stat cards (horizontal scroll on mobile)
 *  3. Application Activity bar chart
 *  4. Pipeline Breakdown donut chart
 *  5. Market Salary Trends area chart
 *  6. Recent Applications list
 *  7. Profile Completion card (only shown if score < 100)
 *  8. Recommended Roles (horizontal scroll)
 */

import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { BarChart, PieChart, LineChart } from 'react-native-gifted-charts';
import Svg, { Polygon, Line, Circle, Text as SvgText, G } from 'react-native-svg';

import {
  Colors, Palette, Shadow, BorderRadius,
  FontSize, FontWeight, Spacing, TabBarHeight,
} from '@/constants/theme';
import { useEmployeeDashboardData } from '@/hooks/useEmployeeDashboardData';
import { GlassView } from 'expo-glass-effect';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 16;
const CHART_W = SCREEN_W - H_PAD * 2 - 32;

function Skeleton({ width, height, borderRadius, style }: { width?: any; height?: any; borderRadius?: number; style?: any }) {
  const opacity = useRef(new RNAnimated.Value(0.3)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 0.8,
          duration: 850,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 0.3,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <RNAnimated.View
      style={[
        {
          width: width ?? '100%',
          height: height ?? 20,
          backgroundColor: '#e2e8f0',
          borderRadius: borderRadius ?? 8,
          opacity: opacity,
        },
        style,
      ]}
    />
  );
}

function RadarChartSvg({ data, width, height }: { data: any[]; width: number; height: number }) {
  const colors = Colors.light;
  if (!data || data.length === 0) return null;

  const padding = 35;
  const radius = Math.min(width, height) / 2 - padding;
  const cx = width / 2;
  const cy = height / 2;
  const levels = 3;

  const getPoint = (index: number, total: number, value: number, max: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / max) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const total = data.length;
  const maxVal = 150;

  const levelRings = [];
  for (let i = 1; i <= levels; i++) {
    const r = (radius / levels) * i;
    const points = [];
    for (let j = 0; j < total; j++) {
      const angle = (Math.PI * 2 / total) * j - Math.PI / 2;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    levelRings.push(points.join(' '));
  }

  const axisLines = [];
  for (let j = 0; j < total; j++) {
    const outerPoint = getPoint(j, total, maxVal, maxVal);
    axisLines.push(
      <Line
        key={`axis-${j}`}
        x1={cx}
        y1={cy}
        x2={outerPoint.x}
        y2={outerPoint.y}
        stroke={colors.borderMid}
        strokeWidth={1.5}
      />
    );
  }

  const pointsA = data.map((d, j) => {
    const pt = getPoint(j, total, d.A || 0, maxVal);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const pointsB = data.map((d, j) => {
    const pt = getPoint(j, total, d.B || 0, maxVal);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const labelOffset = 14;
  const labels = data.map((d, j) => {
    const angle = (Math.PI * 2 / total) * j - Math.PI / 2;
    const labelRadius = radius + labelOffset;
    const x = cx + labelRadius * Math.cos(angle);
    const y = cy + labelRadius * Math.sin(angle);
    
    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    if (Math.cos(angle) > 0.1) textAnchor = 'start';
    if (Math.cos(angle) < -0.1) textAnchor = 'end';

    return (
      <SvgText
        key={`label-${j}`}
        x={x}
        y={y + 4}
        fill={colors.textSecondary}
        fontSize={10}
        fontWeight="600"
        textAnchor={textAnchor}
      >
        {d.subject}
      </SvgText>
    );
  });

  return (
    <Svg width={width} height={height}>
      <G>
        {levelRings.map((points, idx) => (
          <Polygon
            key={`ring-${idx}`}
            points={points}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {axisLines}
        {pointsB && (
          <Polygon
            points={pointsB}
            fill="rgba(99,102,241,0.12)"
            stroke={Palette.indigo500}
            strokeWidth={2}
          />
        )}
        {pointsA && (
          <Polygon
            points={pointsA}
            fill="rgba(245,158,11,0.25)"
            stroke={Palette.warm500}
            strokeWidth={2}
          />
        )}
        {labels}
      </G>
    </Svg>
  );
}

function LiquidGlassCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const {
    padding,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    width,
    height,
    margin,
    marginHorizontal,
    marginVertical,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    flex,
    ...otherStyle
  } = flattenedStyle as any;

  return (
    <View style={[
      {
        borderRadius: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
      },
      { width, height, margin, marginHorizontal, marginVertical, marginTop, marginBottom, marginLeft, marginRight, flex }
    ]}>
      <View style={[{
        flex: flex ?? 1,
        height: height ? '100%' : undefined,
        width: width ? '100%' : undefined,
        padding: padding ?? 16,
        paddingHorizontal,
        paddingVertical,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }, otherStyle]}>
        {children}
      </View>
    </View>
  );
}

function StatCard({
  label, value, iconName, iconBg, iconColor, sub, onPress, delay = 0, style,
}: {
  label: string;
  value: React.ReactNode;
  iconName: any;
  iconBg: string;
  iconColor: string;
  sub?: React.ReactNode;
  onPress?: () => void;
  delay?: number;
  style?: any;
}) {
  const colors = Colors.light;
  const scale  = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = useCallback(() => {
    if (!onPress) return;
    scale.value = withSpring(0.95, { damping: 12 }, () => {
      scale.value = withSpring(1, { damping: 14 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={style}>
      <Animated.View style={animStyle}>
        <Pressable onPress={handlePress}>
          <LiquidGlassCard style={styles.statCard}>
            <View style={styles.statCardTop}>
              <View style={[styles.statIconWrap, { backgroundColor: iconBg }]}>
                <Feather name={iconName} size={18} color={iconColor} />
              </View>
              {onPress && <Feather name="chevron-right" size={13} color={colors.textMuted} />}
            </View>
            {React.isValidElement(value) ? (
              <View style={{ height: 32, justifyContent: 'center', marginBottom: 4 }}>{value}</View>
            ) : (
              <Text style={[styles.kpiValue, { color: colors.text }]}>
                {value}
              </Text>
            )}
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
            {React.isValidElement(sub) ? (
              sub
            ) : (
              sub && <Text style={[styles.statSub, { color: colors.textMuted }]}>{sub}</Text>
            )}
          </LiquidGlassCard>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Section card (custom gradient translucent glass card) ───────────────────
function SectionCard({ children, delay = 0, style }: {
  children: React.ReactNode; delay?: number; style?: any;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={style}>
      <LiquidGlassCard style={styles.sectionCard}>
        {children}
      </LiquidGlassCard>
    </Animated.View>
  );
}

// ─── Status chip config (mirrors web statusConfig exactly) ───────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; chip: string; chipText: string }> = {
  pending:      { label: 'Applied',          dot: Palette.neutral400,  chip: Palette.neutral100,  chipText: Palette.neutral600 },
  under_review: { label: 'Under Review',     dot: Palette.amber500,    chip: Palette.amber50,     chipText: Palette.amber700   },
  interview:    { label: 'Interview',        dot: Palette.purple500,   chip: Palette.purple50,    chipText: Palette.purple700  },
  decision:     { label: 'Decision Pending', dot: Palette.blue500,     chip: Palette.blue50,      chipText: Palette.blue600    },
  accepted:     { label: 'Offer Received',   dot: Palette.emerald500,  chip: Palette.emerald50,   chipText: Palette.emerald600 },
  rejected:     { label: 'Not Selected',     dot: Palette.red400,      chip: Palette.red50,       chipText: Palette.red700     },
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function EmployeeDashboardScreen() {
  const colors = Colors.light;
  const router = useRouter();

  const recommendedScrollRef = useRef<ScrollView>(null);
  const scrollXRef = useRef(0);
  const maxScrollXRef = useRef(0);
  const scrollWidthRef = useRef(0);
  const layoutWidthRef = useRef(0);
  const isInteractingRef = useRef(false);
  const hasBeenManuallyScrolledRef = useRef(false);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoScroll = useCallback(() => {
    if (intervalIdRef.current) return;
    intervalIdRef.current = setInterval(() => {
      if (isInteractingRef.current) return;
      if (maxScrollXRef.current <= 0) return;

      scrollXRef.current += 0.5; // smooth slow scroll speed
      if (scrollXRef.current >= maxScrollXRef.current) {
        scrollXRef.current = 0;
      }
      recommendedScrollRef.current?.scrollTo({ x: scrollXRef.current, animated: false });
    }, 20);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  const handleScroll = useCallback((event: any) => {
    if (isInteractingRef.current) {
      scrollXRef.current = event.nativeEvent.contentOffset.x;
    }
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    isInteractingRef.current = true;
  }, []);

  const handleScrollEndDrag = useCallback((event: any) => {
    scrollXRef.current = event.nativeEvent.contentOffset.x;
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  }, []);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    scrollXRef.current = event.nativeEvent.contentOffset.x;
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  }, []);

  const handleTouchStart = useCallback(() => {
    isInteractingRef.current = true;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  }, []);

  const handleContentSizeChange = useCallback((w: number) => {
    scrollWidthRef.current = w;
    maxScrollXRef.current = Math.max(0, w - layoutWidthRef.current);
  }, []);

  const handleLayout = useCallback((event: any) => {
    const w = event.nativeEvent.layout.width;
  layoutWidthRef.current = w;
    maxScrollXRef.current = Math.max(0, scrollWidthRef.current - w);
  }, []);

  const {
    user, jobs, applications, savedJobs, analytics,
    profileScore, profileItems, toggleSavedJob, refreshData, isLoading,
    isFetching, hasError, isNetworkError,
  } = useEmployeeDashboardData();

  const firstName    = user.name.split(' ')[0];
  const approvedJobs = jobs.filter(j => j.status === 'approved').slice(0, 4);
  const infiniteApprovedJobs = Array.from({ length: 50 }, () => approvedJobs).flat();
  const skillMatchData  = analytics?.skillMatchData || [];
  const displaySkillData = skillMatchData.length > 0 ? skillMatchData : [
    { subject: 'Product Knowledge', A: 110, B: 95 },
    { subject: 'Closing Deals', A: 125, B: 110 },
    { subject: 'Cold Outreach', A: 85, B: 90 },
    { subject: 'Relationship Bldg', A: 115, B: 100 },
    { subject: 'Presentation', A: 100, B: 115 },
  ];

  const pendingApps     = applications.filter(a => a.status === 'pending').length;
  const underReviewApps = applications.filter(a => a.status === 'under_review').length;
  const interviewApps   = applications.filter(a => a.status === 'interview').length;
  const acceptedApps    = applications.filter(a => a.status === 'accepted').length;
  const rejectedApps    = applications.filter(a => a.status === 'rejected').length;
  const decisionApps    = applications.filter(a => a.status === 'decision').length;

  // ── Charts data ──────────────────────────────────────────────────────────
  const pieData = [
    { value: pendingApps,     color: Palette.neutral400,  label: 'Applied',   text: String(pendingApps) },
    { value: underReviewApps, color: Palette.amber500,    label: 'Reviewing', text: String(underReviewApps) },
    { value: interviewApps,   color: Palette.purple500,   label: 'Interview', text: String(interviewApps) },
    { value: decisionApps,    color: Palette.blue500,     label: 'Decision',  text: String(decisionApps) },
    { value: acceptedApps,    color: Palette.emerald500,  label: 'Offer',     text: String(acceptedApps) },
    { value: rejectedApps,    color: Palette.red400,      label: 'Rejected',  text: String(rejectedApps) },
  ].filter(d => d.value > 0);

  const barData = analytics.applicationActivityData.flatMap((w: { week: string; apps: number; interviews: number }) => ([
    { value: w.apps,       label: w.week, frontColor: Palette.indigo500, spacing: 2, topLabelComponent: () => null },
    { value: w.interviews, label: '',     frontColor: Palette.emerald500 },
  ]));

  const salaryData1 = analytics.marketInsightsData.map((m: { month: string; ote: number; base: number }) => ({
    value: m.ote / 1000, label: m.month, dataPointColor: Palette.indigo500,
  }));
  const salaryData2 = analytics.marketInsightsData.map((m: { month: string; ote: number; base: number }) => ({
    value: m.base / 1000, dataPointColor: Palette.emerald500,
  }));

  const handleSaveJob = useCallback((jobId: string) => {
    toggleSavedJob(jobId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [toggleSavedJob]);

  return (
    <View style={styles.root}>
      {/* Visual background gradient */}
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: TabBarHeight + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refreshData}
            tintColor={Palette.accent500}
            colors={[Palette.accent500]}
          />
        }
      >
        {/* ── Network Error Banner ── */}
        {isNetworkError && (
          <Animated.View entering={FadeInDown.springify()} style={{
            marginBottom: 12, backgroundColor: '#fff3cd', borderRadius: 12,
            borderWidth: 1, borderColor: '#ffc107', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Feather name="wifi-off" size={18} color="#856404" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#856404' }}>Failed to Connect</Text>
              <Text style={{ fontSize: 11, color: '#856404', marginTop: 2 }}>Check your network connection and try again.</Text>
            </View>
            <Pressable
              onPress={refreshData}
              style={{ backgroundColor: '#856404', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Retry</Text>
            </Pressable>
          </Animated.View>
        )}
        {/* ── API Error Banner ── */}
        {hasError && !isNetworkError && (
          <Animated.View entering={FadeInDown.springify()} style={{
            marginBottom: 12, backgroundColor: '#fee2e2', borderRadius: 12,
            borderWidth: 1, borderColor: '#fca5a5', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Feather name="alert-circle" size={18} color="#b91c1c" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#b91c1c' }}>Something Went Wrong</Text>
              <Text style={{ fontSize: 11, color: '#b91c1c', marginTop: 2 }}>We couldn't load the latest data. Tap to refresh.</Text>
            </View>
            <Pressable
              onPress={refreshData}
              style={{ backgroundColor: '#b91c1c', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Try Again</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1 — HERO BANNER
            Matches web: gradient from-accent-500/10 via-white to-warm-500/10
            3D image on top (mobile) | text + CTAs below
            ════════════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={{ marginBottom: 16 }}>
          <LinearGradient
            colors={[
              '#FCEFCF',
              '#E1F6DD',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroBanner, { borderColor: colors.borderMid }]}
          >

            {/* 3D Illustration — employee_welcome.png */}
            <Image
              source={require('@/assets/images/employee_welcome.png')}
              style={styles.heroImage}
              contentFit="contain"
              transition={300}
            />

            {/* Pills row (My Dashboard + Verified) */}
            <View style={styles.pillsRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: colors.borderMid }]}>
                <Feather name="activity" size={11} color={Palette.indigo500} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>My Dashboard</Text>
              </View>
              {user.isVerified && (
                <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: colors.borderMid }]}>
                  <Feather name="check-circle" size={11} color={Palette.blue500} />
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Verified</Text>
                </View>
              )}
            </View>

            {/* Heading — "Ready to crush it, {name}!" */}
            <Text style={[styles.heroH1, { color: colors.text }]}>
              Ready to crush it,{' '}
              <Text style={{ color: Palette.indigo500 }}>{firstName}!</Text>
            </Text>

            {/* Sub-text — active apps + saved roles count */}
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              You have{' '}
              <Text style={{ color: colors.text, fontWeight: FontWeight.bold }}>
                {analytics.activeApps} active application{analytics.activeApps !== 1 ? 's' : ''}
              </Text>
              {' '}and{' '}
              <Text style={{ color: colors.text, fontWeight: FontWeight.bold }}>
                {savedJobs.length} saved role{savedJobs.length !== 1 ? 's' : ''}
              </Text>
              {'. '}Keep pushing — your next role is waiting.
            </Text>

            {/* CTA Buttons — Browse Jobs + CV Generator */}
            <View style={styles.ctaRow}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/explore' as any);
                }}
                style={({ pressed }) => [
                  styles.ctaPrimary,
                  { backgroundColor: Palette.accent500, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="search" size={15} color="#fff" />
                <Text style={styles.ctaPrimaryText}>Browse Jobs</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/cv' as any);
                }}
                style={({ pressed }) => [
                  styles.ctaSecondary,
                  { backgroundColor: '#ffffff', borderColor: colors.borderMid, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="star" size={15} color={Palette.warm500} />
                <Text style={[styles.ctaSecondaryText, { color: colors.text }]}>CV Generator</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2 — KPI STAT CARDS (vertical 2-column grid layout)
            Matches web grid-cols-4 layout logic, but wrapped vertically as a 2x2 grid
            ════════════════════════════════════════════════════════════════════ */}
        <View style={styles.kpiGrid}>
          <StatCard
            label="Active Applications" 
            value={isFetching ? <Skeleton width={60} height={26} /> : analytics.activeApps}
            iconName="briefcase" iconBg={Palette.accent50} iconColor={Palette.accent600}
            sub={isFetching ? <Skeleton width={90} height={14} style={{ marginTop: 4 }} /> : `${pendingApps} pending review`}
            onPress={() => router.push('/tracker' as any)} delay={60}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Saved Roles" 
            value={isFetching ? <Skeleton width={60} height={26} /> : savedJobs.length}
            iconName="heart" iconBg={Palette.warm50} iconColor={Palette.warm500}
            sub={isFetching ? <Skeleton width={90} height={14} style={{ marginTop: 4 }} /> : "Jobs bookmarked"}
            onPress={() => router.push('/explore' as any)} delay={120}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Profile Score" 
            value={isFetching ? <Skeleton width={60} height={26} /> : `${profileScore}%`}
            iconName="target" iconBg={Palette.emerald50} iconColor={Palette.emerald600}
            sub={isFetching ? <Skeleton width={90} height={14} style={{ marginTop: 4 }} /> : (profileScore === 100 ? 'Fully complete!' : 'Complete your profile')}
            onPress={() => router.push('/profile' as any)} delay={180}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Interviews Won" 
            value={isFetching ? <Skeleton width={60} height={26} /> : acceptedApps}
            iconName="check-circle" iconBg={Palette.violet50} iconColor={Palette.violet600}
            sub={isFetching ? <Skeleton width={90} height={14} style={{ marginTop: 4 }} /> : "Applications accepted"} 
            delay={240}
            style={styles.kpiGridItem}
          />
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3 — APPLICATION ACTIVITY (Bar Chart)
            Matches web: Applications & interview invites per week, 4-Week View
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={300} style={{ marginBottom: 16 }}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Application Activity</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Applications & interview invites per week</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: Palette.accent50 }]}>
              <Feather name="activity" size={11} color={Palette.indigo500} />
              <Text style={[styles.chipText, { color: Palette.indigo500 }]}>4-Week</Text>
            </View>
          </View>

          {isFetching ? (
            <View style={{ paddingVertical: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 180 + 24 }}>
                <View style={{ width: 28, height: 180, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 4, paddingBottom: 0 }}>
                  <Skeleton width={14} height={10} />
                  <Skeleton width={14} height={10} />
                  <Skeleton width={14} height={10} />
                  <Skeleton width={14} height={10} />
                </View>
                <View style={{ flex: 1, height: 180, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', paddingLeft: 12 }}>
                  <Skeleton width={18} height={120} borderRadius={4} />
                  <Skeleton width={18} height={80} borderRadius={4} />
                  <Skeleton width={18} height={150} borderRadius={4} />
                  <Skeleton width={18} height={100} borderRadius={4} />
                  <Skeleton width={18} height={60} borderRadius={4} />
                </View>
              </View>
            </View>
          ) : barData.length > 0 ? (
            <>
              {/* Big, well-arranged bar chart using custom View bars */}
              {(() => {
                // Group into weeks: each pair is [apps, interviews]
                const weeks = analytics.applicationActivityData as { week: string; apps: number; interviews: number }[];
                if (!weeks.length) return null;
                const allVals = weeks.flatMap(w => [w.apps, w.interviews]);
                const maxVal = Math.max(...allVals, 1);
                const chartHeight = 180;
                const barGroupWidth = (CHART_W - 16) / weeks.length;

                return (
                  <View style={{ paddingVertical: 8 }}>
                    {/* Y-axis labels + bars */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartHeight + 24 }}>
                      {/* Y labels */}
                      <View style={{ width: 28, height: chartHeight, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 4, paddingBottom: 0 }}>
                        {[maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33), 0].map((v, i) => (
                          <Text key={i} style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>{v}</Text>
                        ))}
                      </View>
                      {/* Bars area */}
                      <View style={{ flex: 1, height: chartHeight + 24 }}>
                        {/* Grid lines */}
                        {[0, 0.33, 0.66, 1].map((pct, i) => (
                          <View key={i} style={{
                            position: 'absolute',
                            left: 0, right: 0,
                            top: chartHeight * (1 - pct),
                            height: 1,
                            backgroundColor: 'rgba(0,0,0,0.06)',
                          }} />
                        ))}
                        {/* Bar groups */}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: chartHeight, gap: 0 }}>
                          {weeks.map((w, wi) => {
                            const appH = maxVal > 0 ? Math.max((w.apps / maxVal) * chartHeight, w.apps > 0 ? 4 : 0) : 0;
                            const intH = maxVal > 0 ? Math.max((w.interviews / maxVal) * chartHeight, w.interviews > 0 ? 4 : 0) : 0;
                            const bw = Math.max((barGroupWidth - 16) / 2, 12);
                            return (
                              <View key={wi} style={{ flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4, alignSelf: 'flex-end' }}>
                                {/* Apps bar */}
                                <View style={{ width: bw, height: appH, backgroundColor: Palette.indigo500, borderRadius: 4, borderTopLeftRadius: 5, borderTopRightRadius: 5 }}>
                                  {w.apps > 0 && appH > 16 && (
                                    <Text style={{ position: 'absolute', top: 4, alignSelf: 'center', fontSize: 8, color: '#fff', fontWeight: '800' }}>{w.apps}</Text>
                                  )}
                                </View>
                                {/* Interviews bar */}
                                <View style={{ width: bw, height: intH, backgroundColor: Palette.emerald500, borderRadius: 4, borderTopLeftRadius: 5, borderTopRightRadius: 5 }}>
                                  {w.interviews > 0 && intH > 16 && (
                                    <Text style={{ position: 'absolute', top: 4, alignSelf: 'center', fontSize: 8, color: '#fff', fontWeight: '800' }}>{w.interviews}</Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                        {/* X labels */}
                        <View style={{ flexDirection: 'row', marginTop: 6 }}>
                          {weeks.map((w, wi) => (
                            <View key={wi} style={{ flex: 1, alignItems: 'center' }}>
                              <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }} numberOfLines={1}>{w.week}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })()}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Palette.indigo500 }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Applications</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Palette.emerald500 }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Interviews</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Feather name="bar-chart-2" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No application activity yet</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Start applying to see your activity here</Text>
            </View>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4 — PIPELINE BREAKDOWN (Donut / Pie chart)
            Matches web: Status of your applications
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={360} style={{ marginBottom: 16 }}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Pipeline Breakdown</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Status of your applications</Text>
            </View>
          </View>

          {isFetching ? (
            <View style={{ alignItems: 'center', paddingVertical: 16, gap: 20 }}>
              <Skeleton width={120} height={120} borderRadius={60} />
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Skeleton width={70} height={16} borderRadius={8} />
                <Skeleton width={70} height={16} borderRadius={8} />
                <Skeleton width={70} height={16} borderRadius={8} />
              </View>
            </View>
          ) : pieData.length > 0 ? (
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
                showText
                textColor="white"
                textSize={10}
                radius={72}
                innerRadius={44}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>
                      {applications.length}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textMuted, fontWeight: '600' }}>
                      Total
                    </Text>
                  </View>
                )}
                isAnimated
                animationDuration={600}
              />
              <View style={styles.pieLegend}>
                {pieData.map(d => (
                  <View key={d.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                      {d.label}: {d.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Feather name="pie-chart" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No applications yet</Text>
            </View>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4.5 — SKILL MATCH ANALYSIS (Radar / Empty)
            Matches web: Your skills vs. market demand
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={390} style={{ marginBottom: 16 }}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Skill Match Analysis</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Your skills vs. market demand</Text>
            </View>
          </View>

          {isFetching ? (
            <View style={{ alignItems: 'center', paddingVertical: 16, gap: 16 }}>
              <Skeleton width={160} height={160} borderRadius={80} />
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                <Skeleton width={80} height={14} borderRadius={6} />
                <Skeleton width={80} height={14} borderRadius={6} />
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <RadarChartSvg
                data={displaySkillData}
                width={CHART_W}
                height={220}
              />
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Palette.warm500 }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Your Skills</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Palette.indigo500 }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Market Demand</Text>
                </View>
              </View>
            </View>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 5 — MARKET SALARY TRENDS (Area Chart)
            Matches web: Average Base vs. OTE over 6 months
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={420} style={{ marginBottom: 16 }}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Market Salary Trends</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Average Base vs. OTE over 6 months</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: Palette.emerald50 }]}>
              <Feather name="trending-up" size={11} color={Palette.emerald500} />
              <Text style={[styles.chipText, { color: Palette.emerald500 }]}>Live</Text>
            </View>
          </View>

          {isFetching ? (
            <View style={{ paddingVertical: 8, gap: 12 }}>
              <View style={{ height: 160, justifyContent: 'flex-end', gap: 8 }}>
                <Skeleton width="100%" height={110} borderRadius={10} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                  <Skeleton width={35} height={12} />
                  <Skeleton width={35} height={12} />
                  <Skeleton width={35} height={12} />
                  <Skeleton width={35} height={12} />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                <Skeleton width={60} height={14} />
                <Skeleton width={60} height={14} />
              </View>
            </View>
          ) : (
            <>
              <LineChart
                data={salaryData1}
                data2={salaryData2}
                width={CHART_W}
                height={160}
                areaChart
                curved
                color1={Palette.indigo500}
                color2={Palette.emerald500}
                startFillColor1={Palette.indigo500}
                startFillColor2={Palette.emerald500}
                startOpacity1={0.2}
                startOpacity2={0.15}
                endOpacity1={0}
                endOpacity2={0}
                thickness1={2.5}
                thickness2={2.5}
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={0}
                rulesColor="rgba(0,0,0,0.06)"
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}
                formatYLabel={(v) => `${Number(v).toFixed(0)}k`}
                isAnimated
                animationDuration={800}
                hideDataPoints={false}
                dataPointsColor1={Palette.indigo500}
                dataPointsColor2={Palette.emerald500}
                dataPointsRadius={3}
              />
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Palette.indigo500 }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>OTE</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Palette.emerald500 }]} />
                  <Text style={[styles.legendText, { color: colors.textSecondary }]}>Base Salary</Text>
                </View>
              </View>
            </>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 6 — RECENT APPLICATIONS
            Matches web: list of last 5 apps with status chips + View all link
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={480} style={{ marginBottom: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Recent Applications</Text>
            <Pressable onPress={() => router.push('/tracker' as any)}>
              <Text style={[styles.viewAllText, { color: Palette.accent500 }]}>View all →</Text>
            </Pressable>
          </View>

          {isFetching ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.appRow, { borderColor: colors.border }]}>
                  <Skeleton width={40} height={40} borderRadius={10} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={10} />
                  </View>
                  <Skeleton width={70} height={20} borderRadius={10} />
                </View>
              ))}
            </View>
          ) : applications.length === 0 ? (
            <View style={styles.emptyChart}>
              <View style={[styles.emptyIconWrap, { backgroundColor: Palette.accent50 }]}>
                <Feather name="briefcase" size={28} color={Palette.accent400} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No applications yet</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Start applying to land your next sales role</Text>
              <Pressable
                onPress={() => router.push('/explore' as any)}
                style={[styles.emptyBtn, { backgroundColor: Palette.accent500 }]}
              >
                <Feather name="search" size={14} color="#fff" />
                <Text style={styles.emptyBtnText}>Browse Jobs</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 4 }}>
              {applications.slice(0, 5).map((app) => {
                const s = STATUS_CONFIG[app.status] || STATUS_CONFIG['pending'];
                return (
                  <Pressable
                    key={app.id}
                    onPress={() => router.push('/tracker' as any)}
                    style={({ pressed }) => [
                      styles.appRow,
                      { borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    {/* Gradient initial circle or Company Logo */}
                    {app.companyLogoUrl ? (
                      <View style={[styles.appInitial, { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: '#ffffff' }]}>
                        <Image source={{ uri: app.companyLogoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      </View>
                    ) : (
                      <LinearGradient
                        colors={[Palette.accent100, Palette.warm100]}
                        style={styles.appInitial}
                      >
                        <Text style={styles.appInitialText}>
                          {(app.company_name || app.job_title || 'J').charAt(0)}
                        </Text>
                      </LinearGradient>
                    )}

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appTitle, { color: colors.text }]} numberOfLines={1}>
                        {app.job_title}
                      </Text>
                      <Text style={[styles.appCompany, { color: colors.textMuted }]}>
                        {app.company_name}
                      </Text>
                    </View>

                    {/* Status chip */}
                    <View style={[styles.statusChip, { backgroundColor: s.chip }]}>
                      <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
                      <Text style={[styles.statusText, { color: s.chipText }]}>{s.label}</Text>
                    </View>

                    <Feather name="chevron-right" size={14} color={colors.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 7 — PROFILE COMPLETION (only if score < 100)
            Matches web: gradient progress bar + checklist + Complete Profile button
            ════════════════════════════════════════════════════════════════════ */}
        {profileScore < 100 && (
          <SectionCard delay={540} style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="target" size={16} color={Palette.accent500} />
                <Text style={[styles.chartTitle, { color: colors.text }]}>Profile Score</Text>
              </View>
              <Text style={[styles.profileScoreVal, { color: Palette.accent500 }]}>
                {profileScore}%
              </Text>
            </View>

            {/* Gradient progress bar */}
            <View style={[styles.progressBg, { backgroundColor: colors.border, marginBottom: 12 }]}>
              <LinearGradient
                colors={[Palette.accent500, Palette.warm500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${profileScore}%` as any }]}
              />
            </View>

            {/* Checklist items */}
            <View style={{ gap: 10 }}>
              {profileItems.map(item => (
                <View key={item.label} style={styles.checkRow}>
                  <Feather
                    name={item.done ? 'check-circle' : 'circle'}
                    size={15}
                    color={item.done ? Palette.emerald500 : colors.textMuted}
                  />
                  <Text style={[
                    styles.checkLabel,
                    { color: item.done ? colors.text : colors.textMuted },
                  ]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={() => router.push('/profile' as any)}
              style={({ pressed }) => [
                styles.profileBtn,
                { backgroundColor: Palette.accent50, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.profileBtnText, { color: Palette.accent500 }]}>
                Complete Profile →
              </Text>
            </Pressable>
          </SectionCard>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 8 — RECOMMENDED ROLES (horizontal scroll cards)
            Matches web: Top approved jobs matching your profile
            ════════════════════════════════════════════════════════════════════ */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={{ marginBottom: 16 }}>
          <View style={[styles.sectionHeader, { marginBottom: 12 }]}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Recommended Roles</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Top approved jobs matching your profile</Text>
            </View>
            <Pressable onPress={() => router.push('/explore' as any)}>
              <Text style={[styles.viewAllText, { color: Palette.accent500 }]}>View All →</Text>
            </Pressable>
          </View>

          {isFetching ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 8, paddingVertical: 8 }}
              style={{ marginVertical: -8 }}
            >
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.jobCard, { borderColor: '#e2e8f0', width: 230, height: 220, borderRadius: 16, padding: 14, borderWidth: 1, backgroundColor: '#ffffff', overflow: 'hidden' }]}>
                  <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View style={styles.jobCardTop}>
                      <Skeleton width={40} height={40} borderRadius={12} />
                      <Skeleton width={32} height={32} borderRadius={10} />
                    </View>
                    <View style={{ gap: 6 }}>
                      <Skeleton width="80%" height={14} />
                      <Skeleton width="55%" height={10} />
                    </View>
                    <View style={{ gap: 6 }}>
                      <Skeleton width="100%" height={26} borderRadius={8} />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : approvedJobs.length === 0 ? (
            <View style={[styles.sectionCard, { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' }]}>
              <View style={styles.emptyChart}>
                <Feather name="search" size={28} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching roles right now</Text>
              </View>
            </View>
          ) : (
            <ScrollView
              ref={recommendedScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 8, paddingVertical: 8 }}
              style={{ marginVertical: -8 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScrollEndDrag={handleScrollEndDrag}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onContentSizeChange={handleContentSizeChange}
              onLayout={handleLayout}
            >
              {infiniteApprovedJobs.map((job, idx) => {
                const isSaved = savedJobs.includes(job.id);
                return (
                  <Pressable
                    key={`${job.id}-${idx}`}
                    onPress={() => router.push({ pathname: '/job-details', params: { id: job.id } } as any)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                  >
                    <LiquidGlassCard style={styles.jobCard}>
                      <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        {/* Company logo / initial + heart */}
                        <View style={styles.jobCardTop}>
                          <View style={[styles.jobInitial, { backgroundColor: 'rgba(255, 255, 255, 0.45)', borderColor: '#e2e8f0', overflow: 'hidden' }]}>
                            {job.companyLogoUrl ? (
                              <Image source={{ uri: job.companyLogoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                              <Text style={[styles.jobInitialText, { color: colors.textSecondary }]}>
                                {(job.companyName || 'C').charAt(0)}
                              </Text>
                            )}
                          </View>
                          <Pressable
                            onPress={(e) => { handleSaveJob(job.id); }}
                            style={[styles.heartBtn, { backgroundColor: isSaved ? Palette.warm100 : 'transparent' }]}
                            hitSlop={8}
                          >
                            <Feather name="heart" size={16} color={isSaved ? Palette.warm500 : colors.textMuted} />
                          </Pressable>
                        </View>

                        {/* Middle Info Section */}
                        <View style={{ flex: 1, justifyContent: 'center', marginVertical: 4 }}>
                          {/* Job title */}
                          <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
                            {job.title}
                          </Text>

                          {/* Company + verified */}
                          <View style={styles.companyRow}>
                            <Text style={[styles.jobCompany, { color: colors.textMuted }]} numberOfLines={1}>
                              {job.companyName}
                            </Text>
                            {job.companyIsVerified && (
                              <Feather name="check-circle" size={12} color={Palette.blue500} />
                            )}
                          </View>
                        </View>

                        {/* Bottom Actions section */}
                        <View>
                          {/* Tags: location, salary */}
                          <View style={styles.tagRow}>
                            <View style={[styles.tag, { backgroundColor: Palette.neutral100 }]}>
                              <Text style={[styles.tagText, { color: colors.textSecondary }]} numberOfLines={1}>{job.location}</Text>
                            </View>
                            {job.salaryRange ? (
                              <View style={[styles.tag, { backgroundColor: Palette.emerald50 }]}>
                                <Text style={[styles.tagText, { color: Palette.emerald600 }]} numberOfLines={1}>{job.salaryRange}</Text>
                              </View>
                            ) : null}
                          </View>

                          {/* Quick Apply button */}
                          <Pressable
                            onPress={() => router.push({ pathname: '/job-details', params: { id: job.id } } as any)}
                            style={({ pressed }) => [
                              styles.applyBtn,
                              { backgroundColor: Palette.accent500, opacity: pressed ? 0.85 : 1 },
                            ]}
                          >
                            <Text style={[styles.applyBtnText, { color: '#ffffff' }]}>Apply Now</Text>
                          </Pressable>
                        </View>
                      </View>
                    </LiquidGlassCard>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: H_PAD, gap: 0 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroBanner: {
    borderRadius: BorderRadius.cardLg,
    borderWidth:  1,
    padding:      20,
    overflow:     'hidden',
  },
  heroImage: {
    alignSelf: 'center',
    width:  Math.min(180, SCREEN_W * 0.45),
    height: Math.min(180, SCREEN_W * 0.45),
    marginBottom: 12,
  },
  pillsRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  heroH1: {
    fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5, marginBottom: 6, lineHeight: 32,
  },
  heroSub: { fontSize: FontSize.sm, marginBottom: 16, lineHeight: 20 },
  ctaRow: { flexDirection: 'row', gap: 10 },
  ctaPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12, borderRadius: BorderRadius.button,
  },
  ctaPrimaryText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  ctaSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 12, borderRadius: BorderRadius.button, borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ctaSecondaryText: { fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  kpiGridItem: {
    width: (SCREEN_W - H_PAD * 2 - 12) / 2,
  },
  statCard: {
    width: '100%', padding: 16, borderWidth: 0,
  },
  statCardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 12,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  kpiValue:  { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, letterSpacing: -0.5 },
  statLabel: { fontSize: FontSize.sm,  fontWeight: FontWeight.semibold, marginTop: 2 },
  statSub:   { fontSize: FontSize.xs,  marginTop: 2 },
  sectionCard: { padding: 16, borderWidth: 0 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  chartHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 16,
  },
  chartTitle: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold },
  chartSub:   { fontSize: FontSize.xs,   marginTop: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  chipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  legendRow:  { flexDirection: 'row', gap: 16, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyChart:    { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIconWrap: { padding: 16, borderRadius: 20, marginBottom: 4 },
  emptyText:     { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  emptySub:      { fontSize: FontSize.xs, textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  emptyBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  // ── Pie chart ─────────────────────────────────────────────────────────────
  pieContainer: { alignItems: 'center', gap: 16 },
  pieLegend:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },

  // ── Recent applications ───────────────────────────────────────────────────
  viewAllText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  appRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0',
  },
  appInitial: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  appInitialText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Palette.accent700 },
  appTitle:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  appCompany: { fontSize: FontSize.xs, marginTop: 1 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: FontWeight.bold },

  // ── Profile completion ────────────────────────────────────────────────────
  profileScoreVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  progressBg:      { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: 4 },
  checkRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel:      { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  profileBtn: {
    marginTop: 14, paddingVertical: 10,
    borderRadius: 12, alignItems: 'center',
  },
  profileBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // ── Recommended job cards ─────────────────────────────────────────────────
  jobCard: {
    width: 230, height: 220, borderRadius: BorderRadius.card, padding: 14, borderWidth: 1,
    borderColor: '#e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden',
  },
  jobCardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 10,
  },
  jobInitial: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  jobInitialText: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold },
  heartBtn: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  jobTitle:   { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 2 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  jobCompany: { fontSize: FontSize.xs },
  tagRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText:    { fontSize: 10, fontWeight: FontWeight.semibold },
  applyBtn:   { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  applyBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
