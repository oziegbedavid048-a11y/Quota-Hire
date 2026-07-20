/**
 * Quota Hire — Company Dashboard (Mobile)
 * EXACT visual clone of src/pages/company/CompanyDashboard.tsx
 *
 * Sections (in order, matching web):
 *  1. Hero banner  — gradient + 3D post_job_recruiter.png + CTA buttons
 *  2. KPI stat cards (horizontal scroll on mobile)
 *  3. Application Flow area chart (Applicant Velocity)
 *  4. Pipeline Status donut chart
 *  5. Role Performance bar chart
 *  6. Your Active Roles list
 *  7. Profile Completion card (only shown if score < 100)
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Platform,
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

import {
  Colors, Palette, Shadow, BorderRadius,
  FontSize, FontWeight, TabBarHeight,
} from '@/constants/theme';
import { useCompanyDashboardData } from '@/hooks/useCompanyDashboardData';
import { GlassView } from 'expo-glass-effect';
import { SkeletonBox as Skeleton, SkeletonLine } from '@/components/ui/skeleton';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 16;
const CHART_W = SCREEN_W - H_PAD * 2 - 32;

// ─── LiquidGlassCard ─────────────────────────────────────────────────────────
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

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, iconName, iconBg, iconColor, sub, onPress, delay = 0, style,
}: {
  label: string; value: React.ReactNode;
  iconName: React.ComponentProps<typeof Feather>['name'];
  iconBg: string; iconColor: string;
  sub?: React.ReactNode; onPress?: () => void; delay?: number;
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
              <Text style={[styles.kpiValue, { color: colors.text }]}>{value}</Text>
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

// ─── SectionCard ─────────────────────────────────────────────────────────────
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

// ─── Job status config (matches web getStatusInfo) ────────────────────────────
const JOB_STATUS: Record<string, { label: string; dot: string; chip: string; chipText: string; icon: React.ComponentProps<typeof Feather>['name'] }> = {
  approved: { label: 'Active',   dot: Palette.emerald500, chip: '#d1fae5', chipText: '#065f46', icon: 'check-circle' },
  pending:  { label: 'Pending',  dot: Palette.amber500,   chip: '#fef3c7', chipText: '#92400e', icon: 'clock'        },
  rejected: { label: 'Rejected', dot: Palette.red400,     chip: '#fee2e2', chipText: '#991b1b', icon: 'x-circle'     },
};

// ─── Main Company Dashboard ───────────────────────────────────────────────────
export default function CompanyDashboardScreen() {
  const colors = Colors.light;
  const router = useRouter();

  const {
    company, jobs, activeJobs, pendingJobs, applications, analytics,
    profileScore, profileItems, refreshData, isLoading,
  } = useCompanyDashboardData();

  const firstName = company.companyName?.split(' ')[0] || company.name?.split(' ')[0] || 'there';

  // Derived application counts
  const pendingAppsCount  = applications.filter(a => a.status === 'pending').length;
  const acceptedAppsCount = applications.filter(a => a.status === 'accepted').length;
  const rejectedAppsCount = applications.filter(a => a.status === 'rejected').length;
  const totalApplicants   = analytics.totalApplicantsCount || applications.length;

  // Pipeline pie data (matches web appStatusData)
  const pieData = [
    { value: pendingAppsCount,  color: Palette.blue500,    text: 'Pending'  },
    { value: acceptedAppsCount, color: Palette.emerald500, text: 'Accepted' },
    { value: rejectedAppsCount, color: Palette.red400,     text: 'Rejected' },
  ].filter(d => d.value > 0);

  // Application flow line chart (velocity data)
  const lineData = analytics.applicantVelocityData.map((d: { name: string; applicants: number }) => ({
    value: d.applicants,
    label: d.name,
    dataPointColor: Palette.blue500,
  }));

  // Role performance bar chart
  const barData = analytics.jobPerformanceData.map((d: { name: string; applicants: number }) => ({
    value: d.applicants,
    label: d.name,
    frontColor: Palette.indigo500,
  }));

  // Completion items (matches web completionItems)
  const completionItems = [
    { label: 'Company Name',     done: !!company.companyName  },
    { label: 'Industry',         done: !!company.industry     },
    { label: 'About Company',    done: !!company.aboutCompany },
    { label: 'Active Job Posted',done: activeJobs.length > 0  },
    { label: 'Profile Verified', done: !!company.isVerified   },
  ];
  const completionScore = Math.round(
    (completionItems.filter(i => i.done).length / completionItems.length) * 100
  );

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
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={Palette.accent500}
            colors={[Palette.accent500]}
          />
        }
      >

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1 — HERO BANNER
            Matches web: gradient + post_job_recruiter.png + CTA buttons
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

            {/* 3D Illustration — post_job_recruiter.png (matches web) */}
            <Image
              source={require('../../assets/images/illustrations/post_job_recruiter.webp')}
              style={styles.heroImage}
              contentFit="contain"
              transition={300}
            />

            {/* Pills row */}
            <View style={styles.pillsRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: colors.borderMid }]}>
                <Feather name="activity" size={11} color={Palette.accent500} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Company Dashboard</Text>
              </View>
              {company.isVerified && (
                <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: colors.borderMid }]}>
                  <Feather name="check-circle" size={11} color={Palette.blue500} />
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Verified</Text>
                </View>
              )}
            </View>

            {/* Heading — "Welcome back, {name}!" */}
            <Text style={[styles.heroH1, { color: colors.text }]}>
              Welcome back,{' '}
              {isLoading ? (
                <Skeleton width={100} height={24} style={{ display: 'inline-flex' } as any} />
              ) : (
                <Text style={{ color: Palette.accent500 }}>{firstName}!</Text>
              )}
            </Text>

            {/* Sub-text */}
            {isLoading ? (
              <View style={{ gap: 6, marginVertical: 6 }}>
                <SkeletonLine width="80%" />
                <SkeletonLine width="60%" />
              </View>
            ) : (
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                You have{' '}
                <Text style={{ color: colors.text, fontWeight: FontWeight.bold }}>
                  {activeJobs.length} active role{activeJobs.length !== 1 ? 's' : ''}
                </Text>
                {' '}and{' '}
                <Text style={{ color: colors.text, fontWeight: FontWeight.bold }}>
                  {totalApplicants} applicant{totalApplicants !== 1 ? 's' : ''}
                </Text>
                {' '}in your pipeline. Keep building your dream team.
              </Text>
            )}

            {/* CTA Buttons — Post New Role + Manage Roles */}
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
                <Feather name="plus" size={15} color="#fff" />
                <Text style={styles.ctaPrimaryText}>Post New Role</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/tracker' as any);
                }}
                style={({ pressed }) => [
                  styles.ctaSecondary,
                  { backgroundColor: '#ffffff', borderColor: colors.borderMid, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.ctaSecondaryText, { color: colors.text }]}>Manage Roles</Text>
                <Feather name="arrow-right" size={15} color={colors.text} />
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
            label="Active Roles"
            value={isLoading ? <Skeleton width={60} height={24} /> : activeJobs.length}
            iconName="briefcase" iconBg={Palette.blue50} iconColor={Palette.blue600}
            sub={isLoading ? <Skeleton width={80} height={12} style={{ marginTop: 4 }} /> : `${pendingJobs.length} pending approval`}
            onPress={() => router.push('/tracker' as any)} delay={60}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Total Applicants"
            value={isLoading ? <Skeleton width={60} height={24} /> : totalApplicants}
            iconName="users" iconBg={Palette.violet50} iconColor={Palette.violet600}
            sub={isLoading ? <Skeleton width={80} height={12} style={{ marginTop: 4 }} /> : "Across all roles"}
            delay={120}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Top Skill Matches"
            value={isLoading ? <Skeleton width={60} height={24} /> : analytics.topMatchesCount || 0}
            iconName="star" iconBg={Palette.warm50} iconColor={Palette.warm500}
            sub={isLoading ? <Skeleton width={80} height={12} style={{ marginTop: 4 }} /> : "High-fit candidates"}
            delay={180}
            style={styles.kpiGridItem}
          />
          <StatCard
            label="Hiring Velocity"
            value={isLoading ? <Skeleton width={60} height={24} /> : analytics.applicantVelocityData.reduce((acc: number, d: { name: string; applicants: number }) => acc + d.applicants, 0)}
            iconName="trending-up" iconBg={Palette.emerald50} iconColor={Palette.emerald600}
            sub={isLoading ? <Skeleton width={80} height={12} style={{ marginTop: 4 }} /> : "Applications this week"}
            delay={240}
            style={styles.kpiGridItem}
          />
        </View>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 3 — APPLICATION FLOW (Area Chart)
            Matches web: Applicants per day this week, 7-Day View
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={300} style={{ marginBottom: 16 }}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Application Flow</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Applicants per day this week</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: Palette.blue50 }]}>
              <Feather name="bar-chart-2" size={11} color={Palette.blue500} />
              <Text style={[styles.chipText, { color: Palette.blue600 }]}>7-Day View</Text>
            </View>
          </View>

          {isLoading ? (
            <Skeleton width="100%" height={160} />
          ) : lineData.length > 0 ? (
            <LineChart
              data={lineData}
              width={CHART_W}
              height={160}
              areaChart
              curved
              color1={Palette.blue500}
              startFillColor1={Palette.blue500}
              startOpacity1={0.25}
              endOpacity1={0}
              thickness1={3}
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={0}
              rulesColor="rgba(0,0,0,0.06)"
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}
              isAnimated
              animationDuration={800}
              hideDataPoints={false}
              dataPointsColor1={Palette.blue500}
              dataPointsRadius={4}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Feather name="trending-up" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No velocity data yet</Text>
            </View>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 4 — PIPELINE STATUS (Donut Chart)
            Matches web: Application breakdown
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={360} style={{ marginBottom: 16 }}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Pipeline Status</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Application breakdown</Text>
            </View>
          </View>

          {isLoading ? (
            <Skeleton width="100%" height={144} borderRadius={16} />
          ) : pieData.length > 0 ? (
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
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
                  <View key={d.text} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                      {d.text}: {d.value}
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
            SECTION 5 — ROLE PERFORMANCE (Bar Chart)
            Matches web: Applicants attracted per job posting
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={420} style={{ marginBottom: 16 }}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Role Performance</Text>
              <Text style={[styles.chartSub, { color: colors.textMuted }]}>Applicants attracted per job posting</Text>
            </View>
            <Pressable onPress={() => router.push('/tracker' as any)}>
              <Text style={[styles.viewAllText, { color: Palette.accent500 }]}>View all →</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <Skeleton width="100%" height={160} />
          ) : barData.length > 0 ? (
            <BarChart
              data={barData}
              width={CHART_W}
              height={160}
              barWidth={24}
              spacing={18}
              barBorderRadius={6}
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={0}
              rulesColor="rgba(0,0,0,0.06)"
              yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}
              xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}
              isAnimated
              animationDuration={700}
            />
          ) : (
            <View style={styles.emptyChart}>
              <Feather name="bar-chart" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No performance data yet</Text>
            </View>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 6 — YOUR ACTIVE ROLES (list)
            Matches web: jobs list with status badges + Manage all link
            ════════════════════════════════════════════════════════════════════ */}
        <SectionCard delay={480} style={{ marginBottom: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Your Active Roles</Text>
            <Pressable onPress={() => router.push('/tracker' as any)}>
              <Text style={[styles.viewAllText, { color: Palette.accent500 }]}>Manage all →</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={{ gap: 12 }}>
              {[1, 2, 3].map(k => (
                <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                  <Skeleton width={36} height={36} borderRadius={18} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonLine width="60%" />
                    <SkeletonLine width="40%" />
                  </View>
                  <Skeleton width={60} height={20} borderRadius={6} />
                </View>
              ))}
            </View>
          ) : jobs.length === 0 ? (
            <View style={styles.emptyChart}>
              <View style={[styles.emptyIconWrap, { backgroundColor: Palette.blue50 }]}>
                <Feather name="briefcase" size={28} color={Palette.blue400} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No roles posted yet</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>Start attracting top sales talent</Text>
              <Pressable
                onPress={() => router.push('/explore' as any)}
                style={[styles.emptyBtn, { backgroundColor: Palette.accent500 }]}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={styles.emptyBtnText}>Post Your First Role</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 0 }}>
              {jobs.slice(0, 5).map((job, i) => {
                const status = JOB_STATUS[job.status] || JOB_STATUS.pending;
                return (
                  <View
                    key={job.id}
                    style={[
                      styles.jobRow,
                      { borderBottomColor: colors.border },
                      i < Math.min(jobs.length, 5) - 1 && { borderBottomWidth: 1 },
                    ]}
                  >
                    {/* Gradient initial */}
                    <LinearGradient
                      colors={[Palette.blue50, '#eef2ff']}
                      style={styles.jobInitial}
                    >
                      <Text style={[styles.jobInitialText, { color: Palette.blue600 }]}>
                        {(job.title || 'J').charAt(0)}
                      </Text>
                    </LinearGradient>

                    {/* Title + location */}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        <Feather name="map-pin" size={10} color={colors.textMuted} />
                        <Text style={[styles.jobLocation, { color: colors.textMuted }]}>
                          {job.location || 'Remote'}
                        </Text>
                      </View>
                    </View>

                    {/* Status badge */}
                    <View style={[styles.statusChip, { backgroundColor: status.chip }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
                      <Text style={[styles.statusText, { color: status.chipText }]}>{status.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 7 — PROFILE COMPLETION (only if score < 100)
            Matches web: blue gradient progress bar + checklist
            ════════════════════════════════════════════════════════════════════ */}
        {completionScore < 100 && (
          <SectionCard delay={540} style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="target" size={16} color={Palette.blue500} />
                <Text style={[styles.chartTitle, { color: colors.text }]}>Profile Score</Text>
              </View>
              <Text style={[styles.profileScoreVal, { color: Palette.blue600 }]}>
                {completionScore}%
              </Text>
            </View>

            {/* Blue → indigo gradient progress bar (matches web) */}
            <View style={[styles.progressBg, { backgroundColor: colors.border, marginBottom: 12 }]}>
              <LinearGradient
                colors={[Palette.blue500, Palette.indigo600]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${completionScore}%` as any }]}
              />
            </View>

            {/* Completion checklist */}
            <View style={{ gap: 10 }}>
              {completionItems.map(item => (
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
                { backgroundColor: Palette.blue50, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.profileBtnText, { color: Palette.blue600 }]}>
                Complete Profile →
              </Text>
            </Pressable>
          </SectionCard>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: H_PAD, gap: 0 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  heroBanner: {
    borderRadius: BorderRadius.cardLg, borderWidth: 1, padding: 20, overflow: 'hidden',
  },
  blob1: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 90 },
  blob2: { position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: 70 },
  heroImage: { alignSelf: 'center', width: Math.min(180, SCREEN_W * 0.45), height: Math.min(180, SCREEN_W * 0.45), marginBottom: 12 },
  pillsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1,
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
  },
  ctaSecondaryText: { fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  // ── KPI cards ─────────────────────────────────────────────────────────────
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
  statCard: { width: '100%', padding: 16, borderWidth: 0 },
  statCardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 12,
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  kpiValue:  { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, letterSpacing: -0.5 },
  statLabel: { fontSize: FontSize.sm,  fontWeight: FontWeight.semibold, marginTop: 2 },
  statSub:   { fontSize: FontSize.xs,  marginTop: 2 },
  // ── Section cards ─────────────────────────────────────────────────────────
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

  // ── Legend ────────────────────────────────────────────────────────────────
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

  // ── Active roles list ─────────────────────────────────────────────────────
  viewAllText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  jobRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
  },
  jobInitial: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  jobInitialText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  jobTitle:    { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  jobLocation: { fontSize: FontSize.xs },
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
    marginTop: 14, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
  },
  profileBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
