import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  FlatList,
  Linking,
  PanResponder,
  BackHandler,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Palette, FontSize, FontWeight, TabBarHeight } from '@/constants/theme';
import { apiFetch, API_BASE, getAccessToken } from '@/services/api';
import { useCompanyDashboardData, CompanyJob } from '@/hooks/useCompanyDashboardData';
import { SkeletonApplicantCard } from '@/components/ui/skeleton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const EmeraldGreen = '#047857';
const EmeraldDark = '#065f46';
const EmeraldBorder = '#6ee7b7';
const AmberBorder = '#fcd34d';
const PurpleBorder = '#d8b4fe';
const RedBorder = '#fca5a5';

// Status configuration matching Django Admin & Tracker
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:      { label: 'Applied',          bg: Palette.neutral100, text: Palette.neutral700, dot: Palette.neutral400 },
  under_review: { label: 'Under Review',     bg: Palette.amber50,    text: Palette.amber700,   dot: Palette.amber500 },
  interview:    { label: 'Interview',        bg: Palette.purple50,   text: Palette.purple700,  dot: Palette.purple500 },
  decision:     { label: 'Decision Pending', bg: Palette.blue50,     text: Palette.blue600,    dot: Palette.blue500 },
  accepted:     { label: 'Accepted',         bg: Palette.emerald50,  text: EmeraldGreen,       dot: Palette.emerald500 },
  rejected:     { label: 'Rejected',         bg: Palette.red50,      text: Palette.red700,     dot: Palette.red500 },
};

// 5 Evaluation Actions matching Django Admin & Product Specification
const EVALUATION_ACTIONS: Array<{
  status: string;
  label: string;
  shortLabel: string;
  icon: 'eye' | 'calendar' | 'clock' | 'check-circle' | 'x-circle';
  color: string;
  activeBg: string;
  activeBorder: string;
}> = [
  {
    status: 'under_review',
    label: 'Mark as Under Review',
    shortLabel: 'Under Review',
    icon: 'eye',
    color: '#d97706',
    activeBg: '#fef3c7',
    activeBorder: '#f59e0b',
  },
  {
    status: 'interview',
    label: 'Mark for Interview',
    shortLabel: 'Interview',
    icon: 'calendar',
    color: '#7c3aed',
    activeBg: '#f3e8ff',
    activeBorder: '#a855f7',
  },
  {
    status: 'decision',
    label: 'Mark as Decision Pending',
    shortLabel: 'Decision Pending',
    icon: 'clock',
    color: '#2563eb',
    activeBg: '#eff6ff',
    activeBorder: '#3b82f6',
  },
  {
    status: 'accepted',
    label: 'Accept Application',
    shortLabel: 'Accepted',
    icon: 'check-circle',
    color: '#059669',
    activeBg: '#ecfdf5',
    activeBorder: '#10b981',
  },
  {
    status: 'rejected',
    label: 'Reject Application',
    shortLabel: 'Rejected',
    icon: 'x-circle',
    color: '#dc2626',
    activeBg: '#fef2f2',
    activeBorder: '#ef4444',
  },
];

// Mask contact information strictly for non-promoted agency packages
const cleanText = (text: string) => {
  if (!text) return text;
  let cleaned = text;
  cleaned = cleaned.replace(/^(Email|Address|Location|LinkedIn|Phone|Contact|Mobile|Website|Portfolio)[\s:]*.*$/gmi, '');
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi, '');
  cleaned = cleaned.replace(/(?:(?:\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?)|(?:\(\d{2,4}\)))[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '');
  cleaned = cleaned.replace(/\b\d{1,5}\s+[a-zA-Z0-9\s.,-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Plaza|Plz|Square|Sq|Close|Crescent|Estate)\b/gi, '');
  cleaned = cleaned.replace(/\b(?:P\.?O\.?\s*Box|Post\s*Office\s*Box)\s*\d+\b/gi, '');
  return cleaned.trim();
};

interface CompanyApplicantsProps {
  jobId?: string;
  onBack?: () => void;
}

