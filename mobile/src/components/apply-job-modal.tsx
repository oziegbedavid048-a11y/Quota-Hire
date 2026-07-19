import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';
import { Job } from '@/hooks/useEmployeeDashboardData';
import CVWizardModal from '@/components/cv-wizard-modal';

const { height: SCREEN_H } = Dimensions.get('window');

interface ApplyJobModalProps {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
  onSuccess: () => void;
}

type Step = 'contact' | 'transition' | 'resume' | 'success';

export default function ApplyJobModal({ visible, onClose, job, onSuccess }: ApplyJobModalProps) {
  const colors = Colors.light;

  const [step, setStep] = useState<Step>('contact');
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCvs, setLoadingCvs] = useState(false);
  const [savedCvs, setSavedCvs] = useState<any[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
  const [cvWizardVisible, setCvWizardVisible] = useState(false);

  const handleCVGeneratedSuccess = () => {
    setLoadingCvs(true);
    apiFetch('/cv/my-cvs/')
      .then(res => {
        const cvs = Array.isArray(res) ? res : (res?.results || []);
        setSavedCvs(cvs);
        if (cvs.length > 0) {
          const sorted = [...cvs].sort((a, b) => Number(b.id) - Number(a.id));
          setSelectedCvId(sorted[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCvs(false));
  };

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    country: '',
    city: '',
    postalCode: '',
    streetAddress: '',
    phoneNumber: '',
  });

  // Load user profile to prefill contact details
  useEffect(() => {
    if (visible) {
      setStep('contact');
      setProgress(0);
      setSelectedCvId(null);
      apiFetch('/auth/me/')
        .then(u => {
          setForm({
            fullName: u.name || u.first_name || '',
            country: u.location?.split(',')[1]?.trim() || '',
            city: u.location?.split(',')[0]?.trim() || '',
            postalCode: '',
            streetAddress: '',
            phoneNumber: u.phone || '',
          });
        })
        .catch(() => {});
    }
  }, [visible]);

  // Load generated CVs when reaching the resume selection step
  useEffect(() => {
    if (step === 'resume') {
      setLoadingCvs(true);
      apiFetch('/cv/my-cvs/')
        .then(res => {
          setSavedCvs(Array.isArray(res) ? res : (res?.results || []));
        })
        .catch(() => {})
        .finally(() => setLoadingCvs(false));
    }
  }, [step]);

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('transition');
    
    // Animate transition progress bar (matching web)
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep('resume'), 300);
      }
    }, 40);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      // 1. Save updated profile information first (matching web)
      await apiFetch('/profile/employee/', {
        method: 'PUT',
        body: JSON.stringify({
          phone_number: form.phoneNumber,
          country: form.country,
          city: form.city,
          postal_code: form.postalCode,
          street_address: form.streetAddress,
        }),
      });

      // 2. Submit the job application
      await apiFetch(`/jobs/${job?.id}/apply/`, {
        method: 'POST',
        body: JSON.stringify({
          cover_letter: '',
          generated_cv_id: selectedCvId || undefined,
        }),
      });

      setStep('success');
      onSuccess();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert('Application failed. Please try again.');
      setStep('resume');
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) return null;

  const isContactValid = Boolean(
    form.fullName.trim() &&
    form.phoneNumber.trim() &&
    form.country.trim() &&
    form.city.trim() &&
    form.postalCode.trim() &&
    form.streetAddress.trim()
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown} style={[s.sheet, { backgroundColor: colors.cardBg }]}>
          {/* Header */}
          <View style={[s.header, { borderBottomColor: colors.border }]}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Apply to {job.companyName}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Feather name="x" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Job summary bar */}
          <View style={[s.jobBar, { backgroundColor: Palette.neutral50 }]}>
            <View style={[s.companyBadge, { backgroundColor: Palette.neutral100 }]}>
              <Text style={[s.companyBadgeText, { color: colors.text }]}>
                {(job.companyName || 'C').charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.jobTitle, { color: colors.text }]} numberOfLines={1}>{job.title}</Text>
              <Text style={[s.jobMeta, { color: colors.textMuted }]}>{job.companyName} • {job.location}</Text>
            </View>
          </View>

          {/* Body Content */}
          <ScrollView style={s.body} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {step === 'contact' && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>Contact Details</Text>
                <Text style={[s.sectionSub, { color: colors.textMuted }]}>
                  Please fill in your current contact details for this application.
                </Text>

                <View style={s.inputRow}>
                  <Text style={[s.label, { color: colors.textSecondary }]}>Full Name</Text>
                  <TextInput
                    value={form.fullName}
                    onChangeText={t => setForm(f => ({ ...f, fullName: t }))}
                    style={[s.input, { borderColor: colors.border, color: colors.text }]}
                  />
                </View>

                <View style={s.inputRow}>
                  <Text style={[s.label, { color: colors.textSecondary }]}>Phone Number</Text>
                  <TextInput
                    value={form.phoneNumber}
                    onChangeText={t => setForm(f => ({ ...f, phoneNumber: t }))}
                    keyboardType="phone-pad"
                    style={[s.input, { borderColor: colors.border, color: colors.text }]}
                  />
                </View>

                <View style={s.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>Country</Text>
                    <TextInput
                      value={form.country}
                      onChangeText={t => setForm(f => ({ ...f, country: t }))}
                      style={[s.input, { borderColor: colors.border, color: colors.text }]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>City</Text>
                    <TextInput
                      value={form.city}
                      onChangeText={t => setForm(f => ({ ...f, city: t }))}
                      style={[s.input, { borderColor: colors.border, color: colors.text }]}
                    />
                  </View>
                </View>

                <View style={s.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>Postal Code</Text>
                    <TextInput
                      value={form.postalCode}
                      onChangeText={t => setForm(f => ({ ...f, postalCode: t }))}
                      style={[s.input, { borderColor: colors.border, color: colors.text }]}
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>Street Address</Text>
                    <TextInput
                      value={form.streetAddress}
                      onChangeText={t => setForm(f => ({ ...f, streetAddress: t }))}
                      style={[s.input, { borderColor: colors.border, color: colors.text }]}
                    />
                  </View>
                </View>

                <Pressable
                  disabled={!isContactValid}
                  onPress={handleContinue}
                  style={({ pressed }) => [
                    s.actionBtn,
                    { backgroundColor: isContactValid ? Palette.accent600 : Palette.neutral200 },
                    pressed && isContactValid && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[s.actionBtnText, { color: isContactValid ? '#fff' : Palette.neutral400 }]}>
                    Continue
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {step === 'transition' && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={s.centerContainer}>
                <ActivityIndicator size="large" color={Palette.accent500} />
                <Text style={[s.transitionText, { color: colors.text }]}>Saving your details...</Text>
                <View style={[s.progressBarBg, { backgroundColor: Palette.neutral100 }]}>
                  <View style={[s.progressBarFill, { width: `${progress}%`, backgroundColor: Palette.accent500 }]} />
                </View>
              </Animated.View>
            )}

            {step === 'resume' && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={s.stepContainer}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>Select Resume / CV</Text>
                <Text style={[s.sectionSub, { color: colors.textMuted }]}>
                  Choose which CV to submit with your job application.
                </Text>

                {loadingCvs ? (
                  <ActivityIndicator size="small" color={Palette.accent500} style={{ marginVertical: 20 }} />
                ) : savedCvs.length === 0 ? (
                  <View style={{ gap: 12 }}>
                    <View style={s.noCvWrap}>
                      <Text style={[s.noCvText, { color: colors.textMuted }]}>
                        No generated CVs found on your profile. Your default uploaded resume will be used.
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setCvWizardVisible(true)}
                      style={({ pressed }) => [
                        s.generateCvBtn,
                        { borderColor: Palette.accent600 },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Feather name="plus-circle" size={14} color={Palette.accent600} />
                      <Text style={s.generateCvBtnText}>Generate Resume for this Role</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ gap: 10, marginVertical: 10 }}>
                    {savedCvs.map(cv => {
                      const selected = selectedCvId === cv.id;
                      return (
                        <Pressable
                          key={cv.id}
                          onPress={() => setSelectedCvId(cv.id)}
                          style={[
                            s.cvOption,
                            {
                              borderColor: selected ? Palette.accent500 : colors.border,
                              backgroundColor: selected ? Palette.accent50 : colors.cardBg,
                            },
                          ]}
                        >
                          <Feather name="file-text" size={16} color={selected ? Palette.accent600 : colors.textMuted} />
                          <Text style={[s.cvOptionText, { color: selected ? Palette.accent700 : colors.text }]}>
                            {cv.target_role || cv.template_name || `CV #${cv.id}`}
                          </Text>
                          {selected && <Feather name="check" size={16} color={Palette.accent600} style={{ marginLeft: 'auto' }} />}
                        </Pressable>
                      );
                    })}

                    <Pressable
                      onPress={() => setCvWizardVisible(true)}
                      style={({ pressed }) => [
                        s.generateCvBtn,
                        { borderColor: Palette.accent600, marginTop: 6 },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Feather name="plus-circle" size={14} color={Palette.accent600} />
                      <Text style={s.generateCvBtnText}>Generate Tailored Resume for this Role</Text>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  disabled={submitting}
                  onPress={handleFinalSubmit}
                  style={({ pressed }) => [
                    s.actionBtn,
                    { backgroundColor: Palette.accent600 },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={s.actionBtnText}>Submit Application</Text>
                  )}
                </Pressable>
              </Animated.View>
            )}

            {step === 'success' && (
              <Animated.View entering={FadeIn} style={s.centerContainer}>
                <View style={[s.successIconWrap, { backgroundColor: Palette.emerald50 }]}>
                  <Feather name="check-circle" size={48} color={Palette.emerald500} />
                </View>
                <Text style={[s.sectionTitle, { color: colors.text, textAlign: 'center', marginTop: 16 }]}>
                  Application Submitted!
                </Text>
                <Text style={[s.sectionSub, { color: colors.textMuted, textAlign: 'center', marginHorizontal: 20 }]}>
                  Your application has been delivered to the hiring team. You can track its status inside the Applications Tracker tab.
                </Text>

                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    s.actionBtn,
                    { backgroundColor: Palette.neutral900, marginTop: 24, width: '80%' },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={s.actionBtnText}>Done</Text>
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>

      <CVWizardModal
        visible={cvWizardVisible}
        onClose={() => setCvWizardVisible(false)}
        templateType="standard"
        prefilledHeadline={job.title}
        onSuccess={handleCVGeneratedSuccess}
      />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.cardLg,
    borderTopRightRadius: BorderRadius.cardLg,
    maxHeight: SCREEN_H * 0.85,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
  },
  jobBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  companyBadge: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyBadgeText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
  },
  jobTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  jobMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  body: {
    padding: 20,
  },
  stepContainer: {
    gap: 14,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  sectionSub: {
    fontSize: FontSize.xs,
    lineHeight: 18,
    marginBottom: 8,
  },
  inputRow: {
    gap: 6,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  actionBtn: {
    height: 44,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  actionBtnText: {
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  transitionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginTop: 8,
  },
  progressBarBg: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  noCvWrap: {
    padding: 16,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.neutral50,
  },
  noCvText: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  cvOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 10,
  },
  cvOptionText: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateCvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
  },
  generateCvBtnText: {
    color: Palette.accent600,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
