import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { Colors, Palette, BorderRadius, FontSize, FontWeight, TabBarHeight } from '@/constants/theme';
import { useCompanyDashboardData, CompanyJob } from '@/hooks/useCompanyDashboardData';
import { SkeletonJobCard } from '@/components/ui/skeleton';

const { width: SCREEN_W } = Dimensions.get('window');

const JOB_STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  approved: { label: 'Active', dot: Palette.emerald500, bg: '#d1fae5', text: '#065f46' },
  pending:  { label: 'Pending Review', dot: Palette.amber500, bg: '#fef3c7', text: '#92400e' },
  rejected: { label: 'Rejected', dot: Palette.red400, bg: '#fee2e2', text: '#991b1b' },
  closed:   { label: 'Closed', dot: Palette.neutral400, bg: Palette.neutral100, text: Palette.neutral600 },
};

interface CompanyMyJobsProps {
  onSelectJob?: (job: CompanyJob) => void;
}

export default function CompanyMyJobs({ onSelectJob }: CompanyMyJobsProps = {}) {
  const colors = Colors.light;
  const router = useRouter();
  
  const { jobs, company, refreshData, isLoading } = useCompanyDashboardData();

  const handleManage = useCallback((job: CompanyJob) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onSelectJob) {
      onSelectJob(job);
    }
    // Navigates to Job Applicants view passing the jobId parameter
    router.push({
      pathname: '/tracker',
      params: { jobId: job.id, view: 'applicants' },
    } as any);
  }, [onSelectJob, router]);

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
          <View style={{ gap: 12, paddingHorizontal: 16 }}>
            {[1, 2, 3].map(k => (
              <SkeletonJobCard key={k} />
            ))}
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
              const logoUri = job.companyLogoUrl || company?.logoUrl || company?.avatarUrl;
              const isPromoted = job.package === 'promoted';

              return (
                <Animated.View
                  key={job.id}
                  entering={FadeInDown.delay(index * 60).springify()}
                  style={[styles.jobCard, { borderColor: colors.borderMid }]}
                >
                  <Pressable
                    onPress={() => handleManage(job)}
                    style={({ pressed }) => [
                      styles.jobCardInner,
                      { opacity: pressed ? 0.94 : 1 }
                    ]}
                  >
                    {/* Top Row: Company Logo + Title + Location */}
                    <View style={styles.jobCardHeader}>
                      {logoUri ? (
                        <View style={[styles.logoWrap, { borderColor: colors.borderMid }]}>
                          <Image source={{ uri: logoUri }} style={styles.logoImg} contentFit="contain" />
                        </View>
                      ) : (
                        <LinearGradient
                          colors={['#FCEFCF', '#E1F6DD']}
                          style={styles.initialWrap}
                        >
                          <Text style={styles.initialText}>
                            {(company?.companyName || job.companyName || job.title || 'Q').charAt(0).toUpperCase()}
                          </Text>
                        </LinearGradient>
                      )}

                      <View style={styles.jobInfo}>
                        <Text style={[styles.jobTitle, { color: colors.text }]} numberOfLines={1}>
                          {job.title}
                        </Text>
                        <View style={styles.metaRow}>
                          <Feather name="map-pin" size={11} color={colors.textMuted} />
                          <Text style={[styles.metaText, { color: colors.textMuted }]}>
                            {job.workType === 'Remote' ? 'Remote' : job.location || 'Hybrid'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Middle Row: Badges (Pipeline text-only without emoji/icon, Status, Candidates) */}
                    <View style={styles.indicatorsRow}>
                      {/* Pipeline Indicator (Text only, NO emoji, NO icon) */}
                      <View style={[
                        styles.pipelineBadge,
                        isPromoted ? styles.pipelineBadgePromoted : styles.pipelineBadgeAgency
                      ]}>
                        <Text style={[
                          styles.pipelineText,
                          isPromoted ? styles.pipelineTextPromoted : styles.pipelineTextAgency
                        ]}>
                          {isPromoted ? 'Promoted Pipeline' : 'Agency Pipeline'}
                        </Text>
                      </View>

                      {/* Status Badge */}
                      <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                        <Text style={[styles.statusLabel, { color: statusCfg.text }]}>
                          {statusCfg.label}
                        </Text>
                      </View>

                      {/* Candidates Count */}
                      <View style={styles.candidatesBadge}>
                        <Feather name="users" size={11} color={colors.textSecondary} />
                        <Text style={[styles.candidatesText, { color: colors.textSecondary }]}>
                          {job.applicantsCount || 0} candidate{job.applicantsCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                      <Text style={styles.actionBtnText}>Manage Candidates</Text>
                      <Feather name="arrow-right" size={14} color={Palette.accent600} />
                    </View>
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
  listContainer: { gap: 12 },
  jobCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  jobCardInner: { padding: 16, gap: 12 },
  jobCardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  logoWrap: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, backgroundColor: '#ffffff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 3 },
  logoImg: { width: '100%', height: '100%' },
  initialWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontSize: 18, fontWeight: FontWeight.extrabold, color: Palette.neutral800 },
  jobInfo: { flex: 1, gap: 3 },
  jobTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs },

  // Indicators Row
  indicatorsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },

  // Pipeline Badge (strictly text only, no emoji, no icon)
  pipelineBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  pipelineBadgePromoted: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  pipelineBadgeAgency: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  pipelineText: { fontSize: 10, fontWeight: FontWeight.extrabold, letterSpacing: 0.2 },
  pipelineTextPromoted: { color: '#047857' },
  pipelineTextAgency: { color: '#475569' },

  // Status Badge
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 10, fontWeight: FontWeight.bold },

  // Candidates Count Badge
  candidatesBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: Palette.neutral50 },
  candidatesText: { fontSize: 10, fontWeight: FontWeight.bold },

  cardDivider: { height: 1, backgroundColor: '#f1f5f9' },

  // Action Row
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  actionBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, color: Palette.accent600 },
});
