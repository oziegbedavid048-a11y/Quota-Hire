import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, FlatList, Dimensions, Modal, ActivityIndicator, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';


import CompanyPostJob from '@/components/company-post-job';
import { SkeletonJobCard } from '@/components/ui/skeleton';
import {
  Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight, TabBarHeight,
} from '@/constants/theme';
import { useEmployeeDashboardData, Job } from '@/hooks/useEmployeeDashboardData';
import { apiFetch } from '@/services/api';

const { width: SCREEN_W } = Dimensions.get('window');

const FILTERS = [
  { label: 'All',       value: 'All'       },
  { label: 'Remote',    value: 'Remote'    },
  { label: 'Full-time', value: 'Full-time' },
];

export default function JobsScreen() {
  const colors = Colors.light;
  const router = useRouter();
  
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync('user_role').then(r => setRole(r || 'employee'));
  }, []);

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
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Debounce search input to avoid redundant requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page and fetch new list when filters change
  useEffect(() => {
    setPage(1);
    fetchJobs(1, debouncedSearch, activeFilter, false);
  }, [debouncedSearch, activeFilter]);

  const fetchJobs = async (pageNum: number, searchVal: string, filterVal: string, isAppend: boolean) => {
    if (pageNum === 1 && !isRefreshing) {
      setIsLoading(true);
    }
    setIsFetchingLocal(true);
    try {
      let url = `/jobs/?page=${pageNum}`;
      if (searchVal) {
        url += `&search=${encodeURIComponent(searchVal)}`;
      }
      if (filterVal === 'Remote') {
        url += `&remote=true`;
      } else if (filterVal === 'Full-time') {
        url += `&employment_type=Full-time`;
      }

      const res = await apiFetch(url);
      const results = Array.isArray(res) ? res : (res?.results || []);
      const nextUrl = res?.next;

      const formattedJobs = results.map((j: any) => ({
        id: j.id.toString(),
        title: j.title,
        companyName: j.company_name,
        companyLogoUrl: j.company_logo_url,
        companyIsVerified: true,
        location: j.location,
        workType: j.is_remote ? "Remote" : ("Hybrid" as const),
        salaryRange: j.salary_range,
        commissionRange: j.commission_range,
        description: j.description,
        requirements: j.requirements || [],
        status: j.status || "approved",
        postedAt: j.created_at || new Date().toISOString(),
      }));

      // Only show approved jobs
      const approvedOnly = formattedJobs.filter((j: any) => j.status === 'approved');

      setJobs(prev => isAppend ? [...prev, ...approvedOnly] : approvedOnly);
      setHasMore(!!nextUrl);
    } catch (e) {
      console.warn("Failed to fetch jobs in explore:", e);
    } finally {
      setIsLoading(false);
      setIsFetchingLocal(false);
    }
  };

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
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push({
              pathname: '/job-details',
              params: { id: job.id },
            } as any);
          }}
          style={({ pressed }) => [
            s.jobCard,
            { backgroundColor: '#ffffff', borderColor: colors.borderMid, opacity: pressed ? 0.95 : 1 },
          ]}
        >
          {/* Top row: logo + title + save heart */}
          <View style={s.jobTop}>
            <LinearGradient
              colors={[Palette.neutral100, '#f8fafc']}
              style={[s.jobLogo, { borderColor: colors.border }]}
            >
              <Text style={[s.jobLogoText, { color: colors.text }]}>
                {(job.companyName || 'C').charAt(0)}
              </Text>
            </LinearGradient>

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
              <Feather name="heart" size={16} color={saved ? Palette.warm500 : colors.textMuted} />
            </Pressable>
          </View>

          {/* Tags: location / work type / salary / OTE */}
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
                <Text style={[s.tagText, { color: Palette.emerald600 }]}>{job.salaryRange}</Text>
              </View>
            )}
            {job.commissionRange && (
              <View style={[s.tag, { backgroundColor: Palette.warm50 }]}>
                <Text style={[s.tagText, { color: Palette.warm600 }]}>OTE {job.commissionRange}</Text>
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
        </Pressable>
      </Animated.View>
    );
  };

  if (role === 'company') {
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

      {/* Filter Selector Modal — lives outside FlatList so it overlays properly */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={s.modalBackdrop} onPress={() => setFilterModalVisible(false)}>
          <View style={[s.modalContent, { backgroundColor: colors.cardBg }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Filter by Job Type</Text>
              <Pressable onPress={() => setFilterModalVisible(false)} hitSlop={12}>
                <Feather name="x" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={s.modalDivider} />
            {FILTERS.map((f) => {
              const selected = activeFilter === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => {
                    setActiveFilter(f.value);
                    setFilterModalVisible(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                  style={({ pressed }) => [
                    s.modalOption,
                    {
                      backgroundColor: selected ? Palette.accent50 : pressed ? 'rgba(0,0,0,0.02)' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.modalOptionText,
                      {
                        color: selected ? Palette.accent600 : colors.text,
                        fontWeight: selected ? '700' : '500',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                  {selected && <Feather name="check" size={16} color={Palette.accent600} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* ── JOB LIST — search + filter scroll with jobs via ListHeaderComponent ── */}
      {isLoading && jobs.length === 0 ? (
        /* ── Skeleton loading — 4 placeholder job cards ── */
        <View style={[s.list, { paddingBottom: TabBarHeight + 24, paddingTop: 4 }]}>
          {/* Hero banner skeleton placeholder area is the real banner above */}
          {[1,2,3,4].map(k => <SkeletonJobCard key={k} style={{ marginBottom: 12 }} />)}
        </View>
      ) : (
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
                {/* Decorative blobs */}
                <View style={[s.blob1, { backgroundColor: 'rgba(21,117,10,0.06)' }]} />
                <View style={[s.blob2, { backgroundColor: 'rgba(114,221,21,0.05)' }]} />

                <View style={s.heroContent}>
                  {/* Text side */}
                  <View style={{ flex: 1 }}>
                    <View style={[s.heroPill, { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.borderMid }]}>
                      <Feather name="search" size={12} color={Palette.accent600} />
                      <Text style={[s.heroPillText, { color: colors.textSecondary }]}>Explore Careers</Text>
                    </View>
                    <Text style={[s.heroTitle, { color: colors.text }]}>Discover Your{'\n'}Next Sales Role</Text>
                    <Text style={[s.heroSub, { color: colors.textSecondary }]}>
                      Find verified, high-commission opportunities with premium base salaries and OTE packages.
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

              {/* ── SEARCH BAR ── */}
              <View style={[s.searchRowOutside, { paddingTop: 8 }]}>
                <View style={[s.searchWrap, { backgroundColor: '#ffffff', borderColor: colors.borderMid }]}>
                  <Feather name="search" size={15} color={colors.textMuted} style={{ marginLeft: 12 }} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search job title, company or location..."
                    placeholderTextColor={colors.textMuted}
                    style={[s.searchInput, { color: colors.text }]}
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch('')} style={{ marginRight: 8 }}>
                      <Feather name="x" size={15} color={colors.textMuted} />
                    </Pressable>
                  )}
                  <Pressable
                    style={[s.searchBtn, { backgroundColor: Palette.accent600 }]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  >
                    <Feather name="search" size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>

              {/* ── FILTER CHIPS ── */}
              <View style={s.filterChipsRow}>
                {FILTERS.map((f) => {
                  const isActive = activeFilter === f.value;
                  return (
                    <Pressable
                      key={f.value}
                      onPress={() => {
                        setActiveFilter(f.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        s.filterChip,
                        isActive
                          ? { backgroundColor: Palette.accent600, borderColor: Palette.accent600 }
                          : { backgroundColor: '#ffffff', borderColor: colors.borderMid },
                      ]}
                    >
                      {f.value === 'Remote' && (
                        <Feather name="wifi" size={11} color={isActive ? '#fff' : colors.textMuted} />
                      )}
                      {f.value === 'Full-time' && (
                        <Feather name="briefcase" size={11} color={isActive ? '#fff' : colors.textMuted} />
                      )}
                      {f.value === 'All' && (
                        <Feather name="layers" size={11} color={isActive ? '#fff' : colors.textMuted} />
                      )}
                      <Text style={[
                        s.filterChipText,
                        { color: isActive ? '#ffffff' : colors.textSecondary },
                      ]}>
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={[s.empty, { paddingTop: 40 }]}>
              <View style={[s.emptyIconWrap, { backgroundColor: Palette.neutral100 }]}>
                <Feather name="search" size={28} color={colors.textMuted} />
              </View>
              <Text style={[s.emptyTitle, { color: colors.text }]}>No roles found</Text>
              <Text style={[s.emptySub, { color: colors.textMuted }]}>
                Try adjusting your search or filters
              </Text>
              <Pressable
                onPress={() => { setSearch(''); setActiveFilter('All'); }}
                style={[s.clearBtn, { backgroundColor: Palette.accent600 }]}
              >
                <Text style={s.clearBtnText}>Clear Filters</Text>
              </Pressable>
            </View>
          }
        />
      )}
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
    fontSize: 24, fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12, lineHeight: 17, marginBottom: 10,
  },
  heroImage: {
    width: 110, height: 110,
    flexShrink: 0,
  },

  // Search bar outside banner
  searchRowOutside: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, height: 46, overflow: 'hidden',
  },
  searchInput: {
    flex: 1, paddingHorizontal: 12, fontSize: 13, fontWeight: '500',
  },
  searchBtn: {
    height: '100%', width: 44, alignItems: 'center', justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 12, fontWeight: FontWeight.bold },

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

  // Modal styles for dropdown
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.card, borderTopRightRadius: BorderRadius.card,
    paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 16, fontWeight: '800',
  },
  modalDivider: {
    height: 1, backgroundColor: Palette.neutral100, marginVertical: 12,
  },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: BorderRadius.md,
  },
  modalOptionText: {
    fontSize: 14,
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
