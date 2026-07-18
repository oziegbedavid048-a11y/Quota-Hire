import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { Colors, Palette, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';
import { worldCurrencies } from '@/constants/currencies';

const { width: SCREEN_W } = Dimensions.get('window');

const jobTemplates: Record<string, { keywords: string[]; description: string; requirements: string }> = {
  'Sales Development Representative (SDR)': {
    keywords: ['sdr', 'sales development', 'business development rep', 'bdr'],
    description: "As an SDR, you will be the engine of our pipeline. Your primary responsibility is to identify, research, and engage outbound prospects through multi-channel outreach including cold calls, personalized emails, and LinkedIn. You will qualify inbound leads and schedule meetings for Account Executives, playing a critical role in our revenue growth.",
    requirements: "0–2 years of sales or customer-facing experience\nExcellent verbal and written communication skills\nHigh energy, resilience, and coachability\nFamiliarity with CRM tools (Salesforce, HubSpot, or similar)\nAbility to manage high daily call and email volume"
  },
  'Account Executive': {
    keywords: ['account executive', 'ae ', 'ae,', 'sales executive', 'closing rep', 'quota-carrying'],
    description: "We are seeking a driven Account Executive to manage the full sales cycle from prospecting to close. You will work closely with SDRs to qualify leads, conduct deep-dive discovery calls, run product demonstrations, and negotiate contracts to drive revenue growth in your territory.",
    requirements: "3+ years of B2B SaaS sales experience\nProven track record of closing five and six-figure deals\nExperience with MEDDIC, BANT, or Challenger methodology\nStrong presentation and negotiation skills\nProficiency with Salesforce and sales engagement tools"
  },
  'Sales Manager': {
    keywords: ['sales manager', 'head of sales', 'sales lead', 'revenue manager'],
    description: "The Sales Manager will lead, coach, and inspire a team of high-performing Account Executives to exceed revenue targets. You will be responsible for pipeline management, forecasting accuracy, and developing strategies to penetrate new markets.",
    requirements: "5+ years of sales experience, 2+ in a leadership role\nProven ability to hire, train, and develop top sales talent\nDeep understanding of enterprise sales cycles\nStrong analytical skills and data-driven decision making\nExperience with CRM forecasting and pipeline management"
  },
  'Sales Associate': {
    keywords: ['sales associate', 'junior sales', 'entry level sales', 'sales rep', 'inside sales'],
    description: "As a Sales Associate, you will be the first point of contact for our potential customers. You will be responsible for identifying new business opportunities, engaging with prospects, and demonstrating the value of our products. This role requires high energy, resilience, and a passion for building relationships.",
    requirements: "1+ years of sales experience (B2B preferred)\nExcellent verbal and written communication skills\nGoal-oriented mindset with a track record of meeting quotas\nProficiency with CRM software (Salesforce, HubSpot)"
  },
  'Enterprise Account Executive': {
    keywords: ['enterprise account', 'enterprise ae', 'enterprise sales', 'strategic account'],
    description: "As an Enterprise Account Executive, you will own complex, high-value sales cycles targeting Fortune 500 and mid-market companies. You will build executive-level relationships, navigate multiple stakeholders, and close transformational deals that shape our company's growth trajectory.",
    requirements: "5+ years of enterprise B2B sales experience\nTrack record of closing $250K+ ARR deals\nExperience selling to C-suite and VP-level buyers\nProficiency with complex deal structuring and procurement\nKnowledge of MEDDIC, Command of the Message, or similar enterprise methodology"
  },
  'VP of Sales': {
    keywords: ['vp of sales', 'vice president sales', 'vp sales', 'head of revenue'],
    description: "The VP of Sales will define and execute our go-to-market strategy, build and scale a world-class sales organization, and partner with executive leadership to achieve aggressive growth targets. You will be responsible for revenue planning, team structure, and overall sales culture.",
    requirements: "8+ years of progressive B2B sales experience\n4+ years leading and scaling sales teams\nProven track record of exceeding $10M+ ARR targets\nExperience building sales processes from the ground up\nStrong executive presence and board-level communication skills"
  },
};

const findMatchingTemplate = (title: string): string | null => {
  if (!title || title.trim().length < 3) return null;
  const lower = title.toLowerCase();
  for (const [templateName, data] of Object.entries(jobTemplates)) {
    const allKeywords = [templateName.toLowerCase(), ...data.keywords];
    if (allKeywords.some(kw => lower.includes(kw) || kw.includes(lower))) {
      return templateName;
    }
  }
  return null;
};

const PACKAGES = [
  {
    id: 'pipeline',
    title: 'QUOTA HIRE PIPELINE',
    subtitle: 'Recruit Sales Associate Only',
    bestFor: 'You have Sales Manager + CRM + training',
    weDo: 'Source, vet, test, shortlist 5-7 closers. You interview + hire + manage.',
    youDo: 'Onboarding, training, daily management, payroll',
    promise: 'We fill your pipeline with vetted closers. You manage.',
    fee: '1. Base salary: 15% of 1st year base.\n2. Commission-only: 20% of 1-month OTE.',
    guarantee: '90-day free replacement'
  },
  {
    id: 'hunters',
    title: 'QUOTA HIRE COMMISSION HUNTERS',
    subtitle: 'Commission-Only Specialist',
    bestFor: '100% commission pay. No base budget',
    weDo: 'Pipeline vetting + commission mindset test + cold call roleplay',
    youDo: 'Management + targets',
    promise: 'Hunters who sell without base salary.',
    fee: '20% of expected 1-month OTE per hire',
    guarantee: '60-day replacement'
  },
  {
    id: 'sales_ops',
    title: 'QUOTA HIRE SALES OPS',
    subtitle: 'Recruit + Manage Full Sales Team',
    bestFor: 'You want revenue without hiring a Sales Manager',
    weDo: 'Everything in Pipeline + daily management, scripts, KPI tracking, weekly coaching, pipeline reviews, monthly reports',
    youDo: 'Pay rep commission, product training, approve targets',
    promise: 'We hire + manage. You collect revenue.',
    fee: '1. Setup: 10% base or 20% 1-month OTE.\n2. Monthly: 10% base/rep.\n3. Bonus: 4% team comm.',
    guarantee: 'Free replacement <60 days.'
  }
];

export default function CompanyPostJob() {
  const colors = Colors.light;
  const router = useRouter();
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestedTemplate, setSuggestedTemplate] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [isRemote, setIsRemote] = useState(true);
  const [location, setLocation] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [salaryRange, setSalaryRange] = useState('');
  const [commissionRange, setCommissionRange] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  // Auto load company info on mount
  useEffect(() => {
    apiFetch('/auth/me/').then((u) => {
      setContactEmail(u.email || '');
      setCompanyName(u.companyName || u.name || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const match = findMatchingTemplate(title);
    setSuggestedTemplate(match || null);
  }, [title]);

  const applyTemplate = () => {
    if (suggestedTemplate) {
      setDescription(jobTemplates[suggestedTemplate].description);
      setRequirements(jobTemplates[suggestedTemplate].requirements);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Validations
    if (step === 1) {
      if (!companyName.trim() || !contactEmail.trim() || !companyAddress.trim()) {
        Alert.alert('Required Fields', 'Please fill Company Name, Email, and Address.');
        return;
      }
      if (!isRemote && !location.trim()) {
        Alert.alert('Required Fields', 'Please enter a State/City location for non-remote roles.');
        return;
      }
    } else if (step === 2) {
      if (!title.trim() || !description.trim() || !requirements.trim()) {
        Alert.alert('Required Fields', 'Please fill Job Title, Description, and Requirements.');
        return;
      }
    }
    
    setStep(step + 1);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedPackage) {
      Alert.alert('Package Required', 'Please select a service package to post this job.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const payload = {
      title,
      description,
      requirements: requirements.split('\n').filter((r) => r.trim() !== ''),
      employment_type: 'Full-time',
      isRemote,
      location: isRemote ? 'Remote' : location,
      salaryRange,
      commissionRange,
      currency,
      contactEmail,
      contactPhone,
      whatsappNumber,
      companyAddress,
      companyName,
      package: selectedPackage,
    };

    try {
      await apiFetch('/jobs/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Job posted successfully! It will be listed once reviewed.', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    } catch (err: any) {
      Alert.alert('Post Failed', err?.message || 'Unable to post job at this time.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrencyObj = worldCurrencies.find(c => c.code === currency) || worldCurrencies[0];

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
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero banner summary */}
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
                <Feather name="briefcase" size={11} color={Palette.accent500} />
                <Text style={styles.badgeText}>Recruiter Workflow</Text>
              </View>
              <Text style={styles.heroTitle}>Post a New Role</Text>
              <Text style={styles.heroSub}>Find and recruit sales superstars in simple guided steps.</Text>
            </View>
            <Image
              source={require('../../assets/images/illustrations/post_job_recruiter.png')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* Progress Tracker (Steps 1, 2, 3) */}
        {step > 0 && step < 4 && (
          <View style={styles.progressRow}>
            {[
              { id: 1, label: 'Basics' },
              { id: 2, label: 'Details' },
              { id: 3, label: 'Review' },
            ].map((s) => (
              <View key={s.id} style={styles.progressStep}>
                <View style={[
                  styles.progressDot,
                  { backgroundColor: step >= s.id ? Palette.accent500 : '#ffffff', borderColor: step >= s.id ? Palette.accent500 : '#cbd5e1' }
                ]}>
                  {step > s.id ? (
                    <Feather name="check" size={12} color="#fff" />
                  ) : (
                    <Text style={[styles.progressDotText, { color: step >= s.id ? '#fff' : '#64748b' }]}>{s.id}</Text>
                  )}
                </View>
                <Text style={[styles.progressLabel, { color: step >= s.id ? colors.text : colors.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Form Sections */}
        <View style={styles.formCard}>
          {step === 0 && (
            <Animated.View key="step0" entering={FadeInDown.springify()} style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>Our Recruitment Packages</Text>
              <Text style={styles.sectionSub}>Review our service structures before entering job basics.</Text>
              {PACKAGES.map((pkg) => (
                <View key={pkg.id} style={styles.pkgCard}>
                  <Text style={styles.pkgTitle}>{pkg.title}</Text>
                  <Text style={styles.pkgSubtitle}>{pkg.subtitle}</Text>
                  <Text style={styles.pkgText}><Text style={{ fontWeight: 'bold' }}>Best For:</Text> {pkg.bestFor}</Text>
                  <Text style={styles.pkgText}><Text style={{ fontWeight: 'bold' }}>We Do:</Text> {pkg.weDo}</Text>
                  <Text style={styles.pkgText}><Text style={{ fontWeight: 'bold' }}>You Do:</Text> {pkg.youDo}</Text>
                  <Text style={styles.pkgText}><Text style={{ fontWeight: 'bold' }}>Promise:</Text> {pkg.promise}</Text>
                  <Text style={styles.pkgText}><Text style={{ fontWeight: 'bold' }}>Fee:</Text> {pkg.fee}</Text>
                  <Text style={[styles.pkgText, { color: Palette.emerald600 }]}><Text style={{ fontWeight: 'bold' }}>Guarantee:</Text> {pkg.guarantee}</Text>
                </View>
              ))}
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View key="step1" entering={FadeInDown.springify()} style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>Basics & Privacy Info</Text>
              
              <View style={styles.infoAlert}>
                <Feather name="shield" size={16} color={Palette.blue600} style={{ marginRight: 6 }} />
                <Text style={styles.infoAlertText}>Your email, phone, and address are kept private. Applicants only see the job code.</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Company Name</Text>
                <TextInput value={companyName} onChangeText={setCompanyName} placeholder="Acme Corp" style={styles.input} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Contact Email (Confidential)</Text>
                <TextInput value={contactEmail} onChangeText={setContactEmail} placeholder="hiring@company.com" keyboardType="email-address" style={styles.input} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Contact Phone (Confidential)</Text>
                <TextInput value={contactPhone} onChangeText={setContactPhone} placeholder="+1 555 123 4567" keyboardType="phone-pad" style={styles.input} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>WhatsApp Number</Text>
                <TextInput value={whatsappNumber} onChangeText={setWhatsappNumber} placeholder="+1 555 123 4567" keyboardType="phone-pad" style={styles.input} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Company Address (Confidential)</Text>
                <TextInput value={companyAddress} onChangeText={setCompanyAddress} placeholder="e.g. 10 Marina Street, Lagos" style={styles.input} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Workplace Type</Text>
                <View style={styles.toggleRow}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsRemote(true);
                    }}
                    style={[styles.toggleBtn, isRemote && styles.toggleActive]}
                  >
                    <Text style={[styles.toggleText, isRemote && styles.toggleActiveText]}>🌍 Remote</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsRemote(false);
                    }}
                    style={[styles.toggleBtn, !isRemote && styles.toggleActive]}
                  >
                    <Text style={[styles.toggleText, !isRemote && styles.toggleActiveText]}>🏢 On-Site / Hybrid</Text>
                  </Pressable>
                </View>
              </View>

              {!isRemote && (
                <View style={styles.field}>
                  <Text style={styles.label}>Job Location State</Text>
                  <TextInput value={location} onChangeText={setLocation} placeholder="e.g. Lagos, Nigeria" style={styles.input} />
                </View>
              )}
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View key="step2" entering={FadeInDown.springify()} style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>Job Details</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Job Title</Text>
                <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Enterprise Account Executive" style={styles.input} />
              </View>

              {suggestedTemplate && (
                <View style={styles.templateAlert}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.templateAlertTitle}>💡 Smart template matches title: {suggestedTemplate}</Text>
                    <Text style={styles.templateAlertSub}>Do you want to pre-fill descriptions & requirements?</Text>
                  </View>
                  <Pressable onPress={applyTemplate} style={styles.templateBtn}>
                    <Text style={styles.templateBtnText}>Apply</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Currency (e.g. USD, EUR, NGN)</Text>
                <TextInput value={currency} onChangeText={setCurrency} placeholder="USD" style={styles.input} autoCapitalize="characters" />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Salary Range</Text>
                <TextInput value={salaryRange} onChangeText={setSalaryRange} placeholder={`e.g. ${selectedCurrencyObj.symbol}80k - ${selectedCurrencyObj.symbol}120k Base`} style={styles.input} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Commission Range</Text>
                <TextInput value={commissionRange} onChangeText={setCommissionRange} placeholder={`e.g. ${selectedCurrencyObj.symbol}40k OTE`} style={styles.input} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Job Description</Text>
                <TextInput value={description} onChangeText={setDescription} placeholder="Describe the day-to-day responsibilities..." multiline numberOfLines={5} style={styles.textarea} />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Requirements (One per line)</Text>
                <TextInput value={requirements} onChangeText={setRequirements} placeholder="3+ years sales experience&#10;Track record of meeting targets" multiline numberOfLines={5} style={styles.textarea} />
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View key="step3" entering={FadeInDown.springify()} style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>Review Job Listing</Text>
              
              <View style={styles.reviewGroup}>
                <Text style={styles.reviewLabel}>Job Title</Text>
                <Text style={styles.reviewVal}>{title}</Text>
              </View>

              <View style={styles.reviewGroup}>
                <Text style={styles.reviewLabel}>Location</Text>
                <Text style={styles.reviewVal}>{isRemote ? 'Remote' : location}</Text>
              </View>

              <View style={styles.reviewGroup}>
                <Text style={styles.reviewLabel}>Salary Range</Text>
                <Text style={styles.reviewVal}>{salaryRange || 'Not specified'}</Text>
              </View>

              <View style={styles.reviewGroup}>
                <Text style={styles.reviewLabel}>Commission Range</Text>
                <Text style={styles.reviewVal}>{commissionRange || 'Not specified'}</Text>
              </View>

              <View style={styles.reviewGroup}>
                <Text style={styles.reviewLabel}>Description</Text>
                <Text style={styles.reviewValSub}>{description}</Text>
              </View>
            </Animated.View>
          )}

          {step === 4 && (
            <Animated.View key="step4" entering={FadeInDown.springify()} style={styles.stepContainer}>
              <Text style={styles.sectionHeading}>Select Recruitment Package</Text>
              <Text style={styles.sectionSub}>Choose the structure that matches your hiring plan.</Text>
              
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPackage === pkg.id;
                return (
                  <Pressable
                    key={pkg.id}
                    onPress={() => {
                      setSelectedPackage(pkg.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.pkgSelectCard, isSelected && styles.pkgSelectCardActive]}
                  >
                    <View style={styles.pkgSelectHeader}>
                      <Text style={[styles.pkgSelectTitle, isSelected && { color: Palette.accent600 }]}>{pkg.title}</Text>
                      {isSelected && <Feather name="check-circle" size={18} color={Palette.accent600} />}
                    </View>
                    <Text style={styles.pkgSubtitle}>{pkg.subtitle}</Text>
                    <Text style={[styles.pkgText, { marginTop: 8 }]}><Text style={{ fontWeight: 'bold' }}>Promise:</Text> {pkg.promise}</Text>
                    <Text style={styles.pkgText}><Text style={{ fontWeight: 'bold' }}>Fee Structure:</Text> {pkg.fee}</Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* Action Row */}
          <View style={styles.actionRow}>
            {step > 0 ? (
              <Pressable onPress={handleBack} style={styles.backBtn}>
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {step < 4 ? (
              <Pressable onPress={handleNext} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>{step === 0 ? 'Start Post Job' : 'Next'}</Text>
              </Pressable>
            ) : (
              <Pressable disabled={loading} onPress={handleSubmit} style={[styles.submitBtn, { backgroundColor: loading ? '#94a3b8' : Palette.accent500 }]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post Role</Text>}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 64 },
  
  // Hero
  heroCard: { borderRadius: 16, overflow: 'hidden', padding: 20, marginBottom: 16 },
  heroContent: { flexDirection: 'row', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral700 },
  heroTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: 4 },
  heroSub: { fontSize: FontSize.xs, color: Palette.neutral600, lineHeight: 16 },

  // Progress Tracker
  progressRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginVertical: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  progressStep: { alignItems: 'center', gap: 4 },
  progressDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  progressDotText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  progressLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // Form Container
  formCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 16 },
  stepContainer: { gap: 16 },
  sectionHeading: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: Palette.neutral900 },
  sectionSub: { fontSize: FontSize.xs, color: Palette.neutral500, marginTop: -8 },

  // Input Fields
  field: { gap: 6 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral600 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: FontSize.sm, color: Palette.neutral800, backgroundColor: '#f8fafc' },
  textarea: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: FontSize.sm, color: Palette.neutral800, backgroundColor: '#f8fafc', height: 100, textAlignVertical: 'top' },
  
  // Toggle Row
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  toggleActive: { borderColor: Palette.accent500, backgroundColor: Palette.accent50 },
  toggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Palette.neutral600 },
  toggleActiveText: { color: Palette.accent700 },

  // Info Alerts
  infoAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.blue50, borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 10, padding: 10 },
  infoAlertText: { flex: 1, fontSize: 11, color: Palette.blue600, lineHeight: 15 },
  
  templateAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.warm50, borderWidth: 1, borderColor: '#fde68a', borderRadius: 10, padding: 10, gap: 10 },
  templateAlertTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.warm700 },
  templateAlertSub: { fontSize: 10, color: Palette.warm700, marginTop: 2 },
  templateBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: Palette.warm500 },
  templateBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#fff' },

  // Review Summary
  reviewGroup: { gap: 4, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  reviewLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral400, textTransform: 'uppercase' },
  reviewVal: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Palette.neutral800 },
  reviewValSub: { fontSize: FontSize.xs, color: Palette.neutral600, lineHeight: 18 },

  // Service Packages Cards
  pkgCard: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 14, gap: 6 },
  pkgTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Palette.neutral800 },
  pkgSubtitle: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.accent600 },
  pkgText: { fontSize: FontSize.xs, color: Palette.neutral600, lineHeight: 16 },

  // Service Packages Selection
  pkgSelectCard: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, gap: 4 },
  pkgSelectCardActive: { borderColor: Palette.accent500, backgroundColor: Palette.accent50 },
  pkgSelectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pkgSelectTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Palette.neutral800 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  backBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Palette.neutral600 },
  nextBtn: { flex: 1.5, height: 44, borderRadius: 10, backgroundColor: Palette.neutral900, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
  submitBtn: { flex: 1.5, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },
});
