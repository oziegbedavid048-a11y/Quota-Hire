import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

import CompanyMyJobs from '@/components/company-my-jobs';
import { SkeletonApplicationCard } from '@/components/ui/skeleton';
import {
  Colors, Palette, Shadow, BorderRadius, TabBarHeight,
} from '@/constants/theme';
import { useEmployeeDashboardData, Application } from '@/hooks/useEmployeeDashboardData';

// Exactly matches web ApplicationTracker statusConfig
const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pending:      { label: 'Applied',          dot: Palette.neutral400, bg: Palette.neutral100, text: Palette.neutral600 },
  under_review: { label: 'Under Review',     dot: Palette.amber500,   bg: Palette.amber50,    text: Palette.amber700 },
  interview:    { label: 'Interview',        dot: Palette.purple500,  bg: Palette.purple50,   text: Palette.purple700 },
  decision:     { label: 'Decision Pending', dot: Palette.blue500,    bg: Palette.blue50,     text: Palette.blue600 },
  accepted:     { label: 'Offer Received',   dot: Palette.emerald500, bg: Palette.emerald50,  text: Palette.emerald600 },
  rejected:     { label: 'Not Selected',     dot: Palette.red400,     bg: Palette.red50,      text: Palette.red600 },
};

const ALL_STATUSES = ['all', 'pending', 'under_review', 'interview', 'decision', 'accepted', 'rejected'] as const;

