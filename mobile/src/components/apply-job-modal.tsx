import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';
import { Job } from '@/hooks/useEmployeeDashboardData';
import CVWizardModal from '@/components/cv-wizard-modal';
import { SearchablePickerModal, PickerItem } from './searchable-picker-modal';
import {
  getAllCountries,
  getCountryByName,
  getCitiesForCountry,
  extractSubscriberNumber,
} from '@/constants/countries-data';

const { height: SCREEN_H } = Dimensions.get('window');

interface ApplyJobModalProps {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
  onSuccess: () => void;
}

type Step = 'contact' | 'transition' | 'resume' | 'success';

export default function ApplyJobModal({ visible, onClose, job, onSuccess }: ApplyJobModalProps) {
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  const [step, setStep] = useState<Step>('contact');
  const [progress, setProgress] = useState(0);
  const [isContinuing, setIsContinuing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCvs, setLoadingCvs] = useState(false);
  const [savedCvs, setSavedCvs] = useState<any[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
  const [cvWizardVisible, setCvWizardVisible] = useState(false);
  const continueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUserCvs = () => {
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
      .catch(() => {
        Alert.alert(
          'Error',
          'Something went wrong loading your CVs. Please try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: fetchUserCvs }
          ]
        );
      })
      .finally(() => setLoadingCvs(false));
  };

  const handleCVGeneratedSuccess = () => {
    fetchUserCvs();
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

  // Country & City pickers
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const selectedCountryData = React.useMemo(() => getCountryByName(form.country), [form.country]);

  const countryPickerItems: PickerItem[] = React.useMemo(() => {
    return getAllCountries().map(c => ({
      label: c.name,
      value: c.name,
      flag: c.flag,
      badge: c.dialCode,
      subtitle: `${c.code} • ${c.dialCode}`,
    }));
  }, []);

  const cityPickerItems: PickerItem[] = React.useMemo(() => {
    if (!form.country) return [];
    const cities = getCitiesForCountry(form.country);
    return cities.map(city => ({
      label: city,
      value: city,
      subtitle: form.country,
    }));
  }, [form.country]);

  const handleSelectCountry = (item: PickerItem) => {
    const country = getCountryByName(item.value);
    const dialCode = country?.dialCode || '';
    const existingSubscriber = extractSubscriberNumber(form.phoneNumber, dialCode);
    const newPhone = dialCode ? (existingSubscriber ? `${dialCode} ${existingSubscriber}` : `${dialCode} `) : form.phoneNumber;

    setForm(f => ({
      ...f,
      country: item.value,
      city: '',
      phoneNumber: newPhone,
    }));
  };

  const handleSelectCity = (item: PickerItem) => {
    setForm(f => ({ ...f, city: item.value }));
  };

  const handlePressCity = () => {
    if (!form.country) {
      Alert.alert('Select Country First', 'Please choose your country before selecting a city.', [
        { text: 'Select Country', onPress: () => setShowCountryPicker(true) },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setShowCityPicker(true);
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (continueTimeoutRef.current) clearTimeout(continueTimeoutRef.current);
    };
  }, []);

  // Load user profile to prefill contact details
  useEffect(() => {
    if (visible) {
      setStep('contact');
      setProgress(0);
      setIsContinuing(false);
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
      fetchUserCvs();
    }
  }, [step]);

  const handleContinue = () => {
    if (isContinuing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsContinuing(true);
    
    // Show rolling animation on continue button for 1.2s before progressing
    continueTimeoutRef.current = setTimeout(() => {
      setIsContinuing(false);
      setStep('transition');
      
      // Animate transition progress bar (matching web)
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setStep('resume'), 250);
        }
      }, 35);
    }, 1200);
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;
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
      Alert.alert(
        'Submission Failed',
        'Something went wrong submitting your application. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleFinalSubmit }
        ]
      );
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
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.keyboardWrapper}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <Animated.View
            entering={SlideInDown.springify()}
            exiting={SlideOutDown}
            style={[
              s.sheet,
              {
                backgroundColor: colors.cardBg,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            {/* Header */}
            <View style={[s.header, { borderBottomColor: colors.border }]}>
              <Text style={[s.headerTitle, { color: colors.text }]}>Apply to {job.companyName}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                style={s.closeButton}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
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

            {/* Body Content with full scrollability & persisted taps */}
            <ScrollView
              style={s.body}
              contentContainerStyle={{ paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
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

                  <View style={s.rowFields}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.label, { color: colors.textSecondary }]}>Country</Text>
                      <Pressable
                        onPress={() => setShowCountryPicker(true)}
                        style={[s.selectBox, { borderColor: colors.border }]}
                      >
                        <Text style={[s.selectBoxText, { color: form.country ? colors.text : colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                          {selectedCountryData?.flag ? `${selectedCountryData.flag} ` : ''}{form.country || 'Select Country'}
                        </Text>
                        <Feather name="chevron-down" size={14} color={colors.textMuted} />
                      </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.label, { color: colors.textSecondary }]}>City</Text>
                      <Pressable
                        onPress={handlePressCity}
                        style={[s.selectBox, { borderColor: colors.border }]}
                      >
                        <Text style={[s.selectBoxText, { color: form.city ? colors.text : colors.textMuted }]} numberOfLines={1} ellipsizeMode="tail">
                          {form.city || (form.country ? 'Select City' : 'Pick Country first')}
                        </Text>
                        <Feather name="chevron-down" size={14} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={s.inputRow}>
                    <Text style={[s.label, { color: colors.textSecondary }]}>Phone Number</Text>
                    <TextInput
                      value={form.phoneNumber}
                      onChangeText={t => setForm(f => ({ ...f, phoneNumber: t }))}
                      keyboardType="phone-pad"
                      placeholder={selectedCountryData ? `${selectedCountryData.dialCode} 000 000 0000` : "+1 555 000 0000"}
                      placeholderTextColor={colors.textMuted}
                      style={[s.input, { borderColor: colors.border, color: colors.text }]}
                    />
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
                    disabled={!isContactValid || isContinuing}
                    onPress={handleContinue}
                    style={({ pressed }) => [
                      s.actionBtn,
                      { backgroundColor: (isContactValid && !isContinuing) ? Palette.accent600 : (isContinuing ? Palette.accent600 : Palette.neutral200) },
                      pressed && isContactValid && { opacity: 0.8 },
                    ]}
                  >
                    {isContinuing ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={[s.actionBtnText, { color: '#fff' }]}>Processing...</Text>
                      </View>
                    ) : (
                      <Text style={[s.actionBtnText, { color: isContactValid ? '#fff' : Palette.neutral400 }]}>
                        Continue
                      </Text>
                    )}
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={s.actionBtnText}>Submitting...</Text>
                      </View>
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
          job={job}
          onSuccess={handleCVGeneratedSuccess}
        />

        <SearchablePickerModal
          visible={showCountryPicker}
          onClose={() => setShowCountryPicker(false)}
          title="Select Country"
          placeholder="Search country..."
          items={countryPickerItems}
          selectedValue={form.country}
          onSelect={handleSelectCountry}
          emptyMessage="No countries found"
        />

        <SearchablePickerModal
          visible={showCityPicker}
          onClose={() => setShowCityPicker(false)}
          title={`Select City (${form.country || ""})`}
          placeholder="Search city..."
          items={cityPickerItems}
          selectedValue={form.city}
          onSelect={handleSelectCity}
          emptyMessage={`No standard cities found for ${form.country}`}
          allowCustom={true}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  keyboardWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    margin: 0,
    padding: 0,
  },
  sheet: {
    borderTopLeftRadius: BorderRadius.cardLg,
    borderTopRightRadius: BorderRadius.cardLg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: SCREEN_H * 0.88,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingTop: 8,
    marginBottom: 0,
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
  closeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 0,
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
  selectBox: {
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxText: {
    fontSize: 13,
    flex: 1,
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
