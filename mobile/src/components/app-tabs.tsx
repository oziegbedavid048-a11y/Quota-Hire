import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Palette, Shadow, BorderRadius } from '@/constants/theme';
import Logo from '@/components/logo';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { HapticPressable } from '@/components/haptic-pressable';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { apiFetch } from '@/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Floating Top Header ──────────────────────────────────────────────────────
function FloatingHeader({
  onOpenMore,
  userName,
  avatarUrl,
  currentRoute,
}: {
  onOpenMore: () => void;
  userName?: string;
  avatarUrl?: string;
  currentRoute?: string;
}) {
  const router = useRouter();
  const { unreadCount } = useNotificationsData();
  const initial = (userName || 'U').charAt(0).toUpperCase();

  return (
    <View style={styles.headerContainer}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'rgba(255, 251, 235, 0.96)' }} />
      <View style={styles.headerContent}>
        {/* Left: Logo + Brand */}
        <View style={styles.logoRow}>
          <Logo size={22} />
          <Text style={styles.logoText}>Quota Hire</Text>
        </View>

        {/* Right: Notifications + Avatar Profile + Menu */}
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

          <HapticPressable
            style={styles.avatarButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/profile' as any);
            }}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImg}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </HapticPressable>
        </View>
      </View>
      <View style={styles.headerBorder} />
    </View>
  );
}

