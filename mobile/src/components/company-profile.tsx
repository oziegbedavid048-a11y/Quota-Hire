import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

import { Colors, Palette, BorderRadius, FontSize, FontWeight, TabBarHeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';

const { width: SCREEN_W } = Dimensions.get('window');

function Skeleton({ width, height, borderRadius, style }: { width?: any; height?: any; borderRadius?: number; style?: any }) {
  const opacity = useRef(new RNAnimated.Value(0.3)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(opacity, {
          toValue: 0.8,
          duration: 850,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacity, {
          toValue: 0.3,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <RNAnimated.View
      style={[
        {
          width: width ?? '100%',
          height: height ?? 20,
          backgroundColor: '#e2e8f0',
          borderRadius: borderRadius ?? 8,
          opacity: opacity,
        },
        style,
      ]}
    />
  );
}

export default function CompanyProfile() {
  const colors = Colors.light;
  const router = useRouter();

  // Profile data
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Form States
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const fetchProfile = async () => {
    try {
      setError(false);
      const [uData, compProfile] = await Promise.all([
        apiFetch('/auth/me/'),
        apiFetch('/profile/company/').catch(() => null),
      ]);

      const mergedProfile = {
        id: uData.id?.toString() || 'company',
        name: uData.name || uData.first_name || uData.email || 'User',
        email: uData.email || '',
        role: uData.role || 'company',
        isVerified: uData.is_verified || false,
        createdAt: uData.created_at || new Date().toISOString(),
        companyName: compProfile?.company_name || uData.companyName || '',
        industry: compProfile?.industry || '',
        aboutCompany: compProfile?.about_company || '',
        website: compProfile?.website || '',
        logoUrl: compProfile?.logo_url || uData.avatarUrl || '',
        contactPhone: compProfile?.contact_phone || '',
      };
      setProfile(mergedProfile);

      // Populate form
      setCompanyName(mergedProfile.companyName);
      setIndustry(mergedProfile.industry);
      setWebsite(mergedProfile.website);
      setAboutCompany(mergedProfile.aboutCompany);
      setContactPhone(mergedProfile.contactPhone);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    if (!companyName.trim()) {
      Alert.alert('Error', 'Company Name is required.');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const payload = {
      company_name: companyName,
      industry,
      website,
      about_company: aboutCompany,
      contact_phone: contactPhone,
    };

    try {
      await apiFetch('/profile/company/', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // Also update name on user account
      await apiFetch('/auth/me/', {
        method: 'PATCH',
        body: JSON.stringify({ name: companyName }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully.');
      fetchProfile();
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Failed to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      setAvatarUploading(true);
      const asset = result.assets[0];

      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const token = await SecureStore.getItemAsync('access_token');
      const resp = await fetch('https://quotahire-backend.onrender.com/api/profile/avatar/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!resp.ok) throw new Error();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Company logo updated.');
      fetchProfile();
    } catch {
      Alert.alert('Upload Failed', 'Unable to upload company logo image.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          if (typeof (globalThis as any).logout === 'function') {
            await (globalThis as any).logout();
          }
        },
      },
    ]);
  };

  if (loading) {
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
        >
          {/* Top Hero Card Skeleton */}
          <View style={[styles.heroCard, { alignItems: 'center', gap: 10, padding: 20 }]}>
            <Skeleton width={90} height={90} borderRadius={45} />
            <Skeleton width={180} height={20} borderRadius={6} style={{ marginTop: 8 }} />
            <Skeleton width={120} height={14} borderRadius={6} />
          </View>
          {/* Fields Skeletons */}
          <View style={styles.groupCard}>
            <View style={styles.modalBody}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <View key={idx} style={styles.field}>
                  <Skeleton width={100} height={12} borderRadius={4} />
                  <Skeleton width="100%" height={44} borderRadius={10} style={{ marginTop: 6 }} />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error) {
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
        >
          <Animated.View entering={FadeInDown.springify()} style={{
            margin: 16, backgroundColor: '#fee2e2', borderRadius: 12,
            borderWidth: 1, borderColor: '#fca5a5', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Feather name="alert-circle" size={20} color="#b91c1c" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#b91c1c' }}>Something Went Wrong</Text>
              <Text style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>We couldn't load your company profile. Tap to retry.</Text>
            </View>
            <Pressable
              onPress={() => {
                setError(false);
                setLoading(true);
                fetchProfile();
              }}
              style={{ backgroundColor: '#b91c1c', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Try Again</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  const initial = (profile?.companyName || 'C').charAt(0).toUpperCase();

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
      >
        {/* Profile Hero Card */}
        <Animated.View entering={FadeInDown.springify()} style={styles.heroCard}>
          <LinearGradient
            colors={['#FCEFCF', '#E1F6DD']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleAvatarUpload();
            }}
            style={styles.avatarContainer}
          >
            {profile?.logoUrl ? (
              <Image source={{ uri: profile.logoUrl }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: Palette.accent100 }]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              {avatarUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="camera" size={10} color="#fff" />
              )}
            </View>
          </Pressable>

          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.heroName, { color: colors.text }]}>{profile?.companyName}</Text>
              {profile?.isVerified && (
                <Feather name="check-circle" size={14} color={Palette.blue500} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={[styles.heroIndustry, { color: colors.textSecondary }]}>
              {profile?.industry || 'Recruiting Company'}
            </Text>
          </View>
        </Animated.View>

        {/* Company Settings Card (Inline fields) */}
        <Text style={styles.groupLabel}>Company Profile details</Text>
        <Animated.View entering={FadeInDown.springify()} style={styles.groupCard}>
          <View style={styles.modalBody}>
            <View style={styles.field}>
              <Text style={styles.label}>Company Name</Text>
              <TextInput value={companyName} onChangeText={setCompanyName} placeholder="Acme Corp" style={styles.input} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Industry</Text>
              <TextInput value={industry} onChangeText={setIndustry} placeholder="e.g. SaaS, FinTech" style={styles.input} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Website Link</Text>
              <TextInput value={website} onChangeText={setWebsite} placeholder="https://..." style={styles.input} autoCapitalize="none" keyboardType="url" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contact Phone</Text>
              <TextInput value={contactPhone} onChangeText={setContactPhone} placeholder="+1 555..." style={styles.input} keyboardType="phone-pad" />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>About Company</Text>
              <TextInput value={aboutCompany} onChangeText={setAboutCompany} placeholder="Brief company summary..." multiline numberOfLines={5} style={styles.textarea} />
            </View>

            <Pressable disabled={saving} onPress={handleSaveProfile} style={[styles.saveBtn, { backgroundColor: Palette.accent600 }]}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 16 },

  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Hero Card
  heroCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 20, alignItems: 'center', gap: 12, overflow: 'hidden' },
  avatarContainer: { width: 90, height: 90, borderRadius: 45, position: 'relative' },
  avatar: { width: '100%', height: '100%', borderRadius: 45 },
  avatarFallback: { width: '100%', height: '100%', borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 32, fontWeight: FontWeight.extrabold, color: Palette.accent700 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Palette.neutral900, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff' },

  heroInfo: { alignItems: 'center', gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroName: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  heroIndustry: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  // Lists
  groupLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', color: Palette.neutral400, letterSpacing: 0.5, marginLeft: 4, marginTop: 8 },
  groupCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: Palette.accent50, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  rowSub: { fontSize: FontSize.xs, marginTop: 2 },
  
  divider: { height: 1, backgroundColor: '#f1f5f9' },

  // Modals Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, maxHeight: SCREEN_W * 1.5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalHeaderTitle: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.neutral50, alignItems: 'center', justifyContent: 'center' },
  
  modalBody: { padding: 20, gap: 16 },
  field: { gap: 6, marginBottom: 12 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral600 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 12, fontSize: FontSize.sm, backgroundColor: '#f8fafc' },
  textarea: { height: 100, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', padding: 12, fontSize: FontSize.sm, backgroundColor: '#f8fafc', textAlignVertical: 'top' },

  saveBtn: { height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#fff' },

  // Banner Card
  bannerCard: { borderRadius: 16, overflow: 'hidden', padding: 20, marginBottom: 4 },
  bannerContent: { flexDirection: 'row', alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.neutral700 },
  bannerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: 4 },
  bannerSub: { fontSize: FontSize.xs, color: Palette.neutral600, lineHeight: 16 },
});
