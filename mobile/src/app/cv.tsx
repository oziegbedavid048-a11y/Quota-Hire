/**
 * Quota Hire — CV Generator Screen (Mobile)
 * Clean, well-arranged, and aligned Apple-grade design.
 *
 * - Hero Banner: Polished gradient banner with 3D illustration and title.
 * - CV Cards: Structured cards with top icon header, feature pills, description, and CTA.
 * - Info Strip: Clear guidance that generated CVs are automatically saved in My Profile.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import CompanyApplicants from '@/components/company-applicants';
import { HapticPressable } from '@/components/haptic-pressable';
import {
  Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight, TabBarHeight,
} from '@/constants/theme';
import CVWizardModal from '@/components/cv-wizard-modal';
import { useStoredRole } from '@/services/user-role';

const { width: SCREEN_W } = Dimensions.get('window');

const CV_CARDS = [
  {
    id: 'standard' as const,
    title: 'Standard Professional CV',
    subtitle: 'ATS-Friendly & Modern Layouts',
    description: 'Answer a few guided questions about your experience, skills, and accomplishments to instantly generate a polished, ATS-optimized sales resume.',
    features: ['Multi-Template', 'ATS Optimized', 'Instant PDF'],
    icon: 'file-text' as const,
    gradFrom: '#15750a',
    gradTo:   '#72dd15',
  },
  {
    id: 'europass' as const,
    title: 'Europass European CV',
    badge: 'EU Standard',
    subtitle: 'Official European Commission Format',
    description: 'Create an official Europe-formatted CV with CEFR language proficiencies, digital skills matrix, and optional passport photo.',
    features: ['Europass Format', 'CEFR Languages', 'Photo Ready'],
    icon: 'globe' as const,
    gradFrom: '#116108',
    gradTo:   '#48b30d',
  },
];

export default function CVScreen() {
  const colors = Colors.light;
  
  const role = useStoredRole();

  const [wizardVisible, setWizardVisible] = useState(false);
  const [templateType, setTemplateType] = useState<'standard' | 'europass'>('standard');

  const openWizard = (type: 'standard' | 'europass') => {
    setTemplateType(type);
    setWizardVisible(true);
  };

  if (role === 'company') {
    return <CompanyApplicants />;
  }

  return (
    <View style={s.root}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: TabBarHeight + 36 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO BANNER ── */}
        <Animated.View entering={FadeInDown.springify()} style={[s.heroBanner, { borderColor: colors.borderMid }]}>
          <LinearGradient
            colors={['#FCEFCF', '#E1F6DD']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={s.heroContent}>
            <View style={{ flex: 1 }}>
              <Text style={[s.heroTitle, { color: colors.text }]}>
                Build Your{' '}
                <Text style={{ color: Palette.accent600 }}>Perfect CV</Text>
              </Text>
              <Text style={[s.heroSub, { color: colors.textSecondary }]}>
                Select a format below. Your generated documents are automatically saved to your profile for easy downloading anytime.
              </Text>
            </View>

            <Image
              source={require('@/assets/images/resume_3d.webp')}
              style={s.heroImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* ── CV OPTION CARDS ── */}
        <View style={s.cardsContainer}>
          {CV_CARDS.map((card, i) => (
            <Animated.View key={card.id} entering={FadeInDown.delay(i * 70 + 80).springify()}>
              <View style={[s.cvCard, { backgroundColor: '#ffffff', borderColor: colors.borderMid }, Shadow.card]}>
                {/* Top Header: Icon + Title + Badge */}
                <View style={s.cvCardTop}>
                  <LinearGradient
                    colors={[card.gradFrom, card.gradTo]}
                    style={s.cvCardIconWrap}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Feather name={card.icon} size={22} color="#ffffff" />
                  </LinearGradient>

                  <View style={{ flex: 1 }}>
                    <View style={s.titleBadgeRow}>
                      <Text style={[s.cvCardTitle, { color: colors.text }]}>{card.title}</Text>
                      {'badge' in card && card.badge && (
                        <View style={[s.euBadge, { backgroundColor: Palette.accent50, borderColor: Palette.accent200 }]}>
                          <Text style={[s.euBadgeText, { color: Palette.accent700 }]}>{card.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[s.cvCardSubtitle, { color: colors.textMuted }]}>{card.subtitle}</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={[s.cvCardDesc, { color: colors.textSecondary }]}>
                  {card.description}
                </Text>

                {/* Feature Tags */}
                <View style={s.featuresRow}>
                  {card.features.map((feat) => (
                    <View key={feat} style={[s.featPill, { backgroundColor: Palette.neutral100 }]}>
                      <Feather name="check" size={10} color={Palette.accent600} />
                      <Text style={[s.featText, { color: colors.textSecondary }]}>{feat}</Text>
                    </View>
                  ))}
                </View>

                <View style={[s.cardDivider, { backgroundColor: colors.border }]} />

                {/* Bottom Action Button */}
                <HapticPressable
                  activeScale={0.97}
                  onPress={() => openWizard(card.id)}
                  style={s.startBtnContainer}
                >
                  <View style={s.startBtnSolid}>
                    <Text style={s.startBtnText}>Start {card.id === 'europass' ? 'Europass' : 'Standard'} Builder</Text>
                    <Feather name="arrow-right" size={15} color="#ffffff" />
                  </View>
                </HapticPressable>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* ── INFO STRIP ── */}
        <Animated.View
          entering={FadeInDown.delay(220).springify()}
          style={[s.infoStrip, { backgroundColor: '#ffffff', borderColor: colors.borderMid }, Shadow.card]}
        >
          <View style={[s.infoIconWrap, { backgroundColor: Palette.accent50 }]}>
            <Feather name="folder" size={20} color={Palette.accent600} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.infoTitle, { color: colors.text }]}>Automatically Saved</Text>
            <Text style={[s.infoSub, { color: colors.textSecondary }]}>
              All created documents appear in{' '}
              <Text style={{ fontWeight: FontWeight.bold, color: colors.text }}>
                My Profile → Tailored CVs
              </Text>
              {' '}and can be downloaded as PDF at any time.
            </Text>
          </View>
        </Animated.View>

      </ScrollView>

      {/* ── NATIVE CV BUILDER WIZARD ── */}
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
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  heroImage: {
    width: 92,
    height: 92,
    flexShrink: 0,
  },

  // Cards Container
  cardsContainer: {
    gap: 14,
  },
  cvCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  cvCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cvCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cvCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cvCardSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  euBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  euBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cvCardDesc: {
    fontSize: 12.5,
    lineHeight: 18.5,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  featPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    marginVertical: 2,
  },
  startBtnContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    // Flat brand green, no gradient.
    backgroundColor: Palette.accent600,
  },
  startBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Info Strip
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 11.5,
    lineHeight: 16.5,
  },
});