// ─── Spring-Up "More" Bottom Sheet Menu ───────────────────────────────────────
function MoreMenuSheet({
  isOpen,
  onClose,
  userRole,
  avatarUrl,
  userName,
}: {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  avatarUrl?: string;
  userName?: string;
}) {
  const router = useRouter();
  const segments = useSegments();
  const { unreadCount } = useNotificationsData();
  const insets = useSafeAreaInsets();

  const seg0 = (segments[0] as string) ?? '';
  const currentRoute = seg0 === '' || seg0 === '(tabs)' || seg0 === 'index' ? '/' : `/${seg0}`;

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 140,
        mass: 0.9,
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [isOpen]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: isOpen ? ('auto' as const) : ('none' as const),
  }));

  const isCompany = userRole === 'company';

  // Menu items for Candidate / Employee
  const EMPLOYEE_MORE_ITEMS: { name: string; route: string; icon: string; color: string; bg: string; badge?: string; count?: number }[] = [
    { name: 'Saved Jobs',    route: '/saved-jobs',  icon: 'heart',     color: '#ef4444', bg: '#fee2e2' },
    { name: 'CV Generator', route: '/cv',          icon: 'file-text', color: Palette.accent600, bg: Palette.accent50, badge: 'AI' },
    { name: 'My Profile',   route: '/profile',     icon: 'user',      color: '#6366f1', bg: '#e0e7ff' },
    { name: 'Notifications',route: '/notifications',icon: 'bell',      color: '#f59e0b', bg: '#fef3c7', count: unreadCount },
    { name: 'Settings',     route: '/settings',    icon: 'settings',  color: '#64748b', bg: '#f1f5f9' },
  ];

  // Menu items for Company / Employer
  const COMPANY_MORE_ITEMS: { name: string; route: string; icon: string; color: string; bg: string; badge?: string; count?: number }[] = [
    { name: 'Company Profile', route: '/profile', icon: 'user',     color: Palette.accent600, bg: Palette.accent50 },
    { name: 'Notifications',   route: '/notifications', icon: 'bell', color: '#f59e0b', bg: '#fef3c7', count: unreadCount },
    { name: 'Settings',        route: '/settings', icon: 'settings', color: '#64748b', bg: '#f1f5f9' },
  ];

  const ITEMS = isCompany ? COMPANY_MORE_ITEMS : EMPLOYEE_MORE_ITEMS;

  const navigateTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const handleSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onClose();
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user_name');
    await SecureStore.deleteItemAsync('user_role');
    await SecureStore.deleteItemAsync('user_avatar');
    if (typeof (globalThis as any).logout === 'function') {
      await (globalThis as any).logout();
    } else {
      router.replace('/' as any);
    }
  };

  const initial = (userName || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Dark overlay backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Spring-up sheet container */}
      <Animated.View style={[styles.sheetContainer, sheetStyle, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        {/* Top Handle indicator */}
        <View style={styles.sheetHandleWrap}>
          <View style={styles.sheetHandle} />
        </View>

        {/* Sheet Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 34, height: 34, borderRadius: 17 }} />
            ) : (
              <View style={styles.sheetAvatarFallback}>
                <Text style={styles.sheetAvatarText}>{initial}</Text>
              </View>
            )}
            <View>
              <Text style={styles.sheetTitle}>{userName || 'User Menu'}</Text>
              <Text style={styles.sheetSubtitle}>More Navigation Options</Text>
            </View>
          </View>
          <HapticPressable style={styles.sheetCloseBtn} onPress={onClose}>
            <Feather name="x" size={18} color={Palette.neutral600} />
          </HapticPressable>
        </View>

        {/* Options Grid */}
        <View style={styles.sheetGrid}>
          {ITEMS.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <HapticPressable
                key={item.name}
                onPress={() => navigateTo(item.route)}
                style={({ pressed }) => [
                  styles.sheetGridItem,
                  isActive && styles.sheetGridItemActive,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
              >
                <View style={[styles.sheetItemIconWrap, { backgroundColor: item.bg }]}>
                  <Feather name={item.icon as any} size={20} color={item.color} />
                  {item.count && item.count > 0 ? (
                    <View style={styles.sheetGridBadge}>
                      <Text style={styles.sheetGridBadgeText}>{item.count > 9 ? '9+' : item.count}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.sheetItemText, isActive && { color: Palette.accent700, fontWeight: '800' }]}>
                      {item.name}
                    </Text>
                    {Boolean(item.badge) && (
                      <View style={styles.aiBadge}>
                        <Text style={styles.aiBadgeText}>{item.badge}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color={Palette.neutral400} />
              </HapticPressable>
            );
          })}
        </View>

        {/* Sign Out Button */}
        <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
          <HapticPressable style={styles.sheetSignOutBtn} onPress={handleSignOut}>
            <Feather name="log-out" size={18} color={Palette.red500} />
            <Text style={styles.sheetSignOutText}>Sign Out Account</Text>
          </HapticPressable>
        </View>
      </Animated.View>
    </>
  );
}

// ─── Sleek Bottom Navigation Bar ──────────────────────────────────────────────
function BottomNavBar({
  userRole,
  currentRoute,
  onOpenMore,
}: {
  userRole?: string;
  currentRoute: string;
  onOpenMore: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isCompany = userRole === 'company';

  // Primary Employee Tabs
  const EMPLOYEE_NAV = [
    { key: 'home',      label: 'Home',      route: '/',          icon: 'layout'    },
    { key: 'explore',   label: 'Browse',    route: '/explore',   icon: 'search'    },
    { key: 'tracker',   label: 'Tracker',   route: '/tracker',   icon: 'briefcase' },
    { key: 'community', label: 'Community', route: '/community', icon: 'users'     },
  ];

  // Primary Company Tabs
  const COMPANY_NAV = [
    { key: 'home',    label: 'Home',       route: '/',        icon: 'layout'      },
    { key: 'post',    label: 'Post Role',  route: '/explore', icon: 'plus-circle' },
    { key: 'tracker', label: 'Applicants', route: '/tracker', icon: 'users'       },
    { key: 'profile', label: 'Company',    route: '/profile', icon: 'user'        },
  ];

  const NAV_ITEMS = isCompany ? COMPANY_NAV : EMPLOYEE_NAV;

  // Secondary routes that activate the "More" button indicator
  const MORE_ROUTES = ['/saved-jobs', '/cv', '/settings', '/notifications', '/profile'];
  const isMoreActive = MORE_ROUTES.includes(currentRoute) && (!isCompany || currentRoute !== '/profile');

  const navigateTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentRoute !== route) {
      router.replace(route as any);
    }
  };

  return (
    <View style={[styles.bottomBarWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bottomBarContent}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentRoute === item.route;
          return (
            <HapticPressable
              key={item.key}
              onPress={() => navigateTo(item.route)}
              style={styles.bottomTabItem}
            >
              <View style={[styles.tabIconWrap, isActive && styles.tabIconWrapActive]}>
                <Feather
                  name={item.icon as any}
                  size={20}
                  color={isActive ? Palette.accent600 : Palette.neutral500}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </HapticPressable>
          );
        })}

        {/* "MORE" Button — Spring-up sheet trigger */}
        <HapticPressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onOpenMore();
          }}
          style={styles.bottomTabItem}
        >
          <View style={[styles.tabIconWrap, isMoreActive && styles.tabIconWrapActive]}>
            <Feather
              name="grid"
              size={20}
              color={isMoreActive ? Palette.accent600 : Palette.neutral500}
            />
            {isMoreActive && <View style={styles.moreActiveDot} />}
          </View>
          <Text style={[styles.tabLabel, isMoreActive && styles.tabLabelActive]}>
            More
          </Text>
        </HapticPressable>
      </View>
    </View>
  );
}

