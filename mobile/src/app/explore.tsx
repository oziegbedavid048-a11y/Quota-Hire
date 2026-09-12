import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { Text, TextInput } from '@/components/ui/text';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';

import CompanyPostJob from '@/components/company-post-job';
import CompanyMyJobs from '@/components/company-my-jobs';
import { SkeletonJobCard } from '@/components/ui/skeleton';
import {
  Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight, TabBarHeight,
} from '@/constants/theme';
import { HapticPressable } from '@/components/haptic-pressable';
import { useEmployeeDashboardData, Job, JOB_STATUS_UPDATED } from '@/hooks/useEmployeeDashboardData';
import { apiFetch } from '@/services/api';
import { cacheGet, cacheSet, CacheKeys } from '@/services/app-cache';
import { useStoredRole } from '@/services/user-role';

const { width: SCREEN_W } = Dimensions.get('window');

/** The employment filters offered behind the filter button. */
export type JobFilter = 'All' | 'Remote' | 'Full-time';

const FILTER_OPTIONS: { value: JobFilter; label: string; icon: any }[] = [
  { value: 'All',       label: 'All roles',  icon: 'layers' },
  { value: 'Remote',    label: 'Remote',     icon: 'globe' },
  { value: 'Full-time', label: 'Full-time',  icon: 'clock' },
];

