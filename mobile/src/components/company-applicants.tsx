import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Colors, Palette, BorderRadius, FontSize, FontWeight, TabBarHeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';
import { useCompanyDashboardData } from '@/hooks/useCompanyDashboardData';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const cleanText = (text: string) => {
  if (!text) return text;
  let cleaned = text;
  
  // 1. Strip out lines explicitly labeled as contact info
  cleaned = cleaned.replace(/^(Email|Address|Location|LinkedIn|Phone|Contact|Mobile|Website|Portfolio)[\s:]*.*$/gmi, '');
  
  // 2. Hide basic email addresses
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  
  // 3. Hide LinkedIn/Portfolio URLs
  cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi, '');
  
  // 4. Hide phone numbers
  cleaned = cleaned.replace(/(?:(?:\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?)|(?:\(\d{2,4}\)))[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '');
  
  // 5. Hide typical Street Addresses and PO Boxes
  cleaned = cleaned.replace(/\b\d{1,5}\s+[a-zA-Z0-9\s.,-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Plaza|Plz|Square|Sq|Close|Crescent|Estate)\b/gi, '');
  cleaned = cleaned.replace(/\b(?:P\.?O\.?\s*Box|Post\s*Office\s*Box)\s*\d+\b/gi, '');

  return cleaned.trim();
};