export default function CompanyApplicants({ jobId, onBack }: CompanyApplicantsProps = {}) {
  const colors = Colors.light;
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string; view?: string }>();

  const { jobs, company } = useCompanyDashboardData();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(jobId || params.jobId || null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'shortlisted' | 'interview' | 'accepted' | 'rejected'>('all');

  // Candidate Profile Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [candidateModalVisible, setCandidateModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // In-App Resume / CV Viewer State
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);

  // Sync selected job ID from props/params or fallback to first job
  useEffect(() => {
    if (jobId) {
      setSelectedJobId(jobId);
    } else if (params.jobId) {
      setSelectedJobId(params.jobId);
    } else if (!selectedJobId && jobs && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobId, params.jobId, jobs, selectedJobId]);

  const activeJob: CompanyJob | undefined = jobs.find(j => String(j.id) === String(selectedJobId));
  const isPromoted = activeJob?.package === 'promoted';
  const companyLogo = activeJob?.companyLogoUrl || company?.logoUrl || company?.avatarUrl;

  // Back navigation returning specifically to My Jobs list
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) {
      onBack();
    } else {
      router.replace({ pathname: '/tracker', params: {} } as any);
    }
  }, [onBack, router]);

  // Android hardware back button handler -> returns to roles list
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [handleBack])
  );

  // Left swipe gesture detector -> swiping from the left-hand edge returns to My Jobs list
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const isFromLeftEdge = evt.nativeEvent.pageX <= 80;
        const isMovingRight = gestureState.dx > 25;
        const isHorizontal = gestureState.dx > Math.abs(gestureState.dy) * 1.5;
        return isFromLeftEdge && isMovingRight && isHorizontal;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dx > 50 || gestureState.vx > 0.35) {
          handleBack();
        }
      },
    })
  ).current;

  const fetchApplicants = async (id: string) => {
    setLoading(true);
    try {
      let data = await apiFetch(`/company/jobs/${id}/applicants/`);
      let list = Array.isArray(data) ? data : data?.results || [];
      if (list.length === 0) {
        const allApps = await apiFetch(`/applications/`);
        const rawList = Array.isArray(allApps) ? allApps : allApps?.results || [];
        const matched = rawList.filter((a: any) => String(a.job?.id || a.job_id || a.job) === String(id));
        if (matched.length > 0) list = matched;
      }
      setApplicants(list);
    } catch {
      try {
        const allApps = await apiFetch(`/applications/`);
        const rawList = Array.isArray(allApps) ? allApps : allApps?.results || [];
        const matched = rawList.filter((a: any) => String(a.job?.id || a.job_id || a.job) === String(id));
        setApplicants(matched);
      } catch {
        setApplicants([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchApplicants(selectedJobId);
    } else {
      setApplicants([]);
    }
  }, [selectedJobId]);

  // Shortlist toggle
  const handleToggleShortlist = async (appId: number, currentlyShortlisted: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (currentlyShortlisted) {
        await apiFetch(`/company/applications/${appId}/shortlist/`, { method: 'DELETE' });
        setApplicants(prev => prev.map(app => app.id === appId ? { ...app, is_shortlisted: false } : app));
        if (selectedCandidate && selectedCandidate.id === appId) {
          setSelectedCandidate((prev: any) => ({ ...prev, is_shortlisted: false }));
        }
        Alert.alert('Removed', 'Applicant removed from shortlist.');
      } else {
        await apiFetch(`/company/applications/${appId}/shortlist/`, { method: 'POST' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setApplicants(prev => prev.map(app => app.id === appId ? { ...app, is_shortlisted: true } : app));
        if (selectedCandidate && selectedCandidate.id === appId) {
          setSelectedCandidate((prev: any) => ({ ...prev, is_shortlisted: true }));
        }
        Alert.alert('Shortlisted!', 'Applicant added to shortlist.');
      }
    } catch (err: any) {
      Alert.alert('Shortlist Error', err?.message || 'Failed to update shortlist state.');
    }
  };

  // Status Change Workflow with Accidental-Click Protection Prompt
  const handleUpdateStatus = (appId: number, newStatus: string) => {
    const currentStatusKey = selectedCandidate?.status || 'pending';
    const currentConfig = STATUS_CONFIG[currentStatusKey] || STATUS_CONFIG.pending;
    const actionConfig = EVALUATION_ACTIONS.find(a => a.status === newStatus) || { label: newStatus, shortLabel: newStatus };
    const candidateName = selectedCandidate?.employee_name || 'this applicant';

    if (currentStatusKey === newStatus) {
      Alert.alert(
        'Current Status',
        `${candidateName} is already marked as "${actionConfig.shortLabel}".`
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Update Application Status',
      `You are changing ${candidateName}'s application status from "${currentConfig.label}" to "${actionConfig.shortLabel}".\n\nAn automated email notification will be sent to the applicant immediately.\n\nAre you sure you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Update',
          style: newStatus === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setUpdatingStatus(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              await apiFetch(`/company/applications/${appId}/status/`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setApplicants(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
              if (selectedCandidate && selectedCandidate.id === appId) {
                setSelectedCandidate((prev: any) => ({ ...prev, status: newStatus }));
              }
              Alert.alert(
                'Status Updated',
                `${candidateName}'s application has been updated to "${actionConfig.shortLabel}". The candidate has been notified via email.`
              );
            } catch (err: any) {
              Alert.alert('Update Failed', err?.message || 'Failed to update candidate status.');
            } finally {
              setUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  // View / Download Resume PDF
  // SECURITY (QH-50): this used to append the signed-in user's own access token
  // to the URL — `?token=<jwt>` — and hand it to Linking.openURL, which passes
  // it to the system browser. That token is the credential for every API call
  // the account can make, and a URL opened this way is recorded in browser
  // history, in server and proxy access logs, and in the Referer header of
  // anything the opened document loads. Anyone who later read one of those had
  // full access to the account until the token expired.
  //
  // The server now issues a ticket that unlocks exactly this one resume and
  // expires in five minutes, so it does not matter where the URL ends up.
  // View Resume PDF directly in-app
  const handleOpenResume = async (appId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoadingResume(true);
    try {
      const { url } = await apiFetch(`/company/applications/${appId}/resume/ticket/`, {
        method: 'POST',
      });
      if (!url) throw new Error('The server did not return a resume link.');
      const fullUrl = `${API_BASE.replace(/\/api\/?$/, '')}${url}`;
      setResumeUrl(fullUrl);
      setResumeModalVisible(true);
    } catch (err: any) {
      Alert.alert(
        'Resume Viewer',
        err?.message || 'Unable to open resume document at this time.'
      );
    } finally {
      setLoadingResume(false);
    }
  };

  const handleViewCandidate = async (candidate: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCandidate(candidate);
    setCandidateModalVisible(true);

    // Concurrently fetch full application detail to guarantee fresh, unmasked contact fields
    try {
      const detailed = await apiFetch(`/company/applications/${candidate.id}/`);
      if (detailed && detailed.id === candidate.id) {
        setSelectedCandidate(detailed);
      }
    } catch {
      // Retain already set candidate state
    }
  };

  // Filtering
  const filteredApplicants = applicants.filter(a => {
    if (activeFilter === 'shortlisted') return a.is_shortlisted;
    if (activeFilter === 'interview') return a.status === 'interview';
    if (activeFilter === 'accepted') return a.status === 'accepted';
    if (activeFilter === 'rejected') return a.status === 'rejected';
    return true;
  });

  const shortlistedCount = applicants.filter(a => a.is_shortlisted).length;
  const interviewCount = applicants.filter(a => a.status === 'interview').length;
  const acceptedCount = applicants.filter(a => a.status === 'accepted').length;

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ── HERO BANNER (Clean, Single Clicked Job Only) ── */}
      <Animated.View entering={FadeInDown.springify()} style={[styles.heroCard, { borderColor: colors.borderMid }]}>
        <LinearGradient
          colors={['#FCEFCF', '#E1F6DD']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.heroContent}>
          {/* Company Logo or Monogram */}
          {companyLogo ? (
            <View style={[styles.bannerLogoWrap, { borderColor: colors.borderMid }]}>
              <Image source={{ uri: companyLogo }} style={styles.bannerLogoImg} contentFit="contain" />
            </View>
          ) : (
            <LinearGradient colors={['#FCEFCF', '#E1F6DD']} style={styles.bannerLogoWrap}>
              <Text style={styles.bannerLogoInitial}>
                {(company?.companyName || activeJob?.companyName || activeJob?.title || 'Q').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.heroJobTitle} numberOfLines={1}>
              {activeJob?.title || 'Job Listing'}
            </Text>

            <View style={styles.heroMetaRow}>
              <Text style={[styles.heroCompanyText, { color: colors.textSecondary }]} numberOfLines={1}>
                {activeJob?.companyName || company?.companyName || 'Company'}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 10 }}>•</Text>
              <Feather name="map-pin" size={11} color={colors.textMuted} />
              <Text style={[styles.heroMetaText, { color: colors.textMuted }]}>
                {activeJob?.workType === 'Remote' ? 'Remote' : activeJob?.location || 'Hybrid'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* ── 3. FILTER TABS BAR (Clean & Minimal) ── */}
      <View style={styles.filterBar}>
        {[
          { key: 'all', label: `All (${applicants.length})` },
          { key: 'shortlisted', label: `Shortlisted (${shortlistedCount})` },
          { key: 'interview', label: `Interview (${interviewCount})` },
          { key: 'accepted', label: `Hired (${acceptedCount})` },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveFilter(tab.key as any);
            }}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabText, activeFilter === tab.key && styles.filterTabActiveText]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── 5. CANDIDATES LIST ── */}
      {!selectedJobId ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="briefcase" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Select a Job Listing</Text>
          <Text style={styles.emptySub}>Select one of your job roles above to view applicant submissions.</Text>
        </View>
      ) : loading ? (
        <View style={{ gap: 14, paddingHorizontal: 16, paddingTop: 16 }}>
          {[1, 2, 3].map(k => (
            <SkeletonApplicantCard key={k} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredApplicants}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[styles.list, { paddingBottom: TabBarHeight + 36 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: app, index }) => {
            const statusStyle = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
            const candidateBio = isPromoted
              ? (app.employee_profile?.bio || '')
              : cleanText(app.employee_profile?.bio || '');

            return (
              <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
                <Pressable
                  onPress={() => handleViewCandidate(app)}
                  style={({ pressed }) => [
                    styles.candidateCard,
                    { borderColor: colors.borderMid, opacity: pressed ? 0.96 : 1 }
                  ]}
                >
                  {/* Card Top Row: Avatar + Name + Status Badge */}
                  <View style={styles.cardHeader}>
                    {app.avatar_url ? (
                      <View style={styles.avatarWrap}>
                        <Animated.Image source={{ uri: app.avatar_url }} style={styles.avatar} />
                      </View>
                    ) : (
                      <View style={[styles.fallbackAvatar, { backgroundColor: Palette.accent50 }]}>
                        <Text style={styles.fallbackAvatarText}>
                          {(app.employee_name || 'C').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={styles.cardHeaderInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.candidateName, { color: colors.text }]} numberOfLines={1}>
                          {app.employee_name}
                        </Text>
                        {app.is_shortlisted && (
                          <Feather name="star" size={13} color={Palette.amber500} style={{ marginTop: 1 }} />
                        )}
                      </View>
                      <Text style={[styles.candidateTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        {app.employee_profile?.title || 'Applicant'} • {app.employee_profile?.experience_years || 0} yrs exp
                      </Text>
                    </View>

                    {/* Status badge matching Django Admin & Tracker */}
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.dot }]} />
                      <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  {/* Promoted Direct Contact Info Snippet */}
                  {isPromoted && (app.applicant_email || app.applicant_phone) && (
                    <View style={styles.contactSnippetRow}>
                      {app.applicant_email && (
                        <View style={styles.contactSnippetChip}>
                          <Feather name="mail" size={11} color={Palette.accent600} />
                          <Text style={styles.contactSnippetText} numberOfLines={1}>
                            {app.applicant_email}
                          </Text>
                        </View>
                      )}
                      {app.applicant_phone && (
                        <View style={styles.contactSnippetChip}>
                          <Feather name="phone" size={11} color={Palette.accent600} />
                          <Text style={styles.contactSnippetText} numberOfLines={1}>
                            {app.applicant_phone}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Bio snippet */}
                  <Text style={[styles.candidateBio, { color: colors.textSecondary }]} numberOfLines={2}>
                    {candidateBio || 'No summary provided.'}
                  </Text>

                  {/* Skills tags */}
                  {app.employee_profile?.skills && app.employee_profile.skills.length > 0 && (
                    <View style={styles.skillsRow}>
                      {app.employee_profile.skills.slice(0, 3).map((skill: string) => (
                        <View key={skill} style={styles.skillTag}>
                          <Text style={styles.skillTagText}>{skill}</Text>
                        </View>
                      ))}
                      {app.employee_profile.skills.length > 3 && (
                        <Text style={styles.skillsMore}>+{app.employee_profile.skills.length - 3}</Text>
                      )}
                    </View>
                  )}

                  <View style={styles.cardDivider} />

                  {/* Action CTA: Redesigned Minimal View Details */}
                  <Pressable
                    onPress={() => handleViewCandidate(app)}
                    style={({ pressed }) => [
                      styles.viewDetailsBtn,
                      { opacity: pressed ? 0.88 : 1 }
                    ]}
                  >
                    <View style={styles.viewDetailsLeft}>
                      <View style={styles.viewDetailsIconCircle}>
                        <Feather name="eye" size={13} color="#ffffff" />
                      </View>
                      <Text style={styles.viewDetailsBtnText}>View Details</Text>
                    </View>
                    <Feather name="chevron-right" size={15} color="rgba(255,255,255,0.75)" />
                  </Pressable>
                </Pressable>
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { borderColor: colors.borderMid, marginHorizontal: 16 }]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: Palette.neutral100 }]}>
                <Feather name="users" size={32} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No applicants found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {activeFilter === 'all'
                  ? `No candidates have applied to "${activeJob?.title}" yet.`
                  : `No candidates matching the "${activeFilter}" filter.`}
              </Text>
            </View>
          }
        />
      )}

      {/* ── 6. DETAILED PROFILE SLIDE-UP MODAL ── */}
      <Modal visible={candidateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCandidateModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Candidate Profile</Text>
              <Pressable onPress={() => setCandidateModalVisible(false)} style={styles.modalClose}>
                <Feather name="x" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {selectedCandidate && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Candidate Overview */}
                <View style={styles.candidateOverview}>
                  {selectedCandidate.avatar_url ? (
                    <View style={styles.largeAvatarWrap}>
                      <Animated.Image source={{ uri: selectedCandidate.avatar_url }} style={styles.largeAvatar} />
                    </View>
                  ) : (
                    <View style={[styles.largeFallbackAvatar, { backgroundColor: Palette.accent50 }]}>
                      <Text style={styles.largeFallbackAvatarText}>
                        {(selectedCandidate.employee_name || 'C').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.modalName, { color: colors.text }]}>
                    {selectedCandidate.employee_name}
                  </Text>
                  <Text style={[styles.modalTitleText, { color: colors.textSecondary }]}>
                    {selectedCandidate.employee_profile?.title || 'Applicant'}
                  </Text>

                  {/* Overview Metadata Row: Exp Badge & Evaluated Status (Omit 'Applied') */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {selectedCandidate.status && selectedCandidate.status !== 'pending' && (
                      <View style={[
                        styles.statusPill,
                        { backgroundColor: (STATUS_CONFIG[selectedCandidate.status] || STATUS_CONFIG.pending).bg }
                      ]}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: (STATUS_CONFIG[selectedCandidate.status] || STATUS_CONFIG.pending).dot }
                        ]} />
                        <Text style={[
                          styles.statusPillText,
                          { color: (STATUS_CONFIG[selectedCandidate.status] || STATUS_CONFIG.pending).text }
                        ]}>
                          {(STATUS_CONFIG[selectedCandidate.status] || STATUS_CONFIG.pending).label}
                        </Text>
                      </View>
                    )}
                    <View style={styles.expBadge}>
                      <Feather name="briefcase" size={11} color={Palette.accent600} />
                      <Text style={styles.expBadgeText}>
                        {selectedCandidate.employee_profile?.experience_years || 0} Years Exp
                      </Text>
                    </View>
                  </View>
                </View>

                {/* ── UNMASKED CONTACT INFO CARD (PROMOTED ONLY) ── */}
                {isPromoted ? (
                  <View style={styles.contactCard}>
                    <View style={styles.contactCardHeader}>
                      <Feather name="user-check" size={14} color={EmeraldGreen} />
                      <Text style={styles.contactCardTitle}>Applicant Contact Information</Text>
                    </View>

                    {/* Email */}
                    <View style={styles.contactRow}>
                      <View style={styles.contactIconWrap}>
                        <Feather name="mail" size={14} color={Palette.accent600} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactLabel}>Email Address</Text>
                        <Text style={styles.contactValue}>
                          {selectedCandidate.applicant_email || selectedCandidate.employee_profile?.contact_email || 'Not provided'}
                        </Text>
                      </View>
                      {selectedCandidate.applicant_email && (
                        <Pressable
                          onPress={() => Linking.openURL(`mailto:${selectedCandidate.applicant_email}`)}
                          style={styles.contactActionBtn}
                        >
                          <Text style={styles.contactActionText}>Send Email</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Phone & WhatsApp */}
                    <View style={styles.contactRow}>
                      <View style={styles.contactIconWrap}>
                        <Feather name="phone" size={14} color={Palette.accent600} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.contactLabel}>Phone Number</Text>
                        <Text style={styles.contactValue}>
                          {selectedCandidate.applicant_phone || selectedCandidate.employee_profile?.phone_number || 'Not provided'}
                        </Text>
                      </View>
                      {selectedCandidate.applicant_phone && (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <Pressable
                            onPress={() => Linking.openURL(`tel:${selectedCandidate.applicant_phone}`)}
                            style={styles.contactActionBtn}
                          >
                            <Feather name="phone-call" size={12} color={Palette.accent600} />
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              const cleanPhone = selectedCandidate.applicant_phone.replace(/[^0-9]/g, '');
                              Linking.openURL(`https://wa.me/${cleanPhone}`);
                            }}
                            style={[styles.contactActionBtn, { backgroundColor: Palette.emerald50, borderColor: EmeraldBorder }]}
                          >
                            <Feather name="message-circle" size={12} color={EmeraldGreen} />
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Location / Address */}
                    {(selectedCandidate.applicant_location || selectedCandidate.applicant_address) && (
                      <View style={styles.contactRow}>
                        <View style={styles.contactIconWrap}>
                          <Feather name="map-pin" size={14} color={Palette.accent600} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.contactLabel}>Location & Address</Text>
                          <Text style={styles.contactValue}>
                            {[selectedCandidate.applicant_address, selectedCandidate.applicant_location].filter(Boolean).join(' • ')}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* LinkedIn */}
                    {selectedCandidate.applicant_linkedin ? (
                      <View style={styles.contactRow}>
                        <View style={styles.contactIconWrap}>
                          <Feather name="linkedin" size={14} color={Palette.blue600} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.contactLabel}>LinkedIn Profile</Text>
                          <Text style={[styles.contactValue, { color: Palette.blue600 }]} numberOfLines={1}>
                            {selectedCandidate.applicant_linkedin}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => Linking.openURL(selectedCandidate.applicant_linkedin)}
                          style={styles.contactActionBtn}
                        >
                          <Feather name="external-link" size={12} color={Palette.accent600} />
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.agencyNoticeCard}>
                    <Feather name="shield" size={16} color={Palette.blue600} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agencyNoticeTitle}>Agency Recruitment Package</Text>
                      <Text style={styles.agencyNoticeSub}>
                        Direct contact information and resumes are managed by Quota Hire. Shortlist candidates to notify your account manager.
                      </Text>
                    </View>
                  </View>
                )}

                {/* ── RESUME / CV ACTION CARD ── */}
                {isPromoted && (
                  <View style={styles.resumeCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={styles.resumeIconWrap}>
                        <Feather name="file-text" size={20} color={EmeraldGreen} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resumeTitle}>Candidate Resume / CV</Text>
                        <Text style={styles.resumeSub}>Original application document</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleOpenResume(selectedCandidate.id)}
                      disabled={loadingResume}
                      style={({ pressed }) => [
                        styles.resumeViewBtn,
                        { opacity: pressed || loadingResume ? 0.8 : 1 }
                      ]}
                    >
                      {loadingResume ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Feather name="eye" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.resumeViewBtnText}>View CV</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                )}

                {/* ── SKILLS & EXPERTISE ── */}
                {selectedCandidate.employee_profile?.skills && selectedCandidate.employee_profile.skills.length > 0 && (
                  <View style={styles.modalSectionCard}>
                    <Text style={styles.modalSectionLabel}>Skills & Expertise</Text>
                    <View style={styles.skillsContainer}>
                      {selectedCandidate.employee_profile.skills.map((skill: string) => (
                        <View key={skill} style={styles.skillsTagLarge}>
                          <Text style={styles.skillsTagLargeText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* ── EDUCATION ── */}
                {selectedCandidate.employee_profile?.education && (
                  <View style={styles.modalSectionCard}>
                    <Text style={styles.modalSectionLabel}>Education</Text>
                    <Text style={styles.modalSectionVal}>
                      {selectedCandidate.employee_profile.education}
                    </Text>
                  </View>
                )}

                {/* ── COVER LETTER ── */}
                {selectedCandidate.cover_letter && (
                  <View style={styles.modalSectionCard}>
                    <Text style={styles.modalSectionLabel}>Cover Letter</Text>
                    <Text style={styles.modalSectionVal}>
                      {isPromoted
                        ? selectedCandidate.cover_letter
                        : cleanText(selectedCandidate.cover_letter)}
                    </Text>
                  </View>
                )}

                {/* ── DEDICATED SHORTLIST ACTION (STANDALONE) ── */}
                <View style={[
                  styles.standaloneShortlistCard,
                  selectedCandidate.is_shortlisted && styles.standaloneShortlistCardActive
                ]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather
                        name="star"
                        size={15}
                        color={selectedCandidate.is_shortlisted ? Palette.amber500 : Palette.neutral600}
                      />
                      <Text style={[
                        styles.standaloneShortlistTitle,
                        selectedCandidate.is_shortlisted && { color: Palette.amber700 }
                      ]}>
                        {selectedCandidate.is_shortlisted ? 'Candidate Shortlisted' : 'Shortlist Candidate'}
                      </Text>
                    </View>
                    <Text style={[
                      styles.standaloneShortlistSub,
                      selectedCandidate.is_shortlisted && { color: Palette.amber700 }
                    ]}>
                      {selectedCandidate.is_shortlisted
                        ? 'Bookmarked in your Shortlisted filter tab'
                        : 'Bookmark to quickly access in the Shortlisted tab'}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleToggleShortlist(selectedCandidate.id, selectedCandidate.is_shortlisted)}
                    style={({ pressed }) => [
                      styles.standaloneShortlistBtn,
                      selectedCandidate.is_shortlisted
                        ? styles.standaloneShortlistBtnActive
                        : styles.standaloneShortlistBtnInactive,
                      { opacity: pressed ? 0.85 : 1 }
                    ]}
                  >
                    <Feather
                      name="star"
                      size={13}
                      color={selectedCandidate.is_shortlisted ? Palette.amber700 : '#ffffff'}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[
                      styles.standaloneShortlistBtnText,
                      { color: selectedCandidate.is_shortlisted ? Palette.amber700 : '#ffffff' }
                    ]}>
                      {selectedCandidate.is_shortlisted ? 'Remove' : 'Shortlist'}
                    </Text>
                  </Pressable>
                </View>

                {/* ── CANDIDATE EVALUATION & STATUS (5 ACTIONS) ── */}
                <View style={styles.evaluationSectionCard}>
                  <View style={styles.evaluationSectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Feather name="layers" size={15} color={Palette.accent600} />
                      <Text style={styles.evaluationSectionTitle}>Candidate Evaluation & Status</Text>
                    </View>
                    <View style={styles.evaluationStatusBadge}>
                      <Text style={styles.evaluationStatusBadgeText}>
                        Current: {(STATUS_CONFIG[selectedCandidate.status] || STATUS_CONFIG.pending).label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.evaluationSectionSub}>
                    Updating candidate status automatically sends an email notification directly to the applicant.
                  </Text>

                  <View style={styles.evaluationList}>
                    {EVALUATION_ACTIONS.map((action) => {
                      const isActive = selectedCandidate.status === action.status;
                      return (
                        <Pressable
                          key={action.status}
                          onPress={() => handleUpdateStatus(selectedCandidate.id, action.status)}
                          disabled={updatingStatus}
                          style={({ pressed }) => [
                            styles.evaluationActionRow,
                            isActive && {
                              backgroundColor: action.activeBg,
                              borderColor: action.activeBorder,
                              borderWidth: 1.5,
                            },
                            { opacity: pressed || updatingStatus ? 0.75 : 1 }
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View style={[
                              styles.evaluationActionIconWrap,
                              { backgroundColor: isActive ? '#ffffff' : '#f1f5f9' },
                              isActive && { borderColor: action.activeBorder, borderWidth: 1 }
                            ]}>
                              <Feather name={action.icon} size={15} color={action.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[
                                styles.evaluationActionLabel,
                                isActive && { color: action.color, fontWeight: FontWeight.extrabold }
                              ]}>
                                {action.label}
                              </Text>
                            </View>
                          </View>

                          {isActive ? (
                            <View style={[styles.activeStatusPill, { backgroundColor: action.color }]}>
                              <Text style={styles.activeStatusPillText}>Active</Text>
                            </View>
                          ) : (
                            <Feather name="chevron-right" size={16} color={Palette.neutral400} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── 7. IN-APP RESUME / CV VIEWER MODAL ── */}
      <Modal
        visible={resumeModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setResumeModalVisible(false)}
      >
        <SafeAreaView style={styles.viewerSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          {/* Top Navigation Bar with Title and Close Button */}
          <View style={styles.viewerHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {selectedCandidate?.employee_name ? `${selectedCandidate.employee_name}'s CV` : 'Candidate Resume'}
              </Text>
              <Text style={styles.viewerSub} numberOfLines={1}>
                {activeJob?.title || 'Job Application'}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setResumeModalVisible(false);
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={({ pressed }) => [
                styles.viewerCloseBtn,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Feather name="x" size={16} color="#0f172a" />
              <Text style={styles.viewerCloseBtnText}>Close</Text>
            </Pressable>
          </View>

          {/* In-App Document Viewer */}
          <View style={styles.viewerContent}>
            {resumeUrl ? (
              <WebView
                source={{
                  uri: Platform.OS === 'android'
                    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(resumeUrl)}`
                    : resumeUrl
                }}
                style={styles.viewerWebView}
                scalesPageToFit={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={styles.viewerLoadingWrap}>
                    <ActivityIndicator size="large" color={Palette.accent600} />
                    <Text style={styles.viewerLoadingText}>Loading Document...</Text>
                  </View>
                )}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            ) : (
              <View style={styles.viewerLoadingWrap}>
                <ActivityIndicator size="large" color={Palette.accent600} />
                <Text style={styles.viewerLoadingText}>Opening Document...</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero Banner
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 12,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerLogoWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  bannerLogoImg: {
    width: '100%',
    height: '100%',
  },
  bannerLogoInitial: {
    fontSize: 20,
    fontWeight: FontWeight.extrabold,
    color: Palette.neutral800,
  },
  heroJobTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
    color: '#0f172a',
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroCompanyText: {
    fontSize: 11,
    fontWeight: FontWeight.semibold,
  },
  heroMetaText: {
    fontSize: 11,
  },

  // Filters Bar
  filterBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 6,
    padding: 3,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  filterTabActive: {
    backgroundColor: Palette.accent500,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Palette.neutral500,
  },
  filterTabActiveText: {
    color: '#ffffff',
  },

  // Candidate Cards List
  list: {
    padding: 16,
    gap: 12,
  },
  candidateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallbackAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackAvatarText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
    color: Palette.accent700,
  },
  cardHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  candidateName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
  },
  candidateTitle: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
  },

  // Status Badge
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },

  // Contact Snippet
  contactSnippetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  contactSnippetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contactSnippetText: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    color: Palette.neutral600,
  },

  candidateBio: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },

  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  skillTag: {
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillTagText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Palette.neutral600,
  },
  skillsMore: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Palette.neutral400,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  viewDetailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailsIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
    letterSpacing: 0.15,
  },

  // Modal Slide Up Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_H * 0.85,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
  },

  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.neutral50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  candidateOverview: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  largeAvatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    marginBottom: 4,
  },
  largeAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  largeFallbackAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  largeFallbackAvatarText: {
    fontSize: 26,
    fontWeight: FontWeight.extrabold,
    color: Palette.accent700,
  },
  modalName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  modalTitleText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  expBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.accent50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
    color: Palette.accent700,
  },

  // Contact Information Card
  contactCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  contactCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  contactCardTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.neutral50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 10,
    color: Palette.neutral400,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Palette.neutral800,
    marginTop: 1,
  },
  contactActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: Palette.neutral50,
  },
  contactActionText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Palette.accent700,
  },

  // Agency package notice
  agencyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  agencyNoticeTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Palette.blue700,
  },
  agencyNoticeSub: {
    fontSize: 11,
    color: Palette.blue600,
    lineHeight: 15,
    marginTop: 2,
  },

  // Resume Action Card
  resumeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.emerald50,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  resumeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: EmeraldDark,
  },
  resumeSub: {
    fontSize: 10,
    color: Palette.emerald600,
    marginTop: 1,
  },
  resumeViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.emerald600,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  resumeViewBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },

  // Standalone Dedicated Shortlist Card
  standaloneShortlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  standaloneShortlistCardActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  standaloneShortlistTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Palette.neutral800,
  },
  standaloneShortlistSub: {
    fontSize: 10.5,
    color: Palette.neutral500,
    marginTop: 1,
  },
  standaloneShortlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  standaloneShortlistBtnActive: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  standaloneShortlistBtnInactive: {
    backgroundColor: '#0f172a',
  },
  standaloneShortlistBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
  },

  // In-App Viewer Styles
  viewerSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  viewerTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: '#0f172a',
  },
  viewerSub: {
    fontSize: 11,
    color: Palette.neutral500,
    marginTop: 1,
  },
  viewerCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewerCloseBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#0f172a',
  },
  viewerContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  viewerWebView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  viewerLoadingWrap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  viewerLoadingText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Palette.neutral600,
  },

  // Modal Section Cards
  modalSectionCard: {
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    marginBottom: 12,
  },
  modalSectionLabel: {
    fontSize: 10,
    fontWeight: FontWeight.extrabold,
    color: Palette.neutral400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalSectionVal: {
    fontSize: FontSize.xs,
    color: Palette.neutral700,
    lineHeight: 18,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  skillsTagLarge: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  skillsTagLargeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Palette.neutral700,
  },

  // 5 Candidate Evaluation & Status Workflow
  evaluationSectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  evaluationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  evaluationSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: '#0f172a',
  },
  evaluationStatusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  evaluationStatusBadgeText: {
    fontSize: 9.5,
    fontWeight: FontWeight.bold,
    color: Palette.neutral600,
  },
  evaluationSectionSub: {
    fontSize: 11,
    color: Palette.neutral500,
    lineHeight: 16,
  },
  evaluationList: {
    gap: 8,
    marginTop: 4,
  },
  evaluationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  evaluationActionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evaluationActionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#1e293b',
  },
  activeStatusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
  },
  activeStatusPillText: {
    fontSize: 9.5,
    fontWeight: FontWeight.extrabold,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
  },
  emptySub: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});
