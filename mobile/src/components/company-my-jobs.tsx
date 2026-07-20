import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { Colors, Palette, BorderRadius, FontSize, FontWeight, TabBarHeight } from '@/constants/theme';
import { useCompanyDashboardData, CompanyJob } from '@/hooks/useCompanyDashboardData';

const { width: SCREEN_W } = Dimensions.get('window');

const JOB_STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  approved: { label: 'Active', dot: Palette.emerald500, bg: '#d1fae5', text: '#065f46' },
  pending:  { label: 'Pending Review', dot: Palette.amber500, bg: '#fef3c7', text: '#92400e' },
  rejected: { label: 'Rejected', dot: Palette.red400, bg: '#fee2e2', text: '#991b1b' },
  closed:   { label: 'Closed', dot: Palette.neutral400, bg: Palette.neutral100, text: Palette.neutral600 },
};

export default function CompanyMyJobs() {
  const colors = Colors.light;
  const router = useRouter();
  
  const { jobs, refreshData, isLoading } = useCompanyDashboardData();

  const handleManage = useCallback((job: CompanyJob) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigates to Applicants tab passing the jobId parameter
    router.push({
      pathname: '/cv',
      params: { jobId: job.id },
    } as any);
  }, []);

  return (
    <View style={styles.root}>
      {/* Background Gradient */}
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshData}
            tintColor={Palette.accent500}
            colors={[Palette.accent500]}
          />
        }
      >
        {/* Hero Card */}
        <Animated.View entering={FadeInDown.springify()} style={[styles.heroCard, { borderColor: colors.borderMid }]}>
          <LinearGradient
            colors={['#FCEFCF', '#E1F6DD']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.heroContent}>
            <View style={{ flex: 1 }}>
              <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.6)', borderColor: colors.borderMid }]}>
                <Feather name="list" size={11} color={Palette.accent500} />
                <Text style={styles.badgeText}>Job Postings</Text>
              </View>
              <Text style={styles.heroTitle}>Manage Open Roles</Text>
              <Text style={styles.heroSub}>Track approval status, listing details, and manage applicants.</Text>
            </View>
            <Image
              source={require('../../assets/images/illustrations/my_jobs_manager.webp')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* Roles List */}
        {isLoading && jobs.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Palette.accent500} />
            <Text style={[styles.loaderText, { color: colors.textSecondary }]}>Loading open roles...</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={[styles.emptyContainer, { borderColor: colors.borderMid }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: Palette.neutral100 }]}>
              <Feather name="briefcase" size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No open roles yet</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Create your first job listing to find sales talent.</Text>
            <Pressable
              onPress={() => router.push('/explore' as any)}
              style={[styles.emptyBtn, { backgroundColor: Palette.accent500 }]}
            >
              <Text style={styles.emptyBtnText}>Create Job Post</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {jobs.map((job, index) => {
              const statusCfg = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.pending;
              return (
                <Animated.View
                  key={job.id}
                  entering={FadeInDown.delay(index * 60).springify()}
                  style={[styles.jobCard, { borderColor: colors.borderMid }]}
                >
                  {/* Left Initial bubble */}
                  <View style={styles.jobCardTop}>
                    <LinearGradient
                      colors={['#FCEFCF', '#E1F6DD']}
                      style={styles.initialBubble}
                    >
                      <Text style={styles.initialText}>{(job.title || 'J').charAt(0)}</Text>
                    </LinearGradient>
                    <View style={styles.jobInfo}>
                      <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>{job.title}</Text>
                      <View style={styles.metaRow}>
                        <Feather name="map-pin" size={11} color={colors.textMuted} />
                        <Text style={[styles.metaText, { color: colors.textMuted }]}>
                          {job.workType === 'Remote' ? 'Remote' : job.location || 'Hybrid'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Badges Row */}
                  <View style={styles.badgesRow}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                      <Text style={[styles.statusLabel, { color: statusCfg.text }]}>{statusCfg.label}</Text>
                    </View>

                    {/* Applicants count */}
                    <View style={styles.applicantsBadge}>
                      <Feather name="users" size={12} color={colors.textSecondary} />
                      <Text style={[styles.applicantsText, { color: colors.textSecondary }]}>
                        {job.applicantsCount || 0} applicant{job.applicantsCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Actions Divider */}
                  <View style={styles.divider} />

                  {/* Manage Button */}
                  <Pressable
                    onPress={() => handleManage(job)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: pressed ? 'rgba(0,0,0,0.03)' : 'transparent' }
                    ]}
                  >
                    <Text style={styles.actionBtnText}>Manage Candidates</Text>
                    <Feather name="arrow-right" size={14} color={Palette.accent600} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 16 },

  // Hero
  heroCard: { borderRadius: 16, overflow: 'hidden', padding: 20, marginBottom: 8 },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral700 },
  heroTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: 4 },
  heroSub: { fontSize: FontSize.xs, color: Palette.neutral600, lineHeight: 16 },

  // Loader
  loaderContainer: { paddingVertical: 64, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Empty state
  emptyContainer: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, padding: 32, alignItems: 'center', gap: 12 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  emptySub: { fontSize: FontSize.xs, textAlign: 'center', lineHeight: 16 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: '#ffffff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  // List
  listContainer: { gap: 14 },
  jobCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  jobCardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  initialBubble: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontSize: 18, fontWeight: FontWeight.extrabold, color: Palette.neutral800 },
  jobInfo: { flex: 1, gap: 4 },
  jobTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs },

  // Badges
  badgesRow: { flexDirection: 'row', gap: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: FontWeight.bold },
  applicantsBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: Palette.neutral50 },
  applicantsText: { fontSize: 10, fontWeight: FontWeight.bold },

  divider: { height: 1, backgroundColor: '#f1f5f9' },

  // Manage Button
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4, borderRadius: 8 },
  actionBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Palette.accent600 },
});
