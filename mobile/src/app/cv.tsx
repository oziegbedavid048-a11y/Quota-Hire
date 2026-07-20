/**
 * Quota Hire — CV Generator Screen (Mobile)
 * EXACT visual clone of src/pages/employee/CVGeneratorPage.tsx
 *
 * - Hero: floating resume_3d illustration + AI badge + headline
 * - Two CV cards: Standard CV + Europe CV — clicking opens wizard
 * - Info strip: "Your CVs are saved automatically"
 *
 * Tapping "Start" opens a 100% native in-app CVWizardModal, running
 * entirely on device, generating clean PDF documents natively and saving them.
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

import CompanyApplicants from '@/components/company-applicants';
import { HapticPressable } from '@/components/haptic-pressable';
import {
  Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight, TabBarHeight,
} from '@/constants/theme';
import CVWizardModal from '@/components/cv-wizard-modal';

const CV_CARDS = [
  {
    id: 'standard',
    title: 'Generate Standard CV',
    description: "Professional multi-template CV. Answer a few questions about your experience, skills and goals — we'll generate a polished, downloadable PDF tailored to you.",
    icon: 'file-text' as const,
    gradFrom: '#116108',
    gradTo:   '#72dd15',
  },
  {
    id: 'europass',
    title: 'Generate Europe CV',
    badge: 'EU Style',
    description: 'Create an official Europe-formatted CV, including CEFR language levels, digital skills, and your passport photo.',
    icon: 'globe' as const,
    gradFrom: '#15750a',
    gradTo:   '#72dd15',
  },
] as const;

export default function CVScreen() {
  const colors = Colors.light;
  
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync('user_role').then(r => setRole(r || 'employee'));
  }, []);

  const [wizardVisible, setWizardVisible] = useState(false);
  const [templateType, setTemplateType]   = useState<'standard' | 'europass'>('standard');

  const openWizard = (type: 'standard' | 'europass') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTemplateType(type);
    setWizardVisible(true);
  };

  if (role === 'company') {
    return <CompanyApplicants />;
  }

  return (
    <View style={s.root}>
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: TabBarHeight + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── HERO BANNER (matches web: accent/white/warm gradient + 3D resume img + AI badge) ── */}
        <Animated.View entering={FadeInDown.delay(0).springify()} style={[s.heroBanner, { borderColor: colors.border }]}>
          <LinearGradient
            colors={['rgba(99,102,241,0.08)', 'rgba(255,255,255,0.97)', 'rgba(245,158,11,0.07)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          />

          <View style={s.heroContent}>
            {/* Text side */}
            <View style={{ flex: 1, zIndex: 1 }}>
              <View style={[s.heroPill, { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: colors.border }]}>
                <Feather name="zap" size={12} color={Palette.accent600} />
                <Text style={[s.heroPillText, { color: colors.textSecondary }]}>AI-Powered CV Generator</Text>
              </View>
              <Text style={[s.heroTitle, { color: colors.text }]}>Build Your{'\n'}Perfect CV</Text>
              <Text style={[s.heroSub, { color: colors.textSecondary }]}>
                Choose a style below. Your generated CV will be saved automatically to your profile so you can download it anytime.
              </Text>
            </View>

            {/* 3D Illustration */}
            <Image
              source={require('@/assets/images/resume_3d.webp')}
              style={s.heroImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* ── CV OPTION CARDS (matches web list layout with horizontal content) ── */}
        <View style={{ gap: 14, marginBottom: 16 }}>
          {CV_CARDS.map((card, i) => (
            <Animated.View key={card.id} entering={FadeInDown.delay(i * 80 + 100).springify()}>
              <HapticPressable
                onPress={() => openWizard(card.id)}
                style={({ pressed }) => [
                  s.cvCard,
                  {
                    backgroundColor: '#ffffff',
                    borderColor: colors.borderMid,
                    opacity: pressed ? 0.95 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }],
                  },
                ]}
              >

                {/* Icon circle with gradient */}
                <LinearGradient
                  colors={[card.gradFrom, card.gradTo]}
                  style={s.cvCardIcon}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Feather name={card.icon} size={28} color="#fff" />
                </LinearGradient>

                {/* Text block */}
                <View style={s.cvCardBody}>
                  <View style={s.cvCardTitleRow}>
                    <Text style={[s.cvCardTitle, { color: colors.text }]}>{card.title}</Text>
                    {'badge' in card && card.badge && (
                      <View style={[s.cvBadge, { backgroundColor: Palette.accent400 }]}>
                        <Text style={[s.cvBadgeText, { color: Palette.accent900 }]}>{card.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.cvCardDesc, { color: colors.textSecondary }]}>
                    {card.description}
                  </Text>
                </View>

                {/* Start button — gradient (matches web) */}
                <LinearGradient
                  colors={[card.gradFrom, card.gradTo]}
                  style={s.startBtnWrap}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <View style={s.startBtn}>
                    <Text style={s.startBtnText}>Start</Text>
                    <Feather name="arrow-right" size={14} color="#fff" />
                  </View>
                </LinearGradient>
              </HapticPressable>

            </Animated.View>
          ))}
        </View>

        {/* ── INFO STRIP (matches web: "CVs are saved automatically") ── */}
        <Animated.View
          entering={FadeInDown.delay(280).springify()}
          style={[s.infoStrip, { backgroundColor: Palette.neutral50, borderColor: colors.border }]}
        >
          <View style={[s.infoIcon, { backgroundColor: Palette.accent50 }]}>
            <Feather name="file-text" size={18} color={Palette.accent600} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.infoTitle, { color: colors.text }]}>Your CVs are saved automatically</Text>
            <Text style={[s.infoSub, { color: colors.textSecondary }]}>
              Once generated, all your CVs appear under{' '}
              <Text style={{ fontWeight: FontWeight.bold, color: colors.text }}>
                My Profile → Generated Documents
              </Text>
              {' '}and can be downloaded as PDF at any time.
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      {/* ── CV WIZARD NATIVE MODAL ── */}
      <CVWizardModal
        visible={wizardVisible}
        onClose={() => setWizardVisible(false)}
        templateType={templateType}
        onSuccess={() => {}}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { padding: 16, gap: 16 },

  // Hero Banner
  heroBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1,
    marginBottom: 8,
  },
  heroPillText: {
    fontSize: 11, fontWeight: '700',
  },
  heroTitle: {
    fontSize: 24, fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12, lineHeight: 17, marginBottom: 0,
  },
  heroImage: {
    width: 110, height: 110,
    flexShrink: 0,
  },

  // CV Cards
  cvCard: {
    borderRadius: BorderRadius.card, borderWidth: 1, padding: 20, gap: 14,
  },
  cvCardIcon: {
    width: 64, height: 64, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  cvCardBody:     { gap: 6 },
  cvCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cvCardTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  cvCardDesc:     { fontSize: FontSize.sm, lineHeight: 19 },
  cvBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  cvBadgeText:    { fontSize: 10, fontWeight: FontWeight.extrabold, textTransform: 'uppercase', letterSpacing: 0.5 },
  startBtnWrap:   { borderRadius: BorderRadius.md, overflow: 'hidden', alignSelf: 'flex-start' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, paddingHorizontal: 24,
  },
  startBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },

  // Info strip
  infoStrip: {
    flexDirection: 'row', gap: 14, padding: 18,
    borderRadius: BorderRadius.card, borderWidth: 1,
  },
  infoIcon: {
    width: 40, height: 40, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  infoTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: 4 },
  infoSub:   { fontSize: 12, lineHeight: 18 },
});
