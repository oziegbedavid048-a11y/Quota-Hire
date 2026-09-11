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

export type SearchFilterMode = 'none' | 'code' | 'title' | 'location';

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
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchMode, setSearchMode] = useState<SearchFilterMode>('none');
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
    fetchJobs(1, debouncedSearch, activeFilter, false, searchMode);
  }, [debouncedSearch, activeFilter, searchMode]);

  const fetchJobs = async (
    pageNum: number,
    searchVal: string,
    filterVal: string,
    isAppend: boolean,
    currentMode: SearchFilterMode = searchMode
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

      // Client-side targeted filtering when search mode is active
      if (cleanSearch) {
        const q = cleanSearch.toLowerCase();
        if (currentMode === 'code') {
          const matched = visibleJobs.filter((j: any) =>
            j.id.toLowerCase().includes(q) || `#${j.id}`.toLowerCase().includes(q)
          );
          if (matched.length > 0) visibleJobs = matched;
        } else if (currentMode === 'location') {
          const matched = visibleJobs.filter((j: any) =>
            (j.location || '').toLowerCase().includes(q)
          );
          if (matched.length > 0) visibleJobs = matched;
        } else if (currentMode === 'title') {
          const matched = visibleJobs.filter((j: any) =>
            (j.title || '').toLowerCase().includes(q)
          );
          if (matched.length > 0) visibleJobs = matched;
        }
      }

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

          {/* Tags: location / work type / salary / OTE / closed */}
          <View style={s.tagsRow}>
            {job.status === 'closed' && (
              <View style={[s.tag, { backgroundColor: '#fee2e2', borderColor: '#fecaca', borderWidth: 0.5 }]}>
                <Feather name="lock" size={10} color="#b91c1c" />
                <Text style={[s.tagText, { color: '#b91c1c', fontWeight: FontWeight.bold }]}>Closed</Text>
              </View>
            )}
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

              {/* ── FILTER CHIPS ── */}
              <View style={s.filterChipsRow}>
                {/* 1. All (Dropdown Toggle) */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDropdownOpen(prev => !prev);
                  }}
                  style={[
                    s.filterChip,
                    activeFilter === 'All'
                      ? { backgroundColor: Palette.accent600, borderColor: Palette.accent600 }
                      : { backgroundColor: '#ffffff', borderColor: colors.borderMid },
                  ]}
                >
                  <Text style={[
                    s.filterChipText,
                    { color: activeFilter === 'All' ? '#ffffff' : colors.textSecondary },
                  ]}>
                    {searchMode === 'code' ? 'Job Code' : searchMode === 'location' ? 'Location' : searchMode === 'title' ? 'Title' : 'All'}
                  </Text>
                  <Feather
                    name={dropdownOpen ? "chevron-up" : "chevron-down"}
                    size={13}
                    color={activeFilter === 'All' ? 'rgba(255,255,255,0.85)' : colors.textMuted}
                    style={{ marginLeft: 2 }}
                  />
                </Pressable>

                {/* 2. Remote */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter('Remote');
                    setSearchMode('none');
                    setSearch('');
                    setDropdownOpen(false);
                  }}
                  style={[
                    s.filterChip,
                    activeFilter === 'Remote'
                      ? { backgroundColor: Palette.accent600, borderColor: Palette.accent600 }
                      : { backgroundColor: '#ffffff', borderColor: colors.borderMid },
                  ]}
                >
                  <Feather
                    name="globe"
                    size={12}
                    color={activeFilter === 'Remote' ? '#fff' : colors.textMuted}
                  />
                  <Text style={[
                    s.filterChipText,
                    { color: activeFilter === 'Remote' ? '#ffffff' : colors.textSecondary },
                  ]}>
                    Remote
                  </Text>
                </Pressable>

                {/* 3. Full-time */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter('Full-time');
                    setSearchMode('none');
                    setSearch('');
                    setDropdownOpen(false);
                  }}
                  style={[
                    s.filterChip,
                    activeFilter === 'Full-time'
                      ? { backgroundColor: Palette.accent600, borderColor: Palette.accent600 }
                      : { backgroundColor: '#ffffff', borderColor: colors.borderMid },
                  ]}
                >
                  <Feather
                    name="clock"
                    size={12}
                    color={activeFilter === 'Full-time' ? '#fff' : colors.textMuted}
                  />
                  <Text style={[
                    s.filterChipText,
                    { color: activeFilter === 'Full-time' ? '#ffffff' : colors.textSecondary },
                  ]}>
                    Full-time
                  </Text>
                </Pressable>
              </View>

              {/* ── INLINE DROPDOWN MENU (Clean & Professional, No Modal) ── */}
              {dropdownOpen && (
                <Animated.View entering={FadeInDown.duration(150)} style={s.dropdownWrap}>
                  <View style={[s.dropdownCard, { backgroundColor: '#ffffff', borderColor: colors.borderMid }]}>
                    {/* Item 1: All Roles */}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSearchMode('none');
                        setSearch('');
                        setActiveFilter('All');
                        setDropdownOpen(false);
                      }}
                      style={({ pressed }) => [
                        s.dropdownItem,
                        { borderBottomColor: colors.border, backgroundColor: pressed ? Palette.neutral100 : '#ffffff' }
                      ]}
                    >
                      <Text style={[
                        s.dropdownItemText,
                        {
                          color: activeFilter === 'All' && searchMode === 'none' ? Palette.accent600 : colors.text,
                          fontWeight: activeFilter === 'All' && searchMode === 'none' ? '700' : '500',
                        }
                      ]}>
                        All Roles
                      </Text>
                      {activeFilter === 'All' && searchMode === 'none' && (
                        <Feather name="check" size={14} color={Palette.accent600} />
                      )}
                    </Pressable>

                    {/* Item 2: Search by Job Code */}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSearchMode('code');
                        setActiveFilter('All');
                        setDropdownOpen(false);
                      }}
                      style={({ pressed }) => [
                        s.dropdownItem,
                        { borderBottomColor: colors.border, backgroundColor: pressed ? Palette.neutral100 : '#ffffff' }
                      ]}
                    >
                      <Text style={[
                        s.dropdownItemText,
                        {
                          color: searchMode === 'code' ? Palette.accent600 : colors.text,
                          fontWeight: searchMode === 'code' ? '700' : '500',
                        }
                      ]}>
                        Search by Job Code
                      </Text>
                      {searchMode === 'code' && (
                        <Feather name="check" size={14} color={Palette.accent600} />
                      )}
                    </Pressable>

                    {/* Item 3: Search by Title */}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSearchMode('title');
                        setActiveFilter('All');
                        setDropdownOpen(false);
                      }}
                      style={({ pressed }) => [
                        s.dropdownItem,
                        { borderBottomColor: colors.border, backgroundColor: pressed ? Palette.neutral100 : '#ffffff' }
                      ]}
                    >
                      <Text style={[
                        s.dropdownItemText,
                        {
                          color: searchMode === 'title' ? Palette.accent600 : colors.text,
                          fontWeight: searchMode === 'title' ? '700' : '500',
                        }
                      ]}>
                        Search by Title
                      </Text>
                      {searchMode === 'title' && (
                        <Feather name="check" size={14} color={Palette.accent600} />
                      )}
                    </Pressable>

                    {/* Item 4: Search by Location */}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSearchMode('location');
                        setActiveFilter('All');
                        setDropdownOpen(false);
                      }}
                      style={({ pressed }) => [
                        s.dropdownItem,
                        { borderBottomWidth: 0, backgroundColor: pressed ? Palette.neutral100 : '#ffffff' }
                      ]}
                    >
                      <Text style={[
                        s.dropdownItemText,
                        {
                          color: searchMode === 'location' ? Palette.accent600 : colors.text,
                          fontWeight: searchMode === 'location' ? '700' : '500',
                        }
                      ]}>
                        Search by Location
                      </Text>
                      {searchMode === 'location' && (
                        <Feather name="check" size={14} color={Palette.accent600} />
                      )}
                    </Pressable>
                  </View>
                </Animated.View>
              )}

              {/* ── CONTEXTUAL SEARCH INPUT (appears on selecting search filter) ── */}
              {searchMode !== 'none' && (
                <Animated.View entering={FadeInDown.duration(200)} style={s.contextualSearchWrap}>
                  <View style={[s.contextualSearchBox, { backgroundColor: '#ffffff', borderColor: Palette.accent300 }]}>
                    <View style={[s.searchModeBadge, { backgroundColor: Palette.accent50 }]}>
                      <Feather
                        name={searchMode === 'code' ? 'hash' : searchMode === 'location' ? 'map-pin' : 'briefcase'}
                        size={12}
                        color={Palette.accent600}
                      />
                      <Text style={[s.searchModeBadgeText, { color: Palette.accent700 }]}>
                        {searchMode === 'code' ? 'Job Code' : searchMode === 'location' ? 'Location' : 'Title'}
                      </Text>
                    </View>

                    <TextInput
                      value={search}
                      onChangeText={setSearch}
                      placeholder={
                        searchMode === 'code'
                          ? 'Enter job code (e.g. 104)...'
                          : searchMode === 'location'
                          ? 'Enter city or country...'
                          : 'Enter job title (e.g. Sales Lead)...'
                      }
                      placeholderTextColor={colors.textMuted}
                      style={[s.contextualSearchInput, { color: colors.text }]}
                      autoFocus
                      returnKeyType="search"
                    />

                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (search.length > 0) {
                          setSearch('');
                        } else {
                          setSearchMode('none');
                        }
                      }}
                      style={s.contextualSearchCloseBtn}
                      hitSlop={10}
                    >
                      <Feather name="x" size={15} color={colors.textMuted} />
                    </Pressable>
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
                  onPress={() => { setSearch(''); setActiveFilter('All'); setSearchMode('none'); }}
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
  contextualSearchWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  contextualSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    minHeight: 46,
    paddingHorizontal: 8,
    gap: 8,
    shadowColor: Palette.accent600,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  searchModeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  contextualSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },
  contextualSearchCloseBtn: {
    width: 28,
    minHeight: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter chips bar (inline pills)
  filterChipsRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 99, borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12, fontWeight: '700',
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
