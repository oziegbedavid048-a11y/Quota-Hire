import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform, DeviceEventEmitter } from 'react-native';
import { Image } from 'expo-image';
import { Tabs, useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Palette, BorderRadius } from '@/constants/theme';
import Logo from '@/components/logo';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { HapticPressable } from '@/components/haptic-pressable';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { apiFetch } from '@/services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Navbar geometry constants ─────────────────────────────────────────────────
const NAV_BAR_H   = 60;          // height of the main navbar
const FAB_SIZE    = 52;          // diameter of the central FAB circle
const NOTCH_R     = 36;          // notch half-width
const NOTCH_DEPTH = 24;          // notch curve depth
const CORNER_R    = 26;          // pill corner radius
const NAV_WIDTH   = Math.min(SCREEN_WIDTH - 32, 440);

// Smooth concave notch SVG path
function getNotchedPathD(w: number, h: number, cr: number, nw: number, nd: number) {
  const cx = w / 2;
  return `M ${cr} 0 L ${cx - nw} 0 C ${cx - nw + 14} 0, ${cx - 14} ${nd}, ${cx} ${nd} C ${cx + 14} ${nd}, ${cx + nw - 14} 0, ${cx + nw} 0 L ${w - cr} 0 A ${cr} ${cr} 0 0 1 ${w} ${cr} L ${w} ${h - cr} A ${cr} ${cr} 0 0 1 ${w - cr} ${h} L ${cr} ${h} A ${cr} ${cr} 0 0 1 0 ${h - cr} L 0 ${cr} A ${cr} ${cr} 0 0 1 ${cr} 0 Z`;
}

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

        {/* Right: Notifications + Avatar Profile */}
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