export default function CompanyApplicants() {
  const colors = Colors.light;
  const router = useRouter();
  
  // Read jobId passed from MyJobs or explore
  const params = useLocalSearchParams<{ jobId?: string }>();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(params.jobId || null);

  const { jobs } = useCompanyDashboardData();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [shortlistedFilter, setShortlistedFilter] = useState(false);

  // Profile Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [candidateModalVisible, setCandidateModalVisible] = useState(false);

  const activeJob = jobs.find(j => j.id === selectedJobId);

  const fetchApplicants = async (id: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/company/jobs/${id}/applicants/`);
      setApplicants(Array.isArray(data) ? data : data.results || []);
    } catch {
      setApplicants([]);
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

  // Synchronize parameter changes
  useEffect(() => {
    if (params.jobId) {
      setSelectedJobId(params.jobId);
    }
  }, [params.jobId]);

  // Auto-select first job if none selected
  useEffect(() => {
    if (!selectedJobId && jobs && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const handleShortlist = async (appId: number) => {
    try {
      await apiFetch(`/company/applications/${appId}/shortlist/`, { method: 'POST' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Shortlisted!', 'Applicant successfully shortlisted.');
      setApplicants(prev => prev.map(app => app.id === appId ? { ...app, is_shortlisted: true } : app));
      
      // Update active candidate if open
      if (selectedCandidate && selectedCandidate.id === appId) {
        setSelectedCandidate((prev: any) => ({ ...prev, is_shortlisted: true }));
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to shortlist applicant.');
    }
  };

  const handleViewCandidate = (candidate: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCandidate(candidate);
    setCandidateModalVisible(true);
  };

  const filteredApplicants = shortlistedFilter 
    ? applicants.filter(a => a.is_shortlisted) 
    : applicants;

  return (
    <View style={styles.root}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* TOP HEADER SELECTOR */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Applicants</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobChips}>
          {jobs.map(job => (
            <Pressable
              key={job.id}
              onPress={() => {
                setSelectedJobId(job.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.jobChip,
                selectedJobId === job.id ? styles.jobChipActive : { backgroundColor: '#ffffff', borderColor: colors.borderMid }
              ]}
            >
              <Text style={[styles.jobChipText, selectedJobId === job.id && { color: '#ffffff' }]}>
                {job.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* CANDIDATES CONTAINER */}
      {!selectedJobId ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="users" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Select a Job Listing</Text>
          <Text style={styles.emptySub}>Select one of your job roles above to view the applicant submissions.</Text>
        </View>
      ) : loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Palette.accent500} />
          <Text style={styles.loaderText}>Loading candidates...</Text>
        </View>
      ) : applicants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="user-plus" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No applicants yet</Text>
          <Text style={styles.emptySub}>No candidates have applied to "{activeJob?.title}" yet.</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Banner Card */}
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
                  <Feather name="users" size={11} color={Palette.accent500} />
                  <Text style={styles.badgeText}>Applicants Pipeline</Text>
                </View>
                <Text style={styles.heroTitle}>Evaluate Candidates</Text>
                <Text style={styles.heroSub}>Review anonymized profiles and shortlist top performers.</Text>
              </View>
              <Image
                source={require('../../assets/images/illustrations/applicant_reviewer.png')}
                style={{ width: 80, height: 80 }}
                contentFit="contain"
              />
            </View>
          </Animated.View>

          {/* Filters Bar */}
          <View style={styles.filterBar}>
            <Pressable
              onPress={() => setShortlistedFilter(false)}
              style={[styles.filterTab, !shortlistedFilter && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, !shortlistedFilter && { color: Palette.accent600 }]}>
                All ({applicants.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setShortlistedFilter(true)}
              style={[styles.filterTab, shortlistedFilter && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, shortlistedFilter && { color: Palette.accent600 }]}>
                Shortlisted ({applicants.filter(a => a.is_shortlisted).length})
              </Text>
            </Pressable>
          </View>

          {/* List of Candidates */}
          <FlatList
            data={filteredApplicants}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={[styles.list, { paddingBottom: TabBarHeight + 32 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: app, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
                <Pressable
                  onPress={() => handleViewCandidate(app)}
                  style={({ pressed }) => [
                    styles.candidateCard,
                    { borderColor: colors.borderMid, opacity: pressed ? 0.95 : 1 }
                  ]}
                >
                  <View style={styles.cardHeader}>
                    {/* Fallback initial or Avatar */}
                    {app.avatar_url ? (
                      <View style={styles.avatarWrap}>
                        <Animated.Image source={{ uri: app.avatar_url }} style={styles.avatar} />
                      </View>
                    ) : (
                      <View style={[styles.fallbackAvatar, { backgroundColor: Palette.accent50 }]}>
                        <Text style={styles.fallbackAvatarText}>{(app.employee_name || 'C').charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    
                    <View style={styles.cardHeaderInfo}>
                      <Text style={[styles.candidateName, { color: colors.text }]} numberOfLines={1}>
                        {app.employee_name}
                      </Text>
                      <Text style={[styles.candidateTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        {app.employee_profile?.title || 'Applicant'}
                      </Text>
                    </View>

                    {app.is_shortlisted && (
                      <View style={styles.shortlistedBadge}>
                        <Feather name="star" size={10} color="#fff" />
                        <Text style={styles.shortlistedBadgeText}>Shortlisted</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.candidateBio, { color: colors.textMuted }]} numberOfLines={2}>
                    {app.employee_profile?.bio || 'No professional summary available.'}
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

                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => handleViewCandidate(app)}
                      style={[styles.viewProfileBtn, { backgroundColor: Palette.neutral100 }]}
                    >
                      <Feather name="user" size={12} color={colors.textSecondary} />
                      <Text style={[styles.viewProfileText, { color: colors.textSecondary }]}>View Profile</Text>
                    </Pressable>

                    {!app.is_shortlisted && (
                      <Pressable
                        onPress={() => handleShortlist(app.id)}
                        style={[styles.shortlistBtn, { backgroundColor: Palette.accent600 }]}
                      >
                        <Feather name="star" size={12} color="#ffffff" />
                        <Text style={styles.shortlistBtnText}>Shortlist</Text>
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            )}
          />
        </View>
      )}

      {/* DETAILED PROFILE SLIDE-UP MODAL */}
      <Modal visible={candidateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setCandidateModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Applicant Profile</Text>
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
                      <Text style={styles.largeFallbackAvatarText}>{(selectedCandidate.employee_name || 'C').charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={[styles.modalName, { color: colors.text }]}>{selectedCandidate.employee_name}</Text>
                  <Text style={[styles.modalTitleText, { color: colors.textSecondary }]}>
                    {selectedCandidate.employee_profile?.title || 'Applicant'}
                  </Text>
                  <View style={styles.expBadge}>
                    <Feather name="briefcase" size={12} color={Palette.accent600} />
                    <Text style={styles.expBadgeText}>{selectedCandidate.employee_profile?.experience_years || 0} Years Experience</Text>
                  </View>
                </View>

                {/* Candidate Details */}
                <View style={styles.modalSections}>
                  {/* Summary / Bio */}
                  {selectedCandidate.employee_profile?.bio && (
                    <View style={styles.modalSectionCard}>
                      <Text style={styles.modalSectionLabel}>Professional Summary</Text>
                      <Text style={styles.modalSectionVal}>
                        {cleanText(selectedCandidate.employee_profile.bio)}
                      </Text>
                    </View>
                  )}

                  {/* Skills */}
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

                  {/* Education */}
                  {selectedCandidate.employee_profile?.education && (
                    <View style={styles.modalSectionCard}>
                      <Text style={styles.modalSectionLabel}>Education</Text>
                      <Text style={styles.modalSectionVal}>
                        {selectedCandidate.employee_profile.education}
                      </Text>
                    </View>
                  )}

                  {/* Cover Letter */}
                  {selectedCandidate.cover_letter && (
                    <View style={styles.modalSectionCard}>
                      <Text style={styles.modalSectionLabel}>Cover Letter</Text>
                      <Text style={styles.modalSectionVal}>
                        {cleanText(selectedCandidate.cover_letter)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Footer Shortlist Action */}
                <View style={styles.modalActions}>
                  {selectedCandidate.is_shortlisted ? (
                    <View style={styles.modalShortlistedState}>
                      <Feather name="check" size={16} color={Palette.emerald600} />
                      <Text style={styles.modalShortlistedText}>Shortlisted</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => handleShortlist(selectedCandidate.id)}
                      style={[styles.modalShortlistBtn, { backgroundColor: Palette.accent600 }]}
                    >
                      <Feather name="star" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.modalShortlistBtnText}>Shortlist Applicant</Text>
                    </Pressable>
                  )}
                </View>
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
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: 'rgba(255, 251, 235, 0.95)' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, marginBottom: 12 },
  jobChips: { gap: 8, flexDirection: 'row' },
  jobChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: '#ffffff' },
  jobChipActive: { backgroundColor: Palette.accent500, borderColor: Palette.accent500 },
  jobChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral600 },

  // Loader
  loader: { paddingVertical: 128, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Palette.neutral600 },

  // Empty state
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: Palette.neutral100, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  emptySub: { fontSize: FontSize.xs, textAlign: 'center', color: Palette.neutral500, lineHeight: 18 },

  // Filters Bar
  filterBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff' },
  filterTab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: Palette.accent500 },
  filterTabText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral500 },

  // Candidates list
  list: { padding: 16, gap: 14 },
  candidateCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatarWrap: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  fallbackAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  fallbackAvatarText: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Palette.accent700 },
  cardHeaderInfo: { flex: 1, gap: 2 },
  candidateName: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  candidateTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  shortlistedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Palette.accent600, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  shortlistedBadgeText: { fontSize: 8, fontWeight: FontWeight.bold, color: '#fff' },

  candidateBio: { fontSize: FontSize.xs, lineHeight: 16 },
  
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  skillTag: { backgroundColor: Palette.neutral50, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  skillTagText: { fontSize: 9, fontWeight: FontWeight.bold, color: Palette.neutral600 },
  skillsMore: { fontSize: 10, fontWeight: FontWeight.bold, color: Palette.neutral400 },

  cardDivider: { height: 1, backgroundColor: '#f1f5f9' },

  cardActions: { flexDirection: 'row', gap: 10 },
  viewProfileBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 10 },
  viewProfileText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  shortlistBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 10 },
  shortlistBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },

  // Modal Slide Up Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: SCREEN_H * 0.8, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalHeaderTitle: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.neutral50, alignItems: 'center', justifyContent: 'center' },
  
  modalBody: { paddingHorizontal: 20, paddingTop: 16 },
  candidateOverview: { alignItems: 'center', gap: 6, marginBottom: 20 },
  largeAvatarWrap: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', marginBottom: 6 },
  largeAvatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  largeFallbackAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  largeFallbackAvatarText: { fontSize: 28, fontWeight: FontWeight.extrabold, color: Palette.accent700 },
  modalName: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  modalTitleText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  expBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.accent50, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  expBadgeText: { fontSize: 10, fontWeight: FontWeight.extrabold, color: Palette.accent600 },

  modalSections: { gap: 14 },
  modalSectionCard: { backgroundColor: Palette.neutral50, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 16, padding: 16, gap: 8 },
  modalSectionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral400, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalSectionVal: { fontSize: FontSize.xs, color: Palette.neutral700, lineHeight: 18 },

  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillsTagLarge: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  skillsTagLargeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Palette.neutral700 },

  modalActions: { marginTop: 24, paddingBottom: 16 },
  modalShortlistBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12 },
  modalShortlistBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
  modalShortlistedState: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, backgroundColor: Palette.emerald50, borderWidth: 1, borderColor: '#a7f3d0' },
  modalShortlistedText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Palette.emerald600 },

  // Hero banner
  heroCard: { borderRadius: 16, overflow: 'hidden', padding: 20, margin: 16, marginBottom: 8 },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral700 },
  heroTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: 4 },
  heroSub: { fontSize: FontSize.xs, color: Palette.neutral600, lineHeight: 16 },
});
