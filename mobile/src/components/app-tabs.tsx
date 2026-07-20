import React, { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { HapticPressable } from '@/components/haptic-pressable';

import { Image } from 'expo-image';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Palette, Shadow, BorderRadius } from '@/constants/theme';
import Logo from '@/components/logo';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 270;

// ─── Floating Header (exact web nav clone) ────────────────────────────────────
function FloatingHeader({
  onToggleMenu,
  userName,
  currentRoute,
}: {
  onToggleMenu: () => void;
  userName?: string;
  currentRoute?: string;
}) {
  const router = useRouter();
  const segments = useSegments() as string[];
  const { unreadCount } = useNotificationsData();
  const initial = (userName || 'U').charAt(0).toUpperCase();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentRoute === '/community-detail') {
      router.replace('/community' as any);
    } else if (currentRoute === '/job-details') {
      router.replace('/explore' as any);
    } else if (currentRoute === '/notifications') {
      router.replace('/' as any);
    } else {
      router.back();
    }
  };

  const isDetailRoute =
    currentRoute === '/community-detail' ||
    currentRoute === '/job-details' ||
    currentRoute === '/notifications';

  return (
    <View style={styles.headerContainer}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'rgba(255, 251, 235, 0.95)' }} />
      <View style={styles.headerContent}>
        {/* Left: Logo + Brand */}
        <View style={styles.logoRow}>
          <Logo size={22} />
          <Text style={styles.logoText}>Quota Hire</Text>
        </View>

        {/* Right: Notifications + Avatar + Menu */}
        <View style={styles.actionsRow}>
          <HapticPressable style={styles.iconButton} onPress={() => router.push('/notifications' as any)}>
            <Feather name="bell" size={19} color={Palette.neutral700} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </HapticPressable>

          <HapticPressable style={styles.avatarButton}>
            <Text style={styles.avatarText}>{initial}</Text>
          </HapticPressable>

          <HapticPressable style={styles.menuButton} onPress={onToggleMenu}>
            <Feather name="menu" size={22} color={Palette.neutral900} />
          </HapticPressable>
        </View>
      </View>
      <View style={styles.headerBorder} />
    </View>
  );
}

// ─── Slide-in Sidebar (exact website sidebar) ─────────────────────────────────
function Sidebar({
  isOpen,
  onClose,
  userRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}) {
  const router = useRouter();
  const segments = useSegments();

  const seg0 = (segments[0] as string) ?? '';
  const currentRoute =
    seg0 === '' || seg0 === '(tabs)' || seg0 === 'index' ? '/' : `/${seg0}`;

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(isOpen ? 0 : -SIDEBAR_WIDTH, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
    backdropOpacity.value = withTiming(isOpen ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [isOpen]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: (isOpen ? 'auto' : 'none') as any,
  }));

  const isCompany = userRole === 'company';

  const EMPLOYEE_LINKS = [
    { name: 'Dashboard',    route: '/',            icon: 'layout'    },
    { name: 'Browse Jobs',  route: '/explore',     icon: 'search'    },
    { name: 'Saved Jobs',   route: '/saved-jobs',  icon: 'heart'     },
    { name: 'App Tracker',  route: '/tracker',     icon: 'list'      },
    { name: 'CV Generator', route: '/cv',          icon: 'file-text' },
    { name: 'Community',    route: '/community',   icon: 'users'     },
    { name: 'My Profile',   route: '/profile',     icon: 'user'      },
    { name: 'Settings',     route: '/settings',    icon: 'settings'  },
  ];


  const COMPANY_LINKS = [
    { name: 'Dashboard',    route: '/',          icon: 'layout'    },
    { name: 'Post a Role',  route: '/explore',   icon: 'plus-circle'},
    { name: 'My Roles',     route: '/tracker',   icon: 'briefcase' },
    { name: 'Company Profile', route: '/profile', icon: 'user' },
    { name: 'Settings',     route: '/settings',  icon: 'settings'  },
  ];

  const LINKS = isCompany ? COMPANY_LINKS : EMPLOYEE_LINKS;

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.replace(route as any), 150);
  };

  const handleSignOut = async () => {
    onClose();
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    router.replace('/' as any);
  };

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sidebar panel */}
      <Animated.View style={[styles.sidebar, sidebarStyle, Shadow.cardMd]}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#FFFBEB' }} />

        {/* Sidebar header with logo */}
        <View style={styles.sidebarHeader}>
          <View style={styles.logoRow}>
            <Logo size={22} />
            <Text style={styles.logoText}>Quota Hire</Text>
          </View>
          <HapticPressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={18} color={Palette.neutral500} />
          </HapticPressable>
        </View>

        {/* Nav links */}
        <View style={styles.navLinks}>
          {LINKS.map((link) => {
            const isActive = currentRoute === link.route;
            const isSpecial = link.name === 'CV Generator' || link.name === 'Post a Role';
            return (
              <HapticPressable
                key={link.name}
                onPress={() => navigate(link.route)}
                style={[
                  styles.navItem,
                  isActive && (isSpecial ? styles.navItemActiveSpecial : styles.navItemActive),
                ]}
              >
                <View style={[
                  styles.navIconWrap,
                  isActive && { backgroundColor: 'rgba(255,255,255,0.2)' },
                ]}>
                  <Feather
                    name={link.icon as any}
                    size={18}
                    color={isActive ? '#ffffff' : Palette.neutral500}
                  />
                </View>
                <Text style={[styles.navText, isActive && styles.navTextActive]}>
                  {link.name}
                </Text>
              </HapticPressable>
            );
          })}
        </View>

        {/* Footer: Sign Out */}
        <View style={styles.sidebarFooter}>
          <HapticPressable style={styles.signOutRow} onPress={handleSignOut}>
            <Feather name="log-out" size={16} color={Palette.red500} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </HapticPressable>
        </View>
      </Animated.View>
    </>
  );
}