// ─── Main App Tabs (root layout) ─────────────────────────────────────────────
export default function AppTabs({ userRole, userName }: { userRole?: string; userName?: string }) {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  const seg0 = (segments[0] as string) ?? '';
  const currentRoute = seg0 === '' || seg0 === '(tabs)' || seg0 === 'index' ? '/' : `/${seg0}`;

  const contentPaddingTop = insets.top + 64;
  const contentPaddingBottom = Math.max(insets.bottom + 65, 75);

  // Load avatar URL from SecureStore & backend
  useEffect(() => {
    (async () => {
      try {
        const cachedAvatar = await SecureStore.getItemAsync('user_avatar');
        if (cachedAvatar) setAvatarUrl(cachedAvatar);

        const data = await apiFetch('/auth/me/');
        const url = data?.avatarUrl || data?.avatar_url;
        if (url) {
          setAvatarUrl(url);
          await SecureStore.setItemAsync('user_avatar', url);
        }
      } catch (_e) {
        // Silently ignore
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBEB' }}>
      {/* Background fill */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFBEB' }]} />

      {/* Main Tabs Content */}
      <View style={{ flex: 1, paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom }}>
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

      {/* Floating Header on top */}
      <View style={styles.absoluteHeader}>
        <FloatingHeader
          onOpenMore={() => setMoreSheetOpen(true)}
          userName={userName}
          avatarUrl={avatarUrl}
          currentRoute={currentRoute}
        />
      </View>

      {/* Bottom Navigation Bar (replaces sidebar) */}
      <BottomNavBar
        userRole={userRole}
        currentRoute={currentRoute}
        onOpenMore={() => setMoreSheetOpen(true)}
      />

      {/* Spring-up "More" Bottom Sheet */}
      <MoreMenuSheet
        isOpen={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
        userRole={userRole}
        avatarUrl={avatarUrl}
        userName={userName}
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

  // Top Header
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
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.neutral900,
    letterSpacing: -0.5,
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
    overflow: 'hidden',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.accent700,
  },

  // Bottom Navigation Bar
  bottomBarWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 30,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  tabIconWrap: {
    width: 38,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabIconWrapActive: {
    backgroundColor: 'rgba(21, 117, 10, 0.1)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Palette.neutral500,
  },
  tabLabelActive: {
    color: Palette.accent700,
    fontWeight: '800',
  },
  moreActiveDot: {
    position: 'absolute',
    top: 2,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.accent600,
  },

  // Backdrop
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 40,
  },

  // Spring-Up "More" Sheet
  sheetContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Palette.neutral300,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.neutral100,
  },
  sheetAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.accent100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.accent700,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.neutral900,
  },
  sheetSubtitle: {
    fontSize: 11,
    color: Palette.neutral500,
    marginTop: 1,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sheet Grid
  sheetGrid: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  sheetGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: BorderRadius.card,
    backgroundColor: Palette.neutral50,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sheetGridItemActive: {
    backgroundColor: 'rgba(21, 117, 10, 0.06)',
    borderColor: 'rgba(21, 117, 10, 0.2)',
  },
  sheetItemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sheetItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.neutral800,
  },
  sheetGridBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  sheetGridBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(21, 117, 10, 0.12)',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.accent700,
  },

  // Sheet Sign Out
  sheetSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.card,
    backgroundColor: Palette.red50,
  },
  sheetSignOutText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.red500,
  },
});
