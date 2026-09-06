/**
 * Saved Jobs Screen — Mobile
 * Mirrors the web SavedJobs page design exactly.
 * Shows 3D illustration banner + search + saved job cards.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Dimensions, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight, TabBarHeight,
} from '@/constants/theme';
import { useEmployeeDashboardData } from '@/hooks/useEmployeeDashboardData';
import { SkeletonJobCard, SkeletonLine } from '@/components/ui/skeleton';
import { HapticPressable } from '@/components/haptic-pressable';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 16;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Format salary with correct currency ─────────────────────────────────────
const formatRange = (range?: string, currency?: string) => {
  if (!range) return null;
  const cur = (currency || '').trim();
  if (!cur) return range;
  if (range.trimStart().startsWith(cur)) return range;
  return `${cur} ${range}`;
};

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  const colors = Colors.light;
  return (
    <Animated.View entering={FadeInDown.springify()} style={s.emptyRoot}>
      <View style={[s.emptyIconWrap, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Feather name="bookmark" size={44} color={Palette.neutral300} />
      </View>
      <Text style={[s.emptyTitle, { color: colors.text }]}>No saved jobs yet</Text>
      <Text style={[s.emptySub, { color: colors.textMuted }]}>
        When you find a role you like, tap the{' '}
        <Text style={{ color: Palette.warm600, fontWeight: '700' }}>bookmark icon</Text>
        {' '}to save it here for quick access.
      </Text>

      {/* Tips grid */}
      <View style={s.tipsRow}>
        {[
          { icon: 'search',   label: 'Find roles', desc: 'Browse open listings' },
          { icon: 'bookmark', label: 'Save them',  desc: 'Tap the bookmark icon' },
          { icon: 'zap',      label: 'Apply fast', desc: 'Come back & apply' },
        ].map(({ icon, label, desc }) => (
          <View key={label} style={[s.tipCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[s.tipIcon, { backgroundColor: Palette.accent100 }]}>
              <Feather name={icon as any} size={15} color={Palette.accent600} />
            </View>
            <Text style={[s.tipLabel, { color: colors.text }]}>{label}</Text>
            <Text style={[s.tipDesc, { color: colors.textMuted }]}>{desc}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onBrowse}
        style={({ pressed }) => [s.browseBtn, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={s.browseBtnText}>Browse Open Roles</Text>
        <Feather name="arrow-right" size={16} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

// ─── Saved Job Card ───────────────────────────────────────────────────────────
function SavedJobCard({
  job, index, onUnsave, onView,
}: {
  job: any; index: number; onUnsave: () => void; onView: () => void;
}) {
  const colors = Colors.light;
  const [unsaving, setUnsaving] = useState(false);

  const handleUnsave = async (e: any) => {
    e.stopPropagation?.();
    setUnsaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onUnsave();
    setUnsaving(false);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <HapticPressable
        activeScale={0.98}
        onPress={onView}
        style={[
          s.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.border,
          },
          Shadow.card,
        ]}
      >
        {/* Accent top bar */}
        <View style={s.cardAccent} />

        <View style={s.cardBody}>
          {/* Top row */}
          <View style={s.cardTop}>
            <View style={s.cardTopLeft}>
              {job.companyLogoUrl ? (
                <Image source={{ uri: job.companyLogoUrl }} style={s.logo} contentFit="cover" />
              ) : (
                <View style={[s.logoPlaceholder, { backgroundColor: Palette.neutral100 }]}>
                  <Text style={[s.logoText, { color: colors.text }]}>
                    {(job.companyName || 'C').charAt(0)}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={s.companyRow}>
                  <Text style={[s.companyName, { color: colors.textMuted }]} numberOfLines={1}>
                    {job.companyName}
                  </Text>
                  {job.companyIsVerified && (
                    <Feather name="check-circle" size={12} color={Palette.blue500} />
                  )}
                </View>
                <Text style={[s.jobTitle, { color: colors.text }]} numberOfLines={2}>
                  {job.title}
                </Text>
              </View>
            </View>

            {/* Unsave bookmark */}
            <Pressable onPress={handleUnsave} disabled={unsaving} style={s.heartBtn} hitSlop={8}>
              {unsaving ? (
                <Feather name="loader" size={15} color={Palette.warm600} />
              ) : (
                <Feather name="bookmark" size={15} color={Palette.warm600} />
              )}
            </Pressable>
          </View>

          {/* Badges */}
          <View style={s.badgesRow}>
            <View style={[s.badge, { backgroundColor: Palette.neutral100, borderColor: Palette.neutral200 }]}>
              <Feather name="map-pin" size={10} color={colors.textMuted} />
              <Text style={[s.badgeText, { color: colors.textSecondary }]} numberOfLines={1}>
                {job.isRemote ? 'Remote' : (job.location || 'On-site')}
              </Text>
            </View>
            <View style={[s.badge, { backgroundColor: Palette.purple50, borderColor: Palette.purple500 }]}>
              <Feather name="briefcase" size={10} color={Palette.purple500} />
              <Text style={[s.badgeText, { color: Palette.purple700 }]} numberOfLines={1}>
                {job.workType || 'Full-time'}
              </Text>
            </View>
            {job.salaryRange && (
              <View style={[s.badge, { backgroundColor: Palette.emerald50, borderColor: Palette.emerald500 }]}>
                <Text style={[s.badgeText, { color: Palette.emerald600 }]} numberOfLines={1}>
                  {formatRange(job.salaryRange, job.currency)}
                </Text>
              </View>
            )}
          </View>

          {/* Requirements preview */}
          {job.requirements && job.requirements.length > 0 && (
            <View style={s.reqRow}>
              {(job.requirements as string[]).slice(0, 3).map((req: string, i: number) => (
                <View key={i} style={[s.reqChip, { backgroundColor: Palette.neutral50, borderColor: Palette.neutral200 }]}>
                  <Text style={[s.reqText, { color: colors.textMuted }]} numberOfLines={1}>{req}</Text>
                </View>
              ))}
              {job.requirements.length > 3 && (
                <View style={[s.reqChip, { backgroundColor: Palette.neutral50, borderColor: Palette.neutral200 }]}>
                  <Text style={[s.reqText, { color: colors.textMuted }]}>+{job.requirements.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom row */}
          <View style={s.cardBottom}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Feather name="clock" size={11} color={colors.textMuted} />
              <Text style={[s.savedAtText, { color: colors.textMuted }]}>
                Saved · {formatDate(job.savedAt)}
              </Text>
            </View>
            <Pressable onPress={onView} style={s.viewBtn}>
              <Text style={[s.viewBtnText, { color: Palette.accent600 }]}>View Role</Text>
              <Feather name="arrow-right" size={12} color={Palette.accent600} />
            </Pressable>
          </View>
        </View>
      </HapticPressable>
    </Animated.View>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SavedJobsScreen() {
  const colors = Colors.light;
  const router = useRouter();

  const {
    jobs, savedJobs, toggleSavedJob, isFetching, isLoading, refreshData,
  } = useEmployeeDashboardData();

  const savedList = jobs.filter(j => savedJobs.includes(j.id));

  // Only show skeleton on the very first load (isLoading).
  // isFetching stays true during Phase 2 background calls — don't block
  // the UI on that since jobs + savedJobs are already available after Phase 1.
  const showSkeleton = isLoading;

  const handleUnsave = useCallback(async (jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleSavedJob(jobId);
  }, [toggleSavedJob]);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: TabBarHeight + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refreshData}
            tintColor={Palette.accent500}
            colors={[Palette.accent500]}
          />
        }
      >
        {/* ── Hero Banner ── */}
        <Animated.View entering={FadeInUp.springify()} style={[s.heroBanner, { borderColor: colors.borderMid }]}>
          <LinearGradient
            colors={['#FCEFCF', '#E1F6DD']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={s.heroContent}>
            {/* Text side */}
            <View style={{ flex: 1 }}>
              <View style={[s.heroPill, { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.border }]}>
                <Feather name="bookmark" size={12} color={Palette.warm600} />
                <Text style={[s.heroPillText, { color: colors.textSecondary }]}>My Saved Roles</Text>
              </View>
              <Text style={[s.heroTitle, { color: colors.text }]}>Your Job Shortlist</Text>
              <Text style={[s.heroSub, { color: colors.textSecondary }]}>
                Roles you bookmarked, ready to apply whenever you are.
              </Text>
              {showSkeleton ? (
                <View style={{ marginTop: 6 }}>
                  <SkeletonLine width={130} height={20} style={{ borderRadius: 8 }} />
                </View>
              ) : savedList.length > 0 ? (
                <View style={[s.countBadge, { backgroundColor: Palette.accent50, borderColor: Palette.accent200 }]}>
                  <Feather name="bookmark" size={12} color={Palette.accent600} />
                  <Text style={[s.countText, { color: Palette.accent700 }]}>
                    {savedList.length} {savedList.length === 1 ? 'role' : 'roles'} saved
                  </Text>
                </View>
              ) : null}
            </View>

            {/* 3D Illustration */}
            <Image
              source={require('@/assets/images/illustrations/saved_jobs_illustration.webp')}
              style={s.heroImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>



        {/* ── Content ── */}
        {showSkeleton ? (
          // Skeleton loading — only on first mount, not during background refreshes
          <View style={{ gap: 12, paddingHorizontal: 16 }}>
            {[1, 2, 3].map(k => <SkeletonJobCard key={k} />)}
          </View>
        ) : savedList.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <EmptyState onBrowse={() => router.push('/explore' as any)} />
          </View>
        ) : (
          <>
            {savedList.map((job, idx) => (
              <SavedJobCard
                key={job.id}
                job={job}
                index={idx}
                onUnsave={() => handleUnsave(job.id)}
                onView={() => router.push(`/job-details?id=${job.id}` as any)}
              />
            ))}

            {/* Bottom CTA */}
            <Animated.View entering={FadeInDown.delay(300).springify()} style={s.bottomCta}>
              <Pressable
                onPress={() => router.push('/explore' as any)}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: 'row', alignItems: 'center', gap: 6 })}
              >
                <Feather name="search" size={14} color={colors.textMuted} />
                <Text style={[s.bottomCtaText, { color: colors.textMuted }]}>Discover more roles</Text>
                <Feather name="arrow-right" size={13} color={Palette.accent500} />
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const purple100 = '#f3e8ff';
const purple600  = '#9333ea';

const s = StyleSheet.create({
  scroll: {
    paddingHorizontal: H_PAD,
    paddingTop: 18,
    paddingBottom: 16,
    gap: 12,
  },

  // ── Hero Banner ──
  heroBanner: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 4,
    marginBottom: 4,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  blob1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  blob2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(21,117,10,0.07)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1,
    marginBottom: 8,
  },
  heroPillText: {
    fontSize: 11, fontWeight: '700',
  },
  heroTitle: {
    fontSize: 21, fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 26,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 11, lineHeight: 15, marginBottom: 8,
  },
  countBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  countText: {
    fontSize: 12, fontWeight: '700',
  },
  heroImage: {
    width: 100, height: 100,
    flexShrink: 0,
  },



  // ── Empty state ──
  emptyCard: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
  },
  emptyRoot: {
    alignItems: 'center',
    paddingVertical: 32, paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconWrap: {
    width: 96, height: 96,
    borderRadius: 24, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20, fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13, textAlign: 'center',
    lineHeight: 18, marginBottom: 8, maxWidth: 280,
  },
  tipsRow: {
    flexDirection: 'row', gap: 8, width: '100%',
    marginVertical: 8,
  },
  tipCard: {
    flex: 1, alignItems: 'center', padding: 10, borderRadius: 14, borderWidth: 1, gap: 4,
  },
  tipIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  tipLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  tipDesc:  { fontSize: 10, textAlign: 'center' },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Palette.accent600,
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, marginTop: 8,
  },
  browseBtnText: {
    color: '#fff', fontWeight: '800', fontSize: 14,
  },

  // ── Job card ──
  card: {
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 2,
  },
  cardAccent: {
    height: 3,
    backgroundColor: 'transparent',
  },
  cardBody: {
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 10,
  },
  cardTopLeft: {
    flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  logo: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
  },
  logoPlaceholder: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: {
    fontSize: 18, fontWeight: '800',
  },
  companyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2,
  },
  companyName: {
    fontSize: 11, fontWeight: '600',
  },
  jobTitle: {
    fontSize: 14, fontWeight: '800', lineHeight: 20,
  },
  heartBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
  },
  badgesRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  badgeText: {
    fontSize: 11, fontWeight: '600',
  },
  reqRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  reqChip: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1,
    maxWidth: 120,
  },
  reqText: {
    fontSize: 10, fontWeight: '500',
  },
  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  savedAtText: { fontSize: 11, fontWeight: '500' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  viewBtnText: {
    fontSize: 12, fontWeight: '800',
  },

  // ── Bottom CTA ──
  bottomCta: {
    alignItems: 'center', paddingVertical: 16,
  },
  bottomCtaText: { fontSize: 13, fontWeight: '600' },
});