export default function JobsScreen() {
  const colors = Colors.light;
  const router = useRouter();
  
  const role = useStoredRole();

  const { savedJobs, toggleSavedJob } = useEmployeeDashboardData();

  // Local pagination & fetching states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingLocal, setIsFetchingLocal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<JobFilter>('All');
  const [filterOpen, setFilterOpen] = useState(false);

  // Debounce search input to avoid redundant requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page and fetch new list when filters change
  useEffect(() => {
    setPage(1);
    fetchJobs(1, debouncedSearch, activeFilter, false);
  }, [debouncedSearch, activeFilter]);

  const fetchJobs = async (
    pageNum: number,
    searchVal: string,
    filterVal: string,
    isAppend: boolean,
  ) => {
    if (pageNum === 1 && !isRefreshing) {
      setIsLoading(true);
    }
    setIsFetchingLocal(true);
    try {
      let url = `/jobs/?page=${pageNum}`;
      const cleanSearch = searchVal.trim().replace(/^#/, '');
      if (cleanSearch) {
        url += `&search=${encodeURIComponent(cleanSearch)}`;
      }
      if (filterVal === 'Remote') {
        url += `&remote=true`;
      } else if (filterVal === 'Full-time') {
        url += `&employment_type=Full-time`;
      }

      const res = await apiFetch(url);
      const results = Array.isArray(res) ? res : (res?.results || []);
      const nextUrl = res?.next;

      const formattedJobs = results.filter((j: any) => j?.id != null).map((j: any) => ({
        id: String(j.id),
        title: j.title,
        companyName: j.company_name,
        companyLogoUrl: j.company_logo_url,
        companyIsVerified: Boolean(j.company_is_verified ?? j.is_verified),
        location: j.location,
        workType: j.is_remote ? "Remote" : ("Hybrid" as const),
        salaryRange: j.salary_range,
        commissionRange: j.commission_range,
        currency: j.currency || 'USD',
        description: j.description,
        requirements: j.requirements || [],
        status: j.status || "approved",
        postedAt: j.created_at || new Date().toISOString(),
      }));

      // Show approved jobs and closed jobs (closed positions remain visible per company spec)
      let visibleJobs = formattedJobs.filter((j: any) => j.status === 'approved' || j.status === 'closed');

      // No client-side re-filtering. /api/jobs/ now matches the term against
      // the title, the location and the job code across the whole table;
      // filtering the page again here could only ever search the twenty rows
      // that had already come back, and the old version quietly restored the
      // unfiltered list whenever its own filter matched nothing.

      setJobs(prev => isAppend ? [...prev, ...visibleJobs] : visibleJobs);
      // Cache page 1 results for instant restore next open
      if (pageNum === 1 && !isAppend) {
        cacheSet(CacheKeys.exploreJobs, visibleJobs);
      }
      setHasMore(!!nextUrl);
    } catch (e) {
      console.warn("Failed to fetch jobs in explore:", e);
    } finally {
      setIsLoading(false);
      setIsFetchingLocal(false);
    }
  };

  // Fast-path: Instant cache restore on mount
  useEffect(() => {
    (async () => {
      try {
        const cached = await cacheGet<Job[]>(CacheKeys.exploreJobs);
        if (cached) {
          setJobs(cached);
          setIsLoading(false);
        }
      } catch (_e) {}
    })();
  }, []);

  // Real-time synchronization of job status changes (e.g. company closing/reopening a job)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(JOB_STATUS_UPDATED, ({ jobId, status }: { jobId: string; status: any }) => {
      if (!jobId) return;
      setJobs(prev => prev.map(j => String(j.id) === String(jobId) ? { ...j, status } : j));
      cacheGet<Job[]>(CacheKeys.exploreJobs).then(cached => {
        if (cached) {
          const updated = cached.map(j => String(j.id) === String(jobId) ? { ...j, status } : j);
          cacheSet(CacheKeys.exploreJobs, updated);
        }
      });
    });
    return () => sub.remove();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await fetchJobs(1, debouncedSearch, activeFilter, false);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!hasMore || isFetchingLocal) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobs(nextPage, debouncedSearch, activeFilter, true);
  };

  const handleSave = (id: string) => {
    toggleSavedJob(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderJob = ({ item: job, index }: { item: Job; index: number }) => {
    const saved = savedJobs.includes(job.id);
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
        <HapticPressable
          activeScale={0.98}
          onPress={() => {
            router.push({
              pathname: '/job-details',
              params: { id: job.id },
            } as any);
          }}
          style={[
            s.jobCard,
            { backgroundColor: '#ffffff', borderColor: colors.borderMid },
          ]}
        >
          {/* Top row: logo + title + save heart */}
          <View style={s.jobTop}>
            <View style={[s.jobLogo, { borderColor: colors.border }]}>
              {job.companyLogoUrl ? (
                <Image
                  source={{ uri: job.companyLogoUrl }}
                  style={s.jobLogoImg}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={[Palette.neutral100, '#f8fafc']}
                  style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
                >
                  <Text style={[s.jobLogoText, { color: colors.text }]}>
                    {(job.companyName || 'C').charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.jobTitle, { color: colors.text }]} numberOfLines={1}>
                {job.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[s.jobCompany, { color: colors.textMuted }]}>
                  {job.companyName}
                </Text>
                {job.companyIsVerified && (
                  <Feather name="check-circle" size={11} color={Palette.blue500} />
                )}
              </View>
            </View>

            <Pressable
              onPress={() => handleSave(job.id)}
              style={[s.saveBtn, { backgroundColor: saved ? Palette.warm50 : 'transparent' }]}
              hitSlop={8}
            >
              <Feather name="bookmark" size={16} color={saved ? Palette.warm600 : colors.textMuted} />
            </Pressable>
          </View>

          {/* Tags: location / work type / salary / OTE.
              No closed marker here. A card in the list is an invitation to
              look, and a red Closed badge on it turns the whole list into a
              wall of rejections. Whether a role still takes applications is
              answered in one place, on the apply button inside the job. */}
          <View style={s.tagsRow}>
            <View style={[s.tag, { backgroundColor: Palette.neutral100 }]}>
              <Feather name="map-pin" size={10} color={colors.textMuted} />
              <Text style={[s.tagText, { color: colors.textSecondary }]}>{job.location}</Text>
            </View>
            <View style={[s.tag, { backgroundColor: Palette.neutral100 }]}>
              <Text style={[s.tagText, { color: colors.textSecondary }]}>{job.workType}</Text>
            </View>
            {job.salaryRange && (
              <View style={[s.tag, { backgroundColor: Palette.emerald50 }]}>
                <Text style={[s.tagText, { color: Palette.emerald600 }]}>
                  {job.currency ? `${job.currency} ` : ''}{job.salaryRange}
                </Text>
              </View>
            )}
            {job.commissionRange && (
              <View style={[s.tag, { backgroundColor: Palette.warm50 }]}>
                <Text style={[s.tagText, { color: Palette.warm600 }]}>
                  OTE {job.currency ? `${job.currency} ` : ''}{job.commissionRange}
                </Text>
              </View>
            )}
          </View>

          {/* Brief description */}
          <Text style={[s.jobDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {job.description}
          </Text>

          {/* Bottom row: posted date + View button */}
          <View style={s.jobBottom}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 }}>
              <Feather name="clock" size={11} color={colors.textMuted} />
              <Text style={[s.jobPosted, { color: colors.textMuted }]} numberOfLines={1}>
                {getRelativeTime(job.postedAt)}
              </Text>
            </View>
            <LinearGradient
              colors={[Palette.accent600, Palette.accent500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.viewBtnWrap}
            >
              <Pressable
                style={({ pressed }) => [s.viewBtn, { opacity: pressed ? 0.85 : 1 }]}
                onPress={() => {
                  router.push({
                    pathname: '/job-details',
                    params: { id: job.id },
                  } as any);
                }}
              >
                <Feather name="eye" size={13} color="#fff" />
                <Text style={s.viewBtnText}>View Details</Text>
              </Pressable>
            </LinearGradient>
          </View>
        </HapticPressable>
      </Animated.View>
    );
  };

  const { mode } = useLocalSearchParams<{ mode?: string }>();

  if (role === 'company') {
    if (mode === 'my-jobs') {
      return <CompanyMyJobs />;
    }
    return <CompanyPostJob />;
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ── JOB LIST — always render FlatList; cache ensures instant data on re-open ── */}
      <FlatList
          data={jobs}
          keyExtractor={j => j.id}
          renderItem={renderJob}
          contentContainerStyle={[s.list, { paddingBottom: TabBarHeight + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListFooterComponent={isFetchingLocal && jobs.length > 0 ? (
            <ActivityIndicator size="small" color={Palette.accent600} style={{ paddingVertical: 12 }} />
          ) : null}
          ListHeaderComponent={
            <View>
              {/* ── Hero Banner ── */}
              <Animated.View entering={FadeInDown.springify()} style={[s.heroBanner, { borderColor: colors.borderMid, marginTop: 16, marginBottom: 4 }]}>
                <LinearGradient
                  colors={['#FCEFCF', '#E1F6DD']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />

                <View style={s.heroContent}>
                  {/* Text side */}
                  <View style={{ flex: 1 }}>
                    <View style={[s.heroPill, { backgroundColor: 'rgba(255,255,255,0.7)', borderColor: colors.borderMid }]}>
                      <Feather name="search" size={11} color={Palette.accent600} />
                      <Text style={[s.heroPillText, { color: colors.textSecondary }]}>Explore Careers</Text>
                    </View>
                    <Text style={[s.heroTitle, { color: colors.text }]}>Find Your Next Role</Text>
                    <Text style={[s.heroSub, { color: colors.textSecondary }]}>
                      Discover verified sales opportunities with high-commission base salaries and uncapped OTE packages.
                    </Text>
                  </View>

                  {/* 3D Illustration WebP */}
                  <Image
                    source={require('@/assets/images/illustrations/browse_jobs_seeker.webp')}
                    style={s.heroImage}
                    contentFit="contain"
                  />
                </View>
              </Animated.View>

              {/* ── SEARCH + FILTER ──
                  One field and one button. The row used to be three chips —
                  All, Remote, Full-time — where "All" was really a dropdown of
                  four search modes, so choosing what to search by and choosing
                  how to filter were tangled into the same control. Searching is
                  now just typing, and the button beside it holds the filters. */}
              <View style={s.searchRow}>
                <View style={[s.searchBox, { backgroundColor: '#ffffff', borderColor: colors.borderMid }]}>
                  <Feather name="search" size={15} color={colors.textMuted} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search job ID, title or location"
                    placeholderTextColor={colors.textMuted}
                    style={[s.searchInput, { color: colors.text }]}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {search.length > 0 && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSearch('');
                      }}
                      hitSlop={10}
                      style={s.searchClearBtn}
                    >
                      <Feather name="x" size={14} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterOpen(prev => !prev);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    activeFilter === 'All' ? 'Filter roles' : `Filter roles, ${activeFilter} applied`
                  }
                  style={[
                    s.filterBtn,
                    activeFilter !== 'All'
                      ? { backgroundColor: Palette.accent600, borderColor: Palette.accent600 }
                      : { backgroundColor: '#ffffff', borderColor: colors.borderMid },
                  ]}
                >
                  <Feather
                    name="sliders"
                    size={16}
                    color={activeFilter !== 'All' ? '#ffffff' : colors.textSecondary}
                  />
                </Pressable>
              </View>

              {/* ── FILTER PANEL ── */}
              {filterOpen && (
                <Animated.View entering={FadeInDown.duration(150)} style={s.dropdownWrap}>
                  <View style={[s.dropdownCard, { backgroundColor: '#ffffff', borderColor: colors.borderMid }]}>
                    {FILTER_OPTIONS.map((option, idx) => {
                      const selected = activeFilter === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setActiveFilter(option.value);
                            setFilterOpen(false);
                          }}
                          style={({ pressed }) => [
                            s.dropdownItem,
                            {
                              borderBottomColor: colors.border,
                              borderBottomWidth: idx < FILTER_OPTIONS.length - 1 ? 1 : 0,
                              backgroundColor: pressed ? Palette.neutral100 : '#ffffff',
                            },
                          ]}
                        >
                          <View style={s.filterOptionLabel}>
                            <Feather
                              name={option.icon}
                              size={14}
                              color={selected ? Palette.accent600 : colors.textMuted}
                            />
                            <Text
                              style={[
                                s.dropdownItemText,
                                {
                                  color: selected ? Palette.accent600 : colors.text,
                                  fontWeight: selected ? '700' : '500',
                                },
                              ]}
                            >
                              {option.label}
                            </Text>
                          </View>
                          {selected && <Feather name="check" size={14} color={Palette.accent600} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              )}
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 16 }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonJobCard key={i} />
                ))}
              </View>
            ) : (
              <View style={[s.empty, { paddingTop: 40 }]}>
                <View style={[s.emptyIconWrap, { backgroundColor: Palette.neutral100 }]}>
                  <Feather name="search" size={28} color={colors.textMuted} />
                </View>
                <Text style={[s.emptyTitle, { color: colors.text }]}>No roles found</Text>
                <Text style={[s.emptySub, { color: colors.textMuted }]}>
                  Try adjusting your search or filters
                </Text>
                <Pressable
                  onPress={() => { setSearch(''); setActiveFilter('All'); setFilterOpen(false); }}
                  style={[s.clearBtn, { backgroundColor: Palette.accent600 }]}
                >
                  <Text style={s.clearBtnText}>Clear Filters</Text>
                </Pressable>
              </View>
            )
          }
        />
    </View>
  );
}

function getRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days <= 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // ── Hero Banner ──
  heroBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  blob1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160,
    borderRadius: 80,
  },
  blob2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 120, height: 120,
    borderRadius: 60,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  heroPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  heroImage: {
    width: 92,
    height: 92,
    flexShrink: 0,
  },

  // Contextual Search input (appears on selecting search filter)
  // Search field and filter button, side by side.
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    paddingVertical: 0,
  },
  searchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Inline Dropdown Menu
  dropdownWrap: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    zIndex: 99,
  },
  dropdownCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 13.5,
  },

  // Result count
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, marginBottom: 6,
  },
  resultText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },

  // Job list
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },

  // Job card — matches web card-soft design
  jobCard: {
    borderRadius: BorderRadius.card, borderWidth: 1, padding: 16,
  },
  jobTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  jobLogo: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    overflow: 'hidden', position: 'relative',
  },
  jobLogoImg: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
  },
  jobLogoText: { fontSize: 17, fontWeight: FontWeight.extrabold },
  jobTitle:    { fontSize: 14, fontWeight: FontWeight.bold, marginBottom: 2 },
  jobCompany:  { fontSize: 12 },
  saveBtn: { padding: 8, borderRadius: BorderRadius.sm },

  // Tags
  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag:      { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText:  { fontSize: 11, fontWeight: FontWeight.medium },

  // Description
  jobDesc: { fontSize: 12, lineHeight: 18, marginBottom: 12 },

  // Bottom row
  jobBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  jobPosted: { fontSize: 11 },
  viewBtnWrap: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  viewBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: 12 },

  // Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 8 },
  emptyIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: FontWeight.bold },
  emptySub:   { fontSize: 13, textAlign: 'center' },
  clearBtn:   { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.md },
  clearBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: 13 },
});