// ─── Main App Tabs (root layout) ─────────────────────────────────────────────
export default function AppTabs({ userRole, userName }: { userRole?: string; userName?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];
  const contentPaddingTop = insets.top + 64;

  return (
    <View style={{ flex: 1 }}>
      {/* Page background — updated to sidebar color #FFFBEB */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFBEB' }]}
      />

      {/* Content area — below header */}
      <View style={{ flex: 1, paddingTop: contentPaddingTop }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="explore" />
          <Tabs.Screen name="tracker" />
          <Tabs.Screen name="cv" />
          <Tabs.Screen name="community" />
          <Tabs.Screen name="community-detail" />
          <Tabs.Screen name="profile" />
          <Tabs.Screen name="notifications" />
          <Tabs.Screen name="job-details" />
          <Tabs.Screen name="saved-jobs" />
          <Tabs.Screen name="settings" />
        </Tabs>
      </View>

      {/* Absolute floating header on top */}
      <View style={styles.absoluteHeader}>
        <FloatingHeader
          onToggleMenu={() => setSidebarOpen(true)}
          userName={userName}
          currentRoute={
            segments.includes('community-detail')
              ? '/community-detail'
              : segments.includes('job-details')
              ? '/job-details'
              : segments.includes('notifications')
              ? '/notifications'
              : '/'
          }
        />
      </View>

      {/* Sliding sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={userRole}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  absoluteHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
  },

  // Header
  headerContainer: {
    backgroundColor: 'rgba(255, 251, 235, 0.97)',
  },
  headerContent: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerBorder: {
    height: 1,
    backgroundColor: Palette.neutral200,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: { width: 30, height: 30 },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.neutral900,
    letterSpacing: -0.5,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingRight: 12,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.neutral900,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4, right: 4,
    minWidth: 16, height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    paddingHorizontal: 2,
  },
  notificationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  avatarButton: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Palette.accent100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Palette.accent200,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.accent700,
  },
  menuButton: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Backdrop
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 40,
  },

  // Sidebar panel
  sidebar: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFBEB',
    zIndex: 50,
    borderRightWidth: 1,
    borderRightColor: Palette.neutral100,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  closeBtn: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Nav
  navLinks: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
  },
  navItemActive: {
    backgroundColor: Palette.accent500,
  },
  navItemActiveSpecial: {
    backgroundColor: Palette.accent500,
  },
  navIconWrap: {
    width: 28, height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.neutral600,
  },
  navTextActive: {
    color: '#ffffff',
  },

  // Sidebar footer
  sidebarFooter: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral100,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.red50,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.red500,
  },
});