// ─── FAB Speed Dial Quick Action Sheet ────────────────────────────────────────
function FabMenuSheet({
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
  const menuScale = useSharedValue(0.9);

  useEffect(() => {
    if (isOpen) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 150,
        mass: 0.8,
      });
      menuScale.value = withSpring(1, { damping: 16, stiffness: 180 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
      menuScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [isOpen]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: menuScale.value },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: isOpen ? ('auto' as const) : ('none' as const),
  }));

  const isCompany = userRole === 'company';

  // Quick Action menu items for Candidate / Employee
  const EMPLOYEE_ACTIONS = [
    { name: 'CV Generator', route: '/cv',          icon: 'file-text', color: Palette.accent600, bg: Palette.accent50, badge: 'AI' },
    { name: 'Saved Jobs',   route: '/saved-jobs',  icon: 'bookmark',  color: '#d97706', bg: '#fef3c7' },
    { name: 'Notifications',route: '/notifications',icon: 'bell',      color: '#f59e0b', bg: '#fef3c7', count: unreadCount },
    { name: 'Settings',     route: '/settings',    icon: 'settings',  color: '#64748b', bg: '#f1f5f9' },
  ];

  // Quick Action menu items for Company / Employer
  const COMPANY_ACTIONS = [
    { name: 'Post New Role',   route: '/explore',       icon: 'plus-circle', color: Palette.accent600, bg: Palette.accent50, badge: 'NEW' },
    { name: 'Company Profile', route: '/profile',       icon: 'user',        color: '#6366f1', bg: '#e0e7ff' },
    { name: 'Notifications',   route: '/notifications', icon: 'bell',        color: '#f59e0b', bg: '#fef3c7', count: unreadCount },
    { name: 'Settings',        route: '/settings',      icon: 'settings',    color: '#64748b', bg: '#f1f5f9' },
  ];

  const ACTIONS = isCompany ? COMPANY_ACTIONS : EMPLOYEE_ACTIONS;

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

      {/* Quick Action Sheet container */}
      <Animated.View
        style={[
          styles.sheetContainer,
          sheetStyle,
          { paddingBottom: Math.max(insets.bottom + 90, 100) },
        ]}
      >
        {/* Handle bar indicator */}
        <View style={styles.sheetHandleWrap}>
          <View style={styles.sheetHandle} />
        </View>

        {/* Sheet Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            ) : (
              <View style={styles.sheetAvatarFallback}>
                <Text style={styles.sheetAvatarText}>{initial}</Text>
              </View>
            )}
            <View>
              <Text style={styles.sheetTitle}>{userName || 'Quick Actions'}</Text>
              <Text style={styles.sheetSubtitle}>{isCompany ? 'Employer Quick Hub' : 'Candidate Quick Hub'}</Text>
            </View>
          </View>
          <HapticPressable style={styles.sheetCloseBtn} onPress={onClose}>
            <Feather name="x" size={18} color={Palette.neutral600} />
          </HapticPressable>
        </View>

        {/* Quick Action Options Grid */}
        <View style={styles.sheetGrid}>
          {ACTIONS.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <HapticPressable
                key={item.name}
                onPress={() => navigateTo(item.route)}
                style={({ pressed }) => [
                  styles.sheetGridItem,
                  isActive && styles.sheetGridItemActive,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
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

        {/* Sign Out Action */}
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

// ─── Floating Notched Navigation Bar with Center FAB ──────────────────────
function FloatingPillNavBar({
  userRole,
  currentRoute,
  isFabOpen,
  onToggleFab,
  onOpenMore,
}: {
  userRole?: string;
  currentRoute: string;
  isFabOpen: boolean;
  onToggleFab: () => void;
  onOpenMore: () => void;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isCompany = userRole === 'company';

  const { mode } = useLocalSearchParams<{ mode?: string }>();

  // ── Tab definitions ────────────────────────────────────────────────────────
  const tab1 = { label: 'Home',   route: '/',                   icon: 'home'       };
  const tab2 = isCompany
    ? { label: 'Profile',    route: '/profile',              icon: 'user'       }
    : { label: 'Browse',     route: '/explore',              icon: 'compass'    };
  const fabCfg = isCompany
    ? { label: 'Post Job',   route: '/explore?mode=post-job', icon: 'plus-circle'}
    : { label: 'Community',  route: '/community',            icon: 'users'      };
  const tab4 = isCompany
    ? { label: 'Applicants', route: '/tracker',              icon: 'users'      }
    : { label: 'Tracker',    route: '/tracker',              icon: 'bar-chart-2'};
  const tab5 = isCompany
    ? { label: 'Settings', route: '/settings', icon: 'settings' }
    : { label: 'More',     route: 'more',      icon: 'more-horizontal' };

  const isTab1Active = currentRoute === '/';
  const isTab2Active = isCompany ? currentRoute === '/profile' : currentRoute === '/explore';
  const isFabActive  = isCompany ? currentRoute === '/explore' : currentRoute === '/community';
  const isTab4Active = currentRoute === '/tracker';
  const isTab5Active = isCompany ? currentRoute === '/settings' : (isFabOpen || currentRoute === '/settings');

  // FAB spring-bounce on press
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const navigateTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentRoute !== route) router.replace(route as any);
  };

  const handleFabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabScale.value = withSequence(
      withTiming(0.88, { duration: 80 }),
      withSpring(1, { damping: 12, stiffness: 260 })
    );
    navigateTo(fabCfg.route);
  };

  const notchedD = getNotchedPathD(NAV_WIDTH, NAV_BAR_H, CORNER_R, NOTCH_R, NOTCH_DEPTH);

  return (
    <View
      style={{
        alignSelf: 'center',
        width: NAV_WIDTH,
        height: NAV_BAR_H,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      {/* ── SVG Notched Bar Background ─────────────────────────────────────── */}
      <Svg
        width={NAV_WIDTH}
        height={NAV_BAR_H}
        style={StyleSheet.absoluteFill}
      >
        <Path
          d={notchedD}
          fill="rgba(255,255,255,0.98)"
          stroke="rgba(226, 232, 240, 0.9)"
          strokeWidth={1.5}
        />
      </Svg>

      {/* ── 5 Equal-Width Slot Layout ───────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          paddingHorizontal: 4,
        }}
      >
        {/* 1. Home */}
        <HapticPressable
          onPress={() => navigateTo(tab1.route)}
          style={styles.pillTabItem}
        >
          <Feather
            name={tab1.icon as any}
            size={20}
            color={isTab1Active ? Palette.accent600 : Palette.neutral400}
          />
          <Text style={[styles.pillLabel, isTab1Active && styles.pillLabelActive]}>
            {tab1.label}
          </Text>
        </HapticPressable>

        {/* 2. Browse / My Jobs */}
        <HapticPressable
          onPress={() => navigateTo(tab2.route)}
          style={styles.pillTabItem}
        >
          <Feather
            name={tab2.icon as any}
            size={20}
            color={isTab2Active ? Palette.accent600 : Palette.neutral400}
          />
          <Text style={[styles.pillLabel, isTab2Active && styles.pillLabelActive]}>
            {tab2.label}
          </Text>
        </HapticPressable>

        {/* 3. Center FAB (Post Job for Company / Community for Candidate) floating above Curved Notch */}
        <View style={styles.pillTabItem}>
          <View style={{ position: 'absolute', top: -28, alignItems: 'center' }}>
            <HapticPressable onPress={handleFabPress} style={styles.fabTouchArea}>
              <LinearGradient
                colors={
                  isFabActive
                    ? [Palette.accent500, Palette.accent700]
                    : [Palette.accent400, Palette.accent600]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fabGradient}
              >
                <Animated.View style={fabStyle}>
                  <Feather name={fabCfg.icon as any} size={22} color="#FFFFFF" />
                </Animated.View>
              </LinearGradient>
            </HapticPressable>
          </View>
          <View style={{ height: 20 }} />
          <Text style={[styles.pillLabel, isFabActive && styles.pillLabelActive]}>
            {fabCfg.label}
          </Text>
        </View>

        {/* 4. Applicants / Tracker */}
        <HapticPressable
          onPress={() => navigateTo(tab4.route)}
          style={styles.pillTabItem}
        >
          <Feather
            name={tab4.icon as any}
            size={20}
            color={isTab4Active ? Palette.accent600 : Palette.neutral400}
          />
          <Text style={[styles.pillLabel, isTab4Active && styles.pillLabelActive]}>
            {tab4.label}
          </Text>
        </HapticPressable>

        {/* 5. Settings (Company) / More (Employee) */}
        <HapticPressable
          onPress={() => {
            if (isCompany) {
              navigateTo('/settings');
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onOpenMore();
            }
          }}
          style={styles.pillTabItem}
        >
          <Feather
            name={tab5.icon as any}
            size={20}
            color={isTab5Active ? Palette.accent600 : Palette.neutral400}
          />
          <Text style={[styles.pillLabel, isTab5Active && styles.pillLabelActive]}>
            {tab5.label}
          </Text>
        </HapticPressable>
      </View>
    </View>
  );
}

// ─── Main App Tabs Layout ─────────────────────────────────────────────────────
export default function AppTabs({ userRole, userName }: { userRole?: string; userName?: string }) {
  const [fabOpen, setFabOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const insets = useSafeAreaInsets();
  const segments = useSegments() as string[];

  const seg0 = (segments[0] as string) ?? '';
  const currentRoute = seg0 === '' || seg0 === '(tabs)' || seg0 === 'index' ? '/' : `/${seg0}`;

  const contentPaddingTop = (currentRoute === '/community' || currentRoute === '/community-detail')
    ? 0
    : insets.top + 64;

  // Fetch avatar cached from SecureStore and backend
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
        // Silently ignore network failures
      }
    })();

    const sub = DeviceEventEmitter.addListener('USER_AVATAR_UPDATED', (url: string) => {
      if (url) setAvatarUrl(url);
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBEB' }}>
      {/* Main Screen Stack Content */}
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

      {/* Floating Brand Header (hidden on community & community-detail) */}
      {currentRoute !== '/community' && currentRoute !== '/community-detail' && (
        <View style={styles.absoluteHeader}>
          <FloatingHeader
            onOpenMore={() => setFabOpen(true)}
            userName={userName}
            avatarUrl={avatarUrl}
            currentRoute={currentRoute}
          />
        </View>
      )}

      {/* Navigation Bar — hidden on post detail screen so user gets unobstructed comment experience, appears instantly on community page */}
      {currentRoute !== '/community-detail' && (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom + 12, 20),
            backgroundColor: 'transparent',
          }}
        >
          <FloatingPillNavBar
            userRole={userRole}
            currentRoute={currentRoute}
            isFabOpen={fabOpen}
            onToggleFab={() => setFabOpen(!fabOpen)}
            onOpenMore={() => setFabOpen(true)}
          />
        </View>
      )}

      {/* Quick Action Speed Dial Sheet */}
      <FabMenuSheet
        isOpen={fabOpen}
        onClose={() => setFabOpen(false)}
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

  // ── Navbar tab styles ─────────────────────────────────────────────────────
  pillTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.neutral500,
    textAlign: 'center',
  },
  pillLabelActive: {
    color: Palette.accent600,
    fontWeight: '900',
  },

  // ── Center FAB (circle button in the notch) ───────────────────────────────
  fabTouchArea: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    shadowColor: Palette.accent500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 14,
  },
  fabGradient: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Backdrop Overlay
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 40,
  },

  // FAB Speed Dial Sheet
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