export default function TrackerScreen() {
  const scheme = useColorScheme();
  const isDark = false;
  const c = Colors[isDark ? 'dark' : 'light'];
  
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync('user_role').then(r => setRole(r || 'employee'));
  }, []);

  const { applications, jobs, isLoading } = useEmployeeDashboardData();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<typeof ALL_STATUSES[number]>('all');


  const filtered = applications.filter(app => {
    const matchSearch =
      app.job_title.toLowerCase().includes(search.toLowerCase()) ||
      app.company_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalByStatus = ALL_STATUSES.reduce((acc, s) => {
    if (s !== 'all') acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (role === 'company') {
    return <CompanyMyJobs />;
  }

  return (
    <View style={s.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: TabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BANNER ── */}
        <View style={[s.hero, { borderColor: c.border }]}>
          <LinearGradient
            colors={['rgba(21,117,10,0.08)', '#ffffff', 'rgba(245,158,11,0.08)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          <View style={s.heroInner}>
            <View style={{ alignItems: 'center', marginBottom: 16, width: '100%' }}>
              <Image
                source={require('@/assets/images/tracker_illustration.png')}
                style={{ width: 140, height: 140 }}
                resizeMode="contain"
              />
            </View>

            <View style={{ flex: 1, zIndex: 1 }}>
              <Text style={[s.heroTitle, { color: c.text }]}>
                Application{' '}
                <Text style={{ color: Palette.accent600 }}>Tracker</Text>
              </Text>
              <Text style={[s.heroSub, { color: c.textSecondary }]}>
                Track every step of your job search — from applied to offer.
              </Text>

              {/* Stats mini-grid (matches web exactly: Total, Reviewing, Interviews, Offers) */}
              <View style={s.heroStats}>
                {[
                  { label: 'Total',      count: applications.length,                   bg: 'rgba(255,255,255,0.6)', border: c.border },
                  { label: 'Reviewing',  count: totalByStatus['under_review'] || 0,    bg: Palette.amber50,         border: '#fef3c7' },
                  { label: 'Interviews', count: totalByStatus['interview'] || 0,       bg: Palette.purple50,        border: '#f3e8ff' },
                  { label: 'Offers',     count: totalByStatus['accepted'] || 0,        bg: Palette.emerald50,       border: '#d1fae5' },
                ].map(stat => (
                  <View key={stat.label} style={[s.heroStat, { backgroundColor: stat.bg, borderColor: stat.border, borderWidth: 1 }]}>
                    <Text style={[s.heroStatNum, { color: c.text }]}>{stat.count}</Text>
                    <Text style={[s.heroStatLabel, { color: c.textMuted }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── Filters ── */}
        <View style={s.filtersRow}>
          {/* Search input */}
          <View style={[s.searchWrap, { backgroundColor: '#ffffff', borderColor: c.borderMid }]}>
            <Feather name="search" size={14} color={c.textMuted} style={{ marginLeft: 12 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search job or company..."
              placeholderTextColor={c.textMuted}
              style={[s.searchInput, { color: c.text }]}
            />
          </View>
        </View>

        {/* Status filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterPills}>
          {ALL_STATUSES.map(st => {
            const isAll = st === 'all';
            const cfg = isAll ? null : STATUS_CONFIG[st];
            const active = filterStatus === st;
            return (
              <Pressable
                key={st}
                onPress={() => {
                  setFilterStatus(st);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[s.filterPill, {
                  backgroundColor: active ? (isAll ? Palette.neutral900 : cfg!.bg) : c.cardBg,
                  borderColor: active ? (isAll ? Palette.neutral900 : cfg!.dot) : c.borderMid,
                }]}
              >
                {!isAll && cfg && <View style={[s.pillDot, { backgroundColor: active ? cfg.dot : c.textMuted }]} />}
                <Text style={[s.pillText, {
                  color: active
                    ? (isAll ? '#fff' : cfg!.text)
                    : c.textSecondary,
                }]}>
                  {isAll ? 'All' : cfg!.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Application list (matches web card-soft exactly) ── */}
        <View style={[s.listCard, { backgroundColor: '#ffffff', borderColor: c.border }]}>
          {isLoading ? (
            // Skeleton loading — matches shape of real application cards
            <View style={{ gap: 12, padding: 4 }}>
              {[1, 2, 3].map(k => <SkeletonApplicationCard key={k} />)}
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.empty}>
              <View style={[s.emptyIconWrap, { backgroundColor: isDark ? Palette.neutral800 : Palette.neutral100 }]}>
                <Feather name="inbox" size={24} color={c.textMuted} />
              </View>
              <Text style={[s.emptyTitle, { color: c.text }]}>No Applications Found</Text>
              <Text style={[s.emptySub, { color: c.textMuted }]}>
                {applications.length === 0
                  ? "You haven't applied to any jobs yet."
                  : "No applications match your current filter."}
              </Text>
            </View>
          ) : (
            filtered.map((app, i) => {
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG['pending'];
              const job = jobs.find(j => j.id === app.job);
              return (
                <View
                  key={app.id}
                  style={[
                    s.appRow,
                    { borderBottomColor: c.border },
                    i < filtered.length - 1 && { borderBottomWidth: 1 },
                  ]}
                >
                  {/* Position + Company */}
                  <View style={{ flex: 1 }}>
                    <Text style={[s.appTitle, { color: c.text }]} numberOfLines={1}>{app.job_title}</Text>
                    <View style={s.appMeta}>
                      <View style={s.appMetaItem}>
                        <Feather name="briefcase" size={10} color={c.textMuted} />
                        <Text style={[s.appMetaText, { color: c.textMuted }]}>{app.company_name}</Text>
                      </View>
                      {job && (
                        <View style={s.appMetaItem}>
                          <Feather name="map-pin" size={10} color={c.textMuted} />
                          <Text style={[s.appMetaText, { color: c.textMuted }]}>
                            {job.workType === 'Remote' ? 'Remote' : job.location}
                          </Text>
                        </View>
                      )}
                      <View style={s.appMetaItem}>
                        <Feather name="calendar" size={10} color={c.textMuted} />
                        <Text style={[s.appMetaText, { color: c.textMuted }]}>
                          {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Status chip */}
                  <View style={[s.statusChip, { backgroundColor: cfg.bg }]}>
                    <View style={[s.statusDot, { backgroundColor: cfg.dot }]} />
                    <Text style={[s.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Footer count */}
        {filtered.length > 0 && (
          <Text style={[s.footerCount, { color: c.textMuted }]}>
            Showing {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, gap: 16 },

  // Hero
  hero:   { borderRadius: BorderRadius.cardLg, borderWidth: 1, overflow: 'hidden', padding: 20 },
  heroInner: { flexDirection: 'column', alignItems: 'center', zIndex: 1 },
  heroTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' },
  heroSub:   { fontSize: 13, lineHeight: 19, marginBottom: 16, textAlign: 'center' },
  heroStats: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroStat:  { borderRadius: BorderRadius.md, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 64 },
  heroStatNum:   { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  heroStatLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },

  // Filters
  filtersRow:  { gap: 10 },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, height: 44 },
  searchInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '500' },
  filterPills: { paddingVertical: 4, gap: 8, flexDirection: 'row' },
  filterPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  pillDot:     { width: 6, height: 6, borderRadius: 3 },
  pillText:    { fontSize: 12, fontWeight: '600' },

  // List card
  listCard: { borderRadius: BorderRadius.card, borderWidth: 1, overflow: 'hidden' },
  appRow:   { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  appTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  appMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  appMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  appMetaText: { fontSize: 11 },

  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Empty
  empty:        { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 8 },
  emptyIconWrap:{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontSize: 16, fontWeight: '700' },
  emptySub:     { fontSize: 13, textAlign: 'center' },

  footerCount: { fontSize: 11, textAlign: 'center' },
});
