/**
 * Quota Hire — User & Recruiter Settings Screen (Mobile)
 * Layout with 3D Hero Banner:
 * - 3D Settings Hero Banner (transparent illustration)
 * - Section 1 Card Layout: Personal Information (Name, Readonly Email, Phone)
 * - Section 2 Card Layout: Security & Password (Old, New, Confirm Password)
 * - Section 3: Preferences (Biometric + Push Notifications)
 * - Section 4: Danger Zone (Account Deletion)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

// expo-local-authentication guard
let LocalAuthentication: any = {
  hasHardwareAsync: async () => false,
  isEnrolledAsync: async () => false,
  authenticateAsync: async () => ({ success: false }),
  supportedAuthenticationTypesAsync: async () => [],
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC: 2 },
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
};
try {
  LocalAuthentication = require('expo-local-authentication');
} catch {
  console.warn('[expo-local-authentication] Not available in Expo Go — biometrics disabled.');
}
import { useRouter } from 'expo-router';

import { Colors, Palette, FontSize, FontWeight, TabBarHeight } from '@/constants/theme';
import { apiFetch, setAccessToken, setRefreshToken } from '@/services/api';
import { SkeletonBox as Skeleton, SkeletonLine } from '@/components/ui/skeleton';
import { registerForPushNotificationsAsync } from '@/services/notifications';

export default function SettingsScreen() {
  const colors = Colors.light;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('employee');

  // Personal Information States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password Security States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Biometrics & Notifications Preferences
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);

  // Delete Account States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Fetch initial profile & settings data
  const loadSettingsData = async () => {
    try {
      // 1. Load role
      const storedRole = await SecureStore.getItemAsync('user_role');
      const roleVal = storedRole || 'employee';
      setUserRole(roleVal);

      // 2. Fetch User Account details
      const uData = await apiFetch('/auth/me/');
      setFullName(uData.name || uData.first_name || '');
      setEmail(uData.email || '');

      // 3. Fetch role-specific details
      if (roleVal === 'company') {
        const compProfile = await apiFetch('/profile/company/').catch(() => null);
        setPhone(compProfile?.contact_phone || '');
      } else {
        const empProfile = await apiFetch('/profile/employee/').catch(() => null);
        setPhone(empProfile?.phone_number || '');
      }

      // 4. Load biometrics preference from SecureStore
      const bioStored = await SecureStore.getItemAsync('biometrics_enabled');
      setBiometricsEnabled(bioStored === 'true');

      // 5. Load push notifications preference from SecureStore
      const pushStored = await SecureStore.getItemAsync('push_notifications_enabled');
      setPushNotificationsEnabled(pushStored !== 'false');
    } catch {
      Alert.alert('Error', 'Could not load your settings data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  // Save Account Personal Information Details
  const handleSaveAccount = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name field cannot be empty.');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await apiFetch('/auth/me/', {
        method: 'PUT',
        body: JSON.stringify({ name: fullName }),
      });

      if (userRole === 'company') {
        await apiFetch('/profile/company/', {
          method: 'PUT',
          body: JSON.stringify({ contact_phone: phone }),
        });
      } else {
        await apiFetch('/profile/employee/', {
          method: 'PUT',
          body: JSON.stringify({ phone_number: phone }),
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Personal information updated successfully.');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Save Failed',
        err.message || 'Could not update your personal information. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleSaveAccount },
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    setSavingPassword(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const pwRes = await apiFetch('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });
      // Changing the password revokes every existing session server-side, so
      // store the fresh pair the endpoint hands back — otherwise this device
      // would be signed out the next time its access token expires.
      if (pwRes?.access) await setAccessToken(pwRes.access);
      if (pwRes?.refresh) await setRefreshToken(pwRes.refresh);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Password Change Failed',
        err.message || 'Could not change your password. Please verify your old password.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleChangePassword },
        ]
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // Permanent Delete Account Action
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE exactly to confirm.');
      return;
    }

    setDeleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      await apiFetch('/auth/delete-account/', {
        method: 'DELETE',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
        {
          text: 'OK',
          onPress: async () => {
            if (typeof (globalThis as any).logout === 'function') {
              await (globalThis as any).logout();
            }
          },
        },
      ]);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Deletion Failed',
        err.message || 'Could not delete your account. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleDeleteAccount },
        ]
      );
    } finally {
      setDeleting(false);
    }
  };

  // Biometric Preference Toggle
  const toggleBiometrics = async (val: boolean) => {
    if (val) {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            'Biometrics Unavailable',
            'No biometric hardware or enrolled fingerprints/FaceID found on this device.'
          );
          return;
        }

        const res = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirm Biometrics for Quota Hire',
          fallbackLabel: 'Use Passcode',
        });

        if (res.success) {
          setBiometricsEnabled(true);
          await SecureStore.setItemAsync('biometrics_enabled', 'true');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Alert.alert('Failed', 'Biometric authentication was not successful.');
        }
      } catch (_e) {
        Alert.alert('Error', 'Could not enable biometrics on this device.');
      }
    } else {
      setBiometricsEnabled(false);
      await SecureStore.setItemAsync('biometrics_enabled', 'false');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Push Notification Toggle
  const togglePushNotifications = async (val: boolean) => {
    setPushNotificationsEnabled(val);
    await SecureStore.setItemAsync('push_notifications_enabled', val ? 'true' : 'false');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (val) {
      registerForPushNotificationsAsync().catch(() => {});
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.root}
    >
      <LinearGradient
        colors={['#FAFAF9', '#F4FAF3', '#FAFAF9']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: TabBarHeight + 36 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── HERO BANNER WITH 3D ILLUSTRATION ── */}
        <Animated.View entering={FadeInUp.springify()} style={[s.heroBanner, { borderColor: colors.borderMid }]}>
          <LinearGradient
            colors={['#FCEFCF', '#E1F6DD']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={s.heroContent}>
            <View style={{ flex: 1 }}>
              <View style={[s.heroPill, { backgroundColor: 'rgba(255,255,255,0.85)', borderColor: colors.border }]}>
                <Feather name="sliders" size={11} color={Palette.accent600} />
                <Text style={[s.heroPillText, { color: colors.textSecondary }]}>Account & Security</Text>
              </View>
              <Text style={[s.heroTitle, { color: colors.text }]}>Settings &{'\n'}Preferences</Text>
              <Text style={[s.heroSub, { color: colors.textSecondary }]}>
                Manage your personal info, login credentials, and biometric preferences.
              </Text>
            </View>

            {/* Transparent 3D Settings Illustration */}
            <Image
              source={require('../../assets/images/illustrations/settings_illustration.webp')}
              style={s.heroImage}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        {/* ── 1. PERSONAL INFORMATION (CARD LAYOUT) ── */}
        <Animated.View entering={FadeInDown.delay(50).springify()} style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.iconBadge, { backgroundColor: 'rgba(21,117,10,0.08)' }]}>
              <Feather name="user" size={15} color={Palette.accent600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Personal Information</Text>
              <Text style={s.cardSubtitle}>Manage your name and primary contact info</Text>
            </View>
          </View>

          <View style={s.cardBody}>
            {loading ? (
              <View style={{ gap: 12 }}>
                <SkeletonLine width="30%" />
                <Skeleton width="100%" height={46} borderRadius={12} />
                <SkeletonLine width="40%" />
                <Skeleton width="100%" height={46} borderRadius={12} />
                <SkeletonLine width="30%" />
                <Skeleton width="100%" height={46} borderRadius={12} />
              </View>
            ) : (
              <>
                <View style={s.field}>
                  <Text style={s.label}>Full Name</Text>
                  <View style={s.inputContainer}>
                    <Feather name="user" size={15} color={Palette.neutral400} style={s.inputIcon} />
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Your full name"
                      placeholderTextColor={Palette.neutral400}
                      style={s.input}
                    />
                  </View>
                </View>

                <View style={s.field}>
                  <View style={s.labelRow}>
                    <Text style={s.label}>Email Address</Text>
                    <View style={s.readOnlyPill}>
                      <Feather name="lock" size={10} color={Palette.neutral500} />
                      <Text style={s.readOnlyText}>Read only</Text>
                    </View>
                  </View>
                  <View style={[s.inputContainer, s.inputDisabled]}>
                    <Feather name="mail" size={15} color={Palette.neutral400} style={s.inputIcon} />
                    <TextInput
                      value={email}
                      editable={false}
                      style={[s.input, { color: Palette.neutral500 }]}
                    />
                  </View>
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Phone Number</Text>
                  <View style={s.inputContainer}>
                    <Feather name="phone" size={15} color={Palette.neutral400} style={s.inputIcon} />
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+1 (555) 000-0000"
                      placeholderTextColor={Palette.neutral400}
                      keyboardType="phone-pad"
                      style={s.input}
                    />
                  </View>
                </View>

                <Pressable
                  disabled={saving}
                  onPress={handleSaveAccount}
                  style={({ pressed }) => [
                    s.actionBtnWrap,
                    { opacity: pressed || saving ? 0.85 : 1 },
                  ]}
                >
                  <LinearGradient
                    colors={[Palette.accent600, Palette.accent500]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.actionBtn}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Feather name="check" size={15} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={s.actionBtnText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </Animated.View>

        {/* ── 2. SECURITY & PASSWORD (CARD LAYOUT) ── */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={s.card}>
          <View style={s.cardHeader}>
            <View style={[s.iconBadge, { backgroundColor: 'rgba(21,117,10,0.08)' }]}>
              <Feather name="lock" size={15} color={Palette.accent600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Change Password</Text>
              <Text style={s.cardSubtitle}>Ensure your account is protected with a strong password</Text>
            </View>
          </View>

          <View style={s.cardBody}>
            <View style={s.field}>
              <Text style={s.label}>Current Password</Text>
              <View style={s.inputContainer}>
                <Feather name="key" size={15} color={Palette.neutral400} style={s.inputIcon} />
                <TextInput
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                  placeholder="Enter current password"
                  placeholderTextColor={Palette.neutral400}
                  style={s.input}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>New Password</Text>
              <View style={s.inputContainer}>
                <Feather name="lock" size={15} color={Palette.neutral400} style={s.inputIcon} />
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Minimum 8 characters"
                  placeholderTextColor={Palette.neutral400}
                  style={s.input}
                />
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Confirm New Password</Text>
              <View style={s.inputContainer}>
                <Feather name="shield" size={15} color={Palette.neutral400} style={s.inputIcon} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Re-enter new password"
                  placeholderTextColor={Palette.neutral400}
                  style={s.input}
                />
              </View>
            </View>

            <Pressable
              disabled={savingPassword}
              onPress={handleChangePassword}
              style={({ pressed }) => [
                s.actionBtnWrap,
                { opacity: pressed || savingPassword ? 0.85 : 1 },
              ]}
            >
              <LinearGradient
                colors={[Palette.accent600, Palette.accent500]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.actionBtn}
              >
                {savingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="shield" size={15} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={s.actionBtnText}>Update Password</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── 3. PREFERENCES: BIOMETRIC & PUSH NOTIFICATIONS ── */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={s.preferencesCard}>
          {/* 3a. Biometric */}
          <View style={s.preferenceRow}>
            <View style={[s.prefIconBadge, { backgroundColor: 'rgba(21,117,10,0.08)' }]}>
              <MaterialCommunityIcons name="fingerprint" size={22} color={Palette.accent600} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.prefTitle}>Biometric</Text>
              <Text style={s.prefSubtitle}>Use Fingerprint or Face ID for authentication</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={toggleBiometrics}
              trackColor={{ false: '#E2E8F0', true: Palette.accent600 }}
              thumbColor={Platform.OS === 'ios' ? '#ffffff' : biometricsEnabled ? '#ffffff' : '#F8FAFC'}
              ios_backgroundColor="#E2E8F0"
            />
          </View>

          <View style={s.cardDivider} />

          {/* 3b. Push Notifications */}
          <View style={s.preferenceRow}>
            <View style={[s.prefIconBadge, { backgroundColor: 'rgba(99,102,241,0.08)' }]}>
              <Feather name="bell" size={18} color={Palette.indigo600} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.prefTitle}>Push Notifications</Text>
              <Text style={s.prefSubtitle}>Receive job alerts, application status and updates</Text>
            </View>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={togglePushNotifications}
              trackColor={{ false: '#E2E8F0', true: Palette.accent600 }}
              thumbColor={Platform.OS === 'ios' ? '#ffffff' : pushNotificationsEnabled ? '#ffffff' : '#F8FAFC'}
              ios_backgroundColor="#E2E8F0"
            />
          </View>
        </Animated.View>

        {/* ── 4. DANGER ZONE ── */}
        <Animated.View entering={FadeInDown.delay(180).springify()} style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.iconBadge, { backgroundColor: '#FEF2F2' }]}>
              <Feather name="alert-triangle" size={15} color={Palette.red600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.sectionTitle, { color: Palette.red600 }]}>Danger Zone</Text>
              <Text style={s.sectionSubtitle}>Permanent actions regarding your account</Text>
            </View>
          </View>

          <View style={s.formBlock}>
            {!showDeleteConfirm ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowDeleteConfirm(true);
                }}
                style={({ pressed }) => [
                  s.deleteTriggerBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="trash-2" size={15} color={Palette.red600} style={{ marginRight: 8 }} />
                <Text style={s.deleteTriggerText}>Delete My Account</Text>
              </Pressable>
            ) : (
              <View style={s.confirmBox}>
                <View style={s.confirmHeaderRow}>
                  <Feather name="alert-circle" size={16} color={Palette.red600} style={{ marginTop: 1 }} />
                  <Text style={s.confirmText}>
                    This action is permanent and cannot be undone. Type <Text style={{ fontWeight: '800' }}>DELETE</Text> below to confirm.
                  </Text>
                </View>

                <TextInput
                  value={deleteInput}
                  onChangeText={setDeleteInput}
                  placeholder="Type DELETE here"
                  placeholderTextColor={Palette.red400}
                  autoCapitalize="characters"
                  style={s.confirmInput}
                />

                <View style={s.confirmActionsRow}>
                  <Pressable
                    onPress={() => {
                      setShowDeleteConfirm(false);
                      setDeleteInput('');
                    }}
                    style={s.confirmCancelBtn}
                  >
                    <Text style={s.confirmCancelText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    disabled={deleting || deleteInput !== 'DELETE'}
                    onPress={handleDeleteAccount}
                    style={[
                      s.confirmDeleteBtn,
                      deleteInput !== 'DELETE' && { opacity: 0.45 },
                    ]}
                  >
                    {deleting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={s.confirmDeleteText}>Confirm Delete</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  // ── Hero Banner ──
  heroBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  blob1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(21,117,10,0.06)',
  },
  blob2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(59,130,246,0.05)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    marginBottom: 8,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  heroImage: {
    width: 96,
    height: 96,
    flexShrink: 0,
  },

  // ── Cards for Personal Info & Change Password ──
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.neutral900,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 1,
  },
  cardBody: {
    gap: 12,
  },

  // ── Section Styling ──
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.neutral900,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 1,
  },

  // ── Form block ──
  formBlock: {
    gap: 12,
  },
  field: {
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.neutral700,
  },
  readOnlyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  readOnlyText: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.neutral500,
  },

  // ── Inputs (Flat, clean) ──
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E8EDF2',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: Palette.neutral900,
    fontWeight: '500',
  },

  // ── Action Buttons ──
  actionBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  actionBtn: {
    minHeight: 46,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // ── Preferences Card (Biometric & Push Notifications) ──
  preferencesCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EDF2',
    overflow: 'hidden',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  prefIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.neutral900,
  },
  prefSubtitle: {
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 1,
    lineHeight: 15,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 14,
  },

  // ── Danger Zone ──
  deleteTriggerBtn: {
    minHeight: 44,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.red600,
  },

  // ── Confirmation Box ──
  confirmBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: 12,
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  confirmText: {
    flex: 1,
    fontSize: 12,
    color: Palette.red700,
    lineHeight: 16,
  },
  confirmInput: {
    minHeight: 42,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#ffffff',
    color: Palette.red700,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmCancelBtn: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  confirmCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.neutral600,
  },
  confirmDeleteBtn: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Palette.red600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
