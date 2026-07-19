import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import {
  Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight, TabBarHeight,
} from '@/constants/theme';
import { useEmployeeDashboardData } from '@/hooks/useEmployeeDashboardData';
import ApplyJobModal from '@/components/apply-job-modal';

const { width: SCREEN_W } = Dimensions.get('window');

export default function JobDetailsScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    user, jobs, savedJobs, toggleSavedJob, applications,
    profileScore, refreshData, isLoading,
  } = useEmployeeDashboardData();

  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Find job
  const job = jobs.find(j => String(j.id) === String(id));

  // Determine if already applied
  const hasApplied = applications.some(a => String(a.job) === String(job?.id));
  const isSaved = savedJobs.includes(job?.id || '');

  const handleSave = async () => {
    if (!job) return;
    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await toggleSavedJob(job.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (profileScore < 100) {
      Alert.alert(
        'Incomplete Profile',
        `Your profile is missing details (${profileScore}% complete). Please complete your profile and resume details before applying to jobs to ensure accurate employer matching.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete Profile Now', onPress: () => router.push('/profile' as any) }
        ]
      );
      return;
    }
    setModalVisible(true);
  };

  if (!job) {
    return (
      <SafeAreaView style={[s.errorContainer, { backgroundColor: '#FFFBEB' }]}>
        <Feather name="alert-circle" size={48} color={Palette.red500} />
        <Text style={[s.errorTitle, { color: colors.text }]}>Job Not Found</Text>
        <Text style={[s.errorSub, { color: colors.textMuted }]}>
          This position may have been closed or removed.
        </Text>
        <Pressable
          onPress={() => router.replace('/explore' as any)}
          style={[s.backBtn, { backgroundColor: Palette.accent600 }]}
        >
          <Text style={s.backBtnText}>Back to Roles</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: '#FFFBEB' }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'transparent' }} />

      {/* ── TOP NAV BAR ── */}
      <View style={[s.header, { backgroundColor: 'transparent', borderBottomWidth: 0, height: 36 }]}>
        <Pressable
          style={({ pressed }) => [s.headerBackBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Feather name="arrow-left" size={16} color={Palette.accent600} />
          <Text style={[s.headerBackText, { color: Palette.accent600 }]}>Back to Roles</Text>
        </Pressable>
      </View>

      {/* ── SCROLLABLE BODY ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO CARD ── */}
        <View style={[s.heroCard, Shadow.card]}>
          <LinearGradient
            colors={['#fffbeb', '#f0fdf4']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          <View style={s.heroTop}>
            {job.companyLogoUrl ? (
              <Image source={job.companyLogoUrl} style={s.companyLogo} contentFit="cover" />
            ) : (
              <View style={[s.companyLogoPlaceholder, { backgroundColor: Palette.neutral100 }]}>
                <Text style={[s.logoText, { color: colors.textSecondary }]}>
                  {job.companyName?.charAt(0) || 'C'}
                </Text>
              </View>
            )}

            <View style={{ flex: 1, marginLeft: 16 }}>
              <View style={s.companyNameRow}>
                <Text style={[s.companyName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {job.companyName}
                </Text>
                {job.companyIsVerified && (
                  <Feather name="check-circle" size={14} color={Palette.blue500} />
                )}
              </View>
              <Text style={[s.jobTitle, { color: colors.text }]}>{job.title}</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={s.tagsRow}>
            <View style={[s.tag, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
              <Feather name="map-pin" size={11} color={colors.textMuted} />
              <Text style={[s.tagText, { color: colors.textSecondary }]}>{job.location}</Text>
            </View>
            <View style={[s.tag, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
              <Feather name="briefcase" size={11} color={colors.textMuted} />
              <Text style={[s.tagText, { color: colors.textSecondary }]}>{job.workType}</Text>
            </View>
          </View>
        </View>

        {/* ── ABOUT THE ROLE ── */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>About the Role</Text>
          <Text style={[s.descText, { color: colors.textSecondary }]}>
            {job.description}
          </Text>
        </View>

        {/* ── REQUIREMENTS ── */}
        {job.requirements && job.requirements.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Key Requirements</Text>
            <View style={{ gap: 10, marginTop: 4 }}>
              {job.requirements.map((req, idx) => (
                <View key={idx} style={[s.reqRow, { backgroundColor: colors.cardBg }]}>
                  <View style={[s.checkWrap, { backgroundColor: Palette.accent50 }]}>
                    <Feather name="check" size={13} color={Palette.accent600} />
                  </View>
                  <Text style={[s.reqText, { color: colors.textSecondary }]}>{req}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── COMPENSATION CARD ── */}
        <View style={[s.compensationCard, Shadow.card]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Compensation</Text>
          <View style={s.compRow}>
            {job.salaryRange && (
              <View style={s.compItem}>
                <Text style={s.compLabel}>Base Salary</Text>
                <Text style={[s.compVal, { color: colors.text }]}>{job.salaryRange}</Text>
              </View>
            )}
            {job.commissionRange && (
              <View style={[s.compItem, job.salaryRange ? s.compItemBorder : {}]}>
                <Text style={s.compLabel}>OTE / Commission</Text>
                <Text style={[s.compVal, { color: Palette.warm600 }]}>{job.commissionRange}</Text>
              </View>
            )}
            {!job.salaryRange && !job.commissionRange && (
              <Text style={[s.compEmpty, { color: colors.textMuted }]}>
                Competitive salary — details discussed during interview.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── BOTTOM STICKY BAR ── */}
      <View style={[s.actionBar, Shadow.cardMd, { backgroundColor: '#ffffff', borderColor: colors.border }]}>
        {/* Heart Bookmark */}
        <Pressable
          style={({ pressed }) => [
            s.heartAction,
            {
              backgroundColor: isSaved ? Palette.warm50 : Palette.neutral100,
              opacity: pressed ? 0.8 : 1,
            }
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Feather name="heart" size={20} color={isSaved ? Palette.warm500 : colors.textSecondary} />
        </Pressable>

        {/* Apply Button */}
        {hasApplied ? (
          <View style={s.appliedBtn}>
            <Feather name="check-circle" size={15} color={Palette.emerald600} />
            <Text style={s.appliedBtnText}>Already Applied</Text>
          </View>
        ) : (
          <LinearGradient
            colors={[Palette.accent600, Palette.accent500]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.applyActionWrap}
          >
            <Pressable
              style={({ pressed }) => [s.applyAction, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleApply}
            >
              <Feather name="send" size={15} color="#fff" />
              <Text style={s.applyActionText}>Apply for this Role</Text>
            </Pressable>
          </LinearGradient>
        )}
      </View>

      <ApplyJobModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        job={job}
        onSuccess={() => {
          refreshData();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  // Header Nav Bar
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  headerBackText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Body Scroll
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },

  // Hero Card
  heroCard: {
    borderRadius: BorderRadius.cardLg,
    borderWidth: 1,
    borderColor: '#e7f0ea',
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  companyLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: FontWeight.extrabold,
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 13,
    fontWeight: FontWeight.semibold,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: FontWeight.extrabold,
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: FontWeight.semibold,
  },

  // Compensation Card
  compensationCard: {
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Palette.neutral100,
  },
  compRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
  },
  compItem: {
    flex: 1,
    paddingHorizontal: 4,
  },
  compItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Palette.neutral100,
    paddingLeft: 16,
  },
  compLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.neutral400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  compVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  compEmpty: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Section general
  section: {
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
  },

  // Requirements
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.neutral100,
    gap: 10,
  },
  checkWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reqText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  // Sticky Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  heartAction: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyActionWrap: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  applyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
  },
  applyActionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  appliedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    backgroundColor: Palette.emerald50,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
  },
  appliedBtnText: {
    color: Palette.emerald600,
    fontWeight: '700',
    fontSize: 14,
  },

  // Error views
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: FontWeight.bold,
    marginTop: 8,
  },
  errorSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
