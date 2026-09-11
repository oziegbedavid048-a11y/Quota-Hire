import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

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
  accepted:     { label: 'Accepted (Hired)', bg: Palette.emerald50,  text: EmeraldGreen,       dot: Palette.emerald500 },
  rejected:     { label: 'Rejected',         bg: Palette.red50,      text: Palette.red700,     dot: Palette.red500 },
};

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

export default function CompanyApplicants() {
  const colors = Colors.light;

  const { jobs } = useCompanyDashboardData();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'shortlisted' | 'interview' | 'accepted' | 'rejected'>('all');

  // Candidate Profile Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [candidateModalVisible, setCandidateModalVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Auto-select first job if none selected
  useEffect(() => {
    if (!selectedJobId && jobs && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const activeJob: CompanyJob | undefined = jobs.find(j => String(j.id) === String(selectedJobId));
  const isPromoted = activeJob?.package === 'promoted';

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

  // Status Change Workflow (Promoted Jobs)
  const handleUpdateStatus = (appId: number, newStatus: string) => {
    const config = STATUS_CONFIG[newStatus] || { label: newStatus };
    Alert.alert(
      `Set Status: ${config.label}`,
      `Are you sure you want to mark this applicant as "${config.label}"? An automated email and real-time push notification will be sent immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdatingStatus(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
              Alert.alert('Status Updated', `Candidate is now marked as "${config.label}". Real-time notifications dispatched.`);
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
  // The backend no longer accepts a raw access token here at all.
  const handleOpenResume = async (appId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { url } = await apiFetch(`/company/applications/${appId}/resume/ticket/`, {
        method: 'POST',
      });
      if (url) {
        await Linking.openURL(`${API_BASE.replace(/\/api\/?$/, '')}${url}`);
        return;
      }
    } catch (_ticketErr) {
      // Fallback to direct token
      try {
        const token = await getAccessToken();
        const fallbackUrl = `${API_BASE}/company/applications/${appId}/resume/?token=${encodeURIComponent(token || '')}`;
        await Linking.openURL(fallbackUrl);
        return;
      } catch (err: any) {
        Alert.alert('Resume Viewer', err?.message || 'Unable to open resume document at this time.');
      }
    }
  };

  const handleViewCandidate = (candidate: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCandidate(candidate);
    setCandidateModalVisible(true);
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
    <View style={styles.root}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* ── 1. HEADER (No back arrow button) ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Job Applicants</Text>
            <Text style={styles.headerSub}>
              {jobs.length} Active {jobs.length === 1 ? 'Role' : 'Roles'} Listed
            </Text>
          </View>
          {activeJob && (
            <View style={[
              styles.packageBadge,
              isPromoted
                ? { backgroundColor: Palette.emerald50, borderColor: '#a7f3d0' }
                : { backgroundColor: Palette.neutral100, borderColor: '#cbd5e1' }
            ]}>
              <Feather
                name={isPromoted ? "zap" : "shield"}
                size={11}
                color={isPromoted ? Palette.emerald600 : Palette.neutral600}
              />
              <Text style={[
                styles.packageBadgeText,
                { color: isPromoted ? EmeraldGreen : Palette.neutral600 }
              ]}>
                {isPromoted ? 'Promoted Direct Access' : 'Agency Package'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── 2. HERO BANNER (Directly below header) ── */}
      <Animated.View entering={FadeInDown.springify()} style={[styles.heroCard, { borderColor: colors.borderMid }]}>
        <LinearGradient
          colors={['#FCEFCF', '#E1F6DD']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.heroContent}>
          <View style={{ flex: 1 }}>
            <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.7)', borderColor: colors.borderMid }]}>
              <Feather name={isPromoted ? "zap" : "users"} size={11} color={Palette.accent600} />
              <Text style={styles.badgeText}>
                {isPromoted ? '⚡ Promoted Job Pipeline' : 'Applicants Pipeline'}
              </Text>
            </View>
            <Text style={styles.heroTitle}>
              {isPromoted ? 'Direct Candidate Access' : 'Evaluate Candidates'}
            </Text>
            <Text style={styles.heroSub}>
              {isPromoted
                ? 'Review full candidate contact info, download original CVs, and manage hiring decisions directly.'
                : 'Review anonymized candidate profiles and shortlist top talent for Quota Hire placement.'}
            </Text>
          </View>
          <Image
            source={require('../../assets/images/illustrations/applicant_reviewer.webp')}
            style={styles.heroIllustration}
            contentFit="contain"
          />
        </View>
      </Animated.View>

      {/* ── 3. JOB SELECTOR CHIPS (Cleanly below hero banner) ── */}
      <View style={styles.jobSelectorSection}>
        <Text style={styles.jobSelectorLabel}>SELECT JOB LISTING</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.jobChips}
        >
          {jobs.map(job => {
            const isThisPromoted = job.package === 'promoted';
            const isSelected = String(selectedJobId) === String(job.id);
            return (
              <Pressable
                key={job.id}
                onPress={() => {
                  setSelectedJobId(job.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.jobChip,
                  isSelected ? styles.jobChipActive : { backgroundColor: '#ffffff', borderColor: colors.borderMid }
                ]}
              >
                {isThisPromoted && (
                  <View style={[styles.promotedChipTag, isSelected && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                    <Feather name="zap" size={10} color={isSelected ? '#ffffff' : Palette.emerald600} />
                    <Text style={[styles.promotedChipTagText, isSelected && { color: '#ffffff' }]}>Promoted</Text>
                  </View>
                )}
                <Text style={[styles.jobChipText, isSelected && { color: '#ffffff' }]} numberOfLines={1}>
                  {job.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 4. FILTER TABS BAR ── */}
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
            <Text style={[styles.filterTabText, activeFilter === tab.key && { color: Palette.accent600 }]}>
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

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => handleViewCandidate(app)}
                      style={[styles.viewProfileBtn, { backgroundColor: Palette.neutral100 }]}
                    >
                      <Feather name="user" size={12} color={colors.text} />
                      <Text style={[styles.viewProfileText, { color: colors.text }]}>View Details</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleToggleShortlist(app.id, app.is_shortlisted)}
                      style={[
                        styles.shortlistBtn,
                        app.is_shortlisted
                          ? { backgroundColor: Palette.amber50, borderWidth: 1, borderColor: AmberBorder }
                          : { backgroundColor: Palette.accent600 }
                      ]}
                    >
                      <Feather
                        name="star"
                        size={12}
                        color={app.is_shortlisted ? Palette.amber700 : '#ffffff'}
                      />
                      <Text style={[
                        styles.shortlistBtnText,
                        { color: app.is_shortlisted ? Palette.amber700 : '#ffffff' }
                      ]}>
                        {app.is_shortlisted ? 'Shortlisted' : 'Shortlist'}
                      </Text>
                    </Pressable>
                  </View>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Candidate Profile</Text>
                {isPromoted && (
                  <View style={styles.promotedAccessBadge}>
                    <Feather name="zap" size={10} color={EmeraldGreen} />
                    <Text style={styles.promotedAccessBadgeText}>Direct Access</Text>
                  </View>
                )}
              </View>
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

                  {/* Status & Exp Row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
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
                        <Text style={styles.resumeSub}>Original application document (PDF format)</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleOpenResume(selectedCandidate.id)}
                      style={styles.resumeDownloadBtn}
                    >
                      <Feather name="download" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.resumeDownloadBtnText}>View / Download</Text>
                    </Pressable>
                  </View>
                )}

                {/* ── PROFESSIONAL SUMMARY ── */}
                {selectedCandidate.employee_profile?.bio && (
                  <View style={styles.modalSectionCard}>
                    <Text style={styles.modalSectionLabel}>Professional Summary</Text>
                    <Text style={styles.modalSectionVal}>
                      {isPromoted
                        ? selectedCandidate.employee_profile.bio
                        : cleanText(selectedCandidate.employee_profile.bio)}
                    </Text>
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

                {/* ── HIRING & EVALUATION WORKFLOW (PROMOTED JOBS) ── */}
                {isPromoted ? (
                  <View style={styles.pipelineActionsCard}>
                    <Text style={styles.pipelineSectionTitle}>Candidate Evaluation & Status</Text>
                    <Text style={styles.pipelineSectionSub}>
                      Moving candidate status triggers instant push and automated email notifications.
                    </Text>

                    <View style={styles.pipelineButtonsGrid}>
                      {/* Shortlist */}
                      <Pressable
                        onPress={() => handleToggleShortlist(selectedCandidate.id, selectedCandidate.is_shortlisted)}
                        style={[
                          styles.pipelineBtn,
                          selectedCandidate.is_shortlisted
                            ? { backgroundColor: Palette.amber50, borderColor: AmberBorder }
                            : { backgroundColor: '#ffffff', borderColor: colors.borderMid }
                        ]}
                      >
                        <Feather
                          name="star"
                          size={14}
                          color={selectedCandidate.is_shortlisted ? Palette.amber700 : Palette.neutral700}
                        />
                        <Text style={[
                          styles.pipelineBtnText,
                          { color: selectedCandidate.is_shortlisted ? Palette.amber700 : Palette.neutral700 }
                        ]}>
                          {selectedCandidate.is_shortlisted ? 'Shortlisted' : 'Shortlist'}
                        </Text>
                      </Pressable>

                      {/* Interview */}
                      <Pressable
                        onPress={() => handleUpdateStatus(selectedCandidate.id, 'interview')}
                        disabled={updatingStatus}
                        style={[
                          styles.pipelineBtn,
                          selectedCandidate.status === 'interview'
                            ? { backgroundColor: Palette.purple50, borderColor: PurpleBorder }
                            : { backgroundColor: '#ffffff', borderColor: colors.borderMid }
                        ]}
                      >
                        <Feather name="calendar" size={14} color={Palette.purple700} />
                        <Text style={[styles.pipelineBtnText, { color: Palette.purple700 }]}>
                          Interview
                        </Text>
                      </Pressable>

                      {/* Approve / Hire */}
                      <Pressable
                        onPress={() => handleUpdateStatus(selectedCandidate.id, 'accepted')}
                        disabled={updatingStatus}
                        style={[
                          styles.pipelineBtn,
                          selectedCandidate.status === 'accepted'
                            ? { backgroundColor: Palette.emerald50, borderColor: EmeraldBorder }
                            : { backgroundColor: '#ffffff', borderColor: colors.borderMid }
                        ]}
                      >
                        <Feather name="check-circle" size={14} color={EmeraldGreen} />
                        <Text style={[styles.pipelineBtnText, { color: EmeraldGreen }]}>
                          Approve / Hire
                        </Text>
                      </Pressable>

                      {/* Reject */}
                      <Pressable
                        onPress={() => handleUpdateStatus(selectedCandidate.id, 'rejected')}
                        disabled={updatingStatus}
                        style={[
                          styles.pipelineBtn,
                          selectedCandidate.status === 'rejected'
                            ? { backgroundColor: Palette.red50, borderColor: RedBorder }
                            : { backgroundColor: '#ffffff', borderColor: colors.borderMid }
                        ]}
                      >
                        <Feather name="x-circle" size={14} color={Palette.red600} />
                        <Text style={[styles.pipelineBtnText, { color: Palette.red600 }]}>
                          Reject
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={() => handleToggleShortlist(selectedCandidate.id, selectedCandidate.is_shortlisted)}
                      style={[
                        styles.modalShortlistBtn,
                        selectedCandidate.is_shortlisted
                          ? { backgroundColor: Palette.amber50, borderWidth: 1, borderColor: AmberBorder }
                          : { backgroundColor: Palette.accent600 }
                      ]}
                    >
                      <Feather
                        name="star"
                        size={14}
                        color={selectedCandidate.is_shortlisted ? Palette.amber700 : '#ffffff'}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[
                        styles.modalShortlistBtnText,
                        { color: selectedCandidate.is_shortlisted ? Palette.amber700 : '#ffffff' }
                      ]}>
                        {selectedCandidate.is_shortlisted ? 'Remove from Shortlist' : 'Shortlist Candidate'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header (No back arrow button)
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'rgba(255, 251, 235, 0.95)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: '#0f172a',
  },
  headerSub: {
    fontSize: FontSize.xs,
    color: Palette.neutral500,
    marginTop: 2,
  },
  packageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  packageBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },

  // Hero banner (Directly below header)
  heroCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Palette.neutral700,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: FontWeight.extrabold,
    color: '#0f172a',
    marginBottom: 3,
  },
  heroSub: {
    fontSize: 11,
    color: Palette.neutral600,
    lineHeight: 15,
  },
  heroIllustration: {
    width: 76,
    height: 76,
    marginLeft: 8,
  },

  // Job Selector
  jobSelectorSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  jobSelectorLabel: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    color: Palette.neutral400,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  jobChips: {
    flexDirection: 'row',
    gap: 8,
  },
  jobChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  jobChipActive: {
    backgroundColor: Palette.accent600,
    borderColor: Palette.accent600,
  },
  jobChipText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Palette.neutral700,
  },
  promotedChipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.emerald50,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  promotedChipTagText: {
    fontSize: 9,
    fontWeight: FontWeight.extrabold,
    color: EmeraldGreen,
  },

  // Filters Bar
  filterBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: Palette.accent500,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: Palette.neutral500,
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
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  viewProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
  },
  viewProfileText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  shortlistBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
  },
  shortlistBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
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
  promotedAccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.emerald50,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  promotedAccessBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: EmeraldGreen,
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
  resumeDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.emerald600,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resumeDownloadBtnText: {
    fontSize: 11,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
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

  // Candidate Pipeline Action Grid
  pipelineActionsCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  pipelineSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.extrabold,
    color: '#0f172a',
  },
  pipelineSectionSub: {
    fontSize: 11,
    color: Palette.neutral500,
  },
  pipelineButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pipelineBtn: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  pipelineBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },

  // Modal Actions for agency package
  modalActions: {
    marginTop: 10,
    marginBottom: 20,
  },
  modalShortlistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  modalShortlistBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
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
