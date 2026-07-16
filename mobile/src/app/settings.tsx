/**
 * Quota Hire — User & Recruiter Settings Screen (Mobile)
 * EXACT visual and functional clone of Settings.tsx web page
 *
 * Supports:
 * - Personal Information form (Name, Email readonly, Phone)
 * - Password Security Credentials (Old, New, Confirm Password)
 * - Preferences toggles (Biometrics/Fingerprint, Notifications, Dark Mode)
 * - Sign Out button
 * - Danger Zone Account Deletion (via DELETE confirmation text)
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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight, TabBarHeight } from '@/constants/theme';
import { apiFetch } from '@/services/api';
import { SkeletonBox as Skeleton, SkeletonLine } from '@/components/ui/skeleton';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

type Tab = 'account' | 'security';

export default function SettingsScreen() {
  const colors = Colors.light;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('employee');

  // Account Tab States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Delete Account States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Security Tab States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preference switches States
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

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

      // 4. Load preference switches from SecureStore
      const bioStored = await SecureStore.getItemAsync('biometrics_enabled');
      setBiometricsEnabled(bioStored === 'true');

      const pushStored = await SecureStore.getItemAsync('push_notifications_enabled');
      setPushEnabled(pushStored === 'true');

      const darkStored = await SecureStore.getItemAsync('dark_mode_enabled');
      setDarkModeEnabled(darkStored === 'true');
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
      // Save name to user account
      await apiFetch('/auth/me/', {
        method: 'PUT',
        body: JSON.stringify({ name: fullName }),
      });

      // Save role-specific details
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
      Alert.alert('Success', 'Personal Information updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Change password credentials
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All password fields are required.');
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

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await apiFetch('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update password. Please check your old password.');
    } finally {
      setSaving(false);
    }
  };

  // Danger Zone - Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE exactly to confirm.');
      return;
    }

    setDeleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    try {
      await apiFetch('/auth/delete/', { method: 'DELETE' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Deleted', 'Your account has been permanently deleted.');
      
      // Perform sign out
      if (typeof (globalThis as any).logout === 'function') {
        await (globalThis as any).logout();
      }
    } catch {
      Alert.alert('Error', 'Could not delete your account. Please try again.');
      setDeleting(false);
    }
  };

  // Toggle Preferences switches
  const toggleBiometrics = async (val: boolean) => {
    setBiometricsEnabled(val);
    await SecureStore.setItemAsync('biometrics_enabled', val.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const togglePush = async (val: boolean) => {
    setPushEnabled(val);
    await SecureStore.setItemAsync('push_notifications_enabled', val.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleDarkMode = async (val: boolean) => {
    setDarkModeEnabled(val);
    await SecureStore.setItemAsync('dark_mode_enabled', val.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Preference Saved', 'Color theme preferences will apply on reload.');
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.root}
    >
      <LinearGradient
        colors={['#FFFBEB', '#FFFDF5', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: TabBarHeight + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title & Banner Header */}
        <Animated.View entering={FadeInDown.springify()} style={s.headerRow}>
          <View style={s.headerIconWrap}>
            <Feather name="settings" size={20} color="#fff" />
          </View>
          <View>
            <Text style={s.title}>Settings</Text>
            <Text style={s.subText}>Manage your account and preferences</Text>
          </View>
        </Animated.View>

        {/* Tab Switcher */}
        <View style={s.tabSwitcher}>
          {(['account', 'security'] as Tab[]).map((t) => {
            const isActive = activeTab === t;
            const Icon = t === 'account' ? Feather : Feather;
            const iconName = t === 'account' ? 'user' : 'shield';
            const label = t === 'account' ? 'Account' : 'Security';
            return (
              <Pressable
                key={t}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(t);
                }}
                style={[s.tabButton, isActive && s.tabButtonActive]}
              >
                <Feather name={iconName as any} size={14} color={isActive ? Palette.neutral900 : Palette.neutral500} />
                <Text style={[s.tabButtonText, isActive && s.tabButtonTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Tab Contents */}
        {activeTab === 'account' ? (
          <Animated.View entering={FadeInDown.springify()} style={s.tabBody}>
            {/* Personal Info Card */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Feather name="user" size={16} color={Palette.accent600} />
                <Text style={s.cardTitle}>Personal Information</Text>
              </View>

              <View style={s.cardBody}>
                {loading ? (
                  <View style={{ gap: 12 }}>
                    <View style={s.field}>
                      <SkeletonLine width="30%" />
                      <Skeleton width="100%" height={40} borderRadius={8} style={{ marginTop: 6 }} />
                    </View>
                    <View style={s.field}>
                      <SkeletonLine width="45%" />
                      <Skeleton width="100%" height={40} borderRadius={8} style={{ marginTop: 6 }} />
                    </View>
                    <View style={s.field}>
                      <SkeletonLine width="30%" />
                      <Skeleton width="100%" height={40} borderRadius={8} style={{ marginTop: 6 }} />
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={s.field}>
                      <Text style={s.label}>Full Name</Text>
                      <TextInput
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Your Name"
                        style={s.input}
                      />
                    </View>

                    <View style={s.field}>
                      <Text style={s.label}>Email Address (cannot be changed)</Text>
                      <TextInput
                        value={email}
                        editable={false}
                        style={[s.input, s.inputDisabled]}
                      />
                    </View>

                    <View style={s.field}>
                      <Text style={s.label}>Phone Number</Text>
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+1 (555) 000-0000"
                        keyboardType="phone-pad"
                        style={s.input}
                      />
                    </View>

                    <Pressable
                      disabled={saving}
                      onPress={handleSaveAccount}
                      style={[s.saveBtn, { backgroundColor: Palette.accent600 }]}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Feather name="save" size={14} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={s.saveBtnText}>Save Changes</Text>
                        </>
                      )}
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            {/* Danger Zone deletion Card */}
            <View style={[s.card, s.cardDanger]}>
              <View style={s.cardHeader}>
                <Feather name="trash-2" size={16} color={Palette.red600} />
                <Text style={[s.cardTitle, { color: Palette.red600 }]}>Danger Zone</Text>
              </View>

              <View style={s.cardBody}>
                <Text style={s.dangerDesc}>
                  Once deleted, your account and all associated data will be permanently erased. This cannot be undone.
                </Text>

                {!showDeleteConfirm ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowDeleteConfirm(true);
                    }}
                    style={[s.dangerBtn, { borderColor: Palette.red400 }]}
                  >
                    <Feather name="trash-2" size={14} color={Palette.red600} style={{ marginRight: 6 }} />
                    <Text style={s.dangerBtnText}>Delete My Account</Text>
                  </Pressable>
                ) : (
                  <View style={[s.confirmZone, { backgroundColor: Palette.red50 }]}>
                    <View style={s.confirmHeader}>
                      <Feather name="alert-triangle" size={15} color={Palette.red600} />
                      <Text style={s.confirmWarnText}>
                        This action is irreversible. Type <Text style={{ fontWeight: '800' }}>DELETE</Text> below to confirm deletion.
                      </Text>
                    </View>

                    <TextInput
                      value={deleteInput}
                      onChangeText={setDeleteInput}
                      placeholder="Type DELETE here"
                      placeholderTextColor={Palette.red400}
                      autoCapitalize="characters"
                      style={s.deleteInput}
                    />

                    <View style={s.confirmActions}>
                      <Pressable
                        onPress={() => {
                          setShowDeleteConfirm(false);
                          setDeleteInput('');
                        }}
                        style={s.cancelBtn}
                      >
                        <Text style={s.cancelBtnText}>Cancel</Text>
                      </Pressable>

                      <Pressable
                        disabled={deleting || deleteInput !== 'DELETE'}
                        onPress={handleDeleteAccount}
                        style={[s.deleteBtn, deleteInput !== 'DELETE' && { opacity: 0.5 }]}
                      >
                        {deleting ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={s.deleteBtnText}>Confirm Delete</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.springify()} style={s.tabBody}>
            {/* Password Credentials Card */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Feather name="lock" size={16} color={Palette.accent600} />
                <Text style={s.cardTitle}>Change Password</Text>
              </View>

              <View style={s.cardBody}>
                <View style={s.field}>
                  <Text style={s.label}>Old Password</Text>
                  <TextInput
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    style={s.input}
                  />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>New Password</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    style={s.input}
                  />
                </View>

                <View style={s.field}>
                  <Text style={s.label}>Confirm New Password</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    style={s.input}
                  />
                </View>

                <Pressable
                  disabled={saving}
                  onPress={handleChangePassword}
                  style={[s.saveBtn, { backgroundColor: Palette.accent600 }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="shield" size={14} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={s.saveBtnText}>Update Password</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>

            {/* Application Preferences Card */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Feather name="sliders" size={16} color={Palette.accent600} />
                <Text style={s.cardTitle}>Preferences</Text>
              </View>

              <View style={s.cardBody}>
                {/* Biometrics Toggle */}
                <View style={s.preferenceRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.preferenceLabel}>Biometric Sign In</Text>
                    <Text style={s.preferenceSub}>Use Face ID / Fingerprint on login</Text>
                  </View>
                  <Switch
                    value={biometricsEnabled}
                    onValueChange={toggleBiometrics}
                    trackColor={{ false: '#cbd5e1', true: Palette.accent600 }}
                    thumbColor={Platform.OS === 'ios' ? '#ffffff' : biometricsEnabled ? Palette.accent500 : '#f8fafc'}
                  />
                </View>

                <View style={s.divider} />

                {/* Notifications Toggle */}
                <View style={s.preferenceRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.preferenceLabel}>Push Notifications</Text>
                    <Text style={s.preferenceSub}>Opt-in to alerts and application updates</Text>
                  </View>
                  <Switch
                    value={pushEnabled}
                    onValueChange={togglePush}
                    trackColor={{ false: '#cbd5e1', true: Palette.accent600 }}
                    thumbColor={Platform.OS === 'ios' ? '#ffffff' : pushEnabled ? Palette.accent500 : '#f8fafc'}
                  />
                </View>

                <View style={s.divider} />

                {/* Dark Mode Toggle */}
                <View style={s.preferenceRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.preferenceLabel}>Dark Mode (Beta)</Text>
                    <Text style={s.preferenceSub}>Toggle color scheme theme selection</Text>
                  </View>
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: '#cbd5e1', true: Palette.accent600 }}
                    thumbColor={Platform.OS === 'ios' ? '#ffffff' : darkModeEnabled ? Palette.accent500 : '#f8fafc'}
                  />
                </View>
              </View>
            </View>

            {/* Logout button Card */}
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [s.signOutCard, pressed && { opacity: 0.85 }]}
            >
              <Feather name="log-out" size={16} color={Palette.red500} />
              <Text style={s.signOutText}>Sign Out of this Session</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBEB' },

  // Header Banner
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.accent600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.accent600,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Palette.neutral900,
  },
  subText: {
    fontSize: FontSize.xs,
    color: Palette.neutral500,
    marginTop: 1,
  },

  // Switcher
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Palette.neutral100,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: Palette.neutral500,
  },
  tabButtonTextActive: {
    color: Palette.neutral900,
  },

  // Body container
  tabBody: {
    gap: 16,
  },

  // Cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardDanger: {
    borderColor: Palette.red400,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Palette.neutral800,
  },
  cardBody: {
    padding: 16,
    gap: 14,
  },

  // Forms
  field: {
    gap: 6,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Palette.neutral600,
  },
  input: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    fontSize: FontSize.sm,
    backgroundColor: '#f8fafc',
    color: Palette.neutral900,
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    color: Palette.neutral400,
  },

  // Buttons
  saveBtn: {
    height: 42,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },

  // Danger settings
  dangerDesc: {
    fontSize: FontSize.xs,
    color: Palette.neutral500,
    lineHeight: 18,
  },
  dangerBtn: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  dangerBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Palette.red600,
  },

  // Confirmation panel
  confirmZone: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.red400,
    gap: 12,
  },
  confirmHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  confirmWarnText: {
    flex: 1,
    fontSize: 12,
    color: Palette.red700,
    lineHeight: 16,
  },
  deleteInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Palette.red400,
    paddingHorizontal: 10,
    fontSize: FontSize.xs,
    fontWeight: 'bold',
    backgroundColor: '#ffffff',
    color: Palette.red700,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  cancelBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Palette.neutral600,
  },
  deleteBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: Palette.red600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: '#ffffff',
  },

  // Preferences
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  preferenceLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Palette.neutral800,
  },
  preferenceSub: {
    fontSize: 10,
    color: Palette.neutral400,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },

  // Sign out card
  signOutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.red400,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  signOutText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Palette.red500,
  },
});
