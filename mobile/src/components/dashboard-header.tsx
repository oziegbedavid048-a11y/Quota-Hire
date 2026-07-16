import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors, Palette, FontSize, FontWeight, Shadow, BorderRadius } from '@/constants/theme';

interface DashboardHeaderProps {
  userName?: string;
  avatarUrl?: string;
  unreadCount?: number;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export default function DashboardHeader({
  userName     = 'there',
  avatarUrl,
  unreadCount  = 0,
  onBellPress,
  onAvatarPress,
}: DashboardHeaderProps) {
  const scheme    = useColorScheme();
  const colors    = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const isDark    = scheme === 'dark';
  const firstName = userName.split(' ')[0];
  const greeting  = useMemo(getGreeting, []);
  const initial   = firstName.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(10,10,10,0.90)'
            : 'rgba(255,255,255,0.90)',
          borderBottomColor: colors.border,
        },
      ]}
    >
      {/* LEFT: Logo + Greeting */}
      <View style={styles.left}>
        <Image
          source={require('@/assets/images/logo.svg')}
          style={styles.logo}
          contentFit="contain"
        />
        <View style={styles.greetingBlock}>
          <Text style={[styles.greetingLine, { color: colors.textSecondary }]}>
            {greeting}
          </Text>
          <Text style={[styles.nameLine, { color: colors.text }]} numberOfLines={1}>
            {firstName}!
          </Text>
        </View>
      </View>

      {/* RIGHT: Bell + Avatar */}
      <View style={styles.right}>
        {/* Notification Bell */}
        <Pressable
          onPress={onBellPress}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Feather name="bell" size={19} color={colors.text} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Avatar */}
        <Pressable
          onPress={onAvatarPress}
          style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
          hitSlop={4}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[
                styles.avatarImg,
                {
                  borderColor: isDark
                    ? Palette.accent700
                    : Palette.accent200,
                },
              ]}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                {
                  backgroundColor: isDark ? Palette.accent900 : Palette.accent100,
                  borderColor:     isDark ? Palette.accent700 : Palette.accent200,
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarInitial,
                  { color: isDark ? Palette.accent200 : Palette.accent700 },
                ]}
              >
                {initial}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    flex:          1,
  },
  logo: {
    width:  30,
    height: 30,
  },
  greetingBlock: {
    gap: 0,
  },
  greetingLine: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.2,
  },
  nameLine: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  right: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  iconBtn: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
    position:       'relative',
  },
  badge: {
    position:       'absolute',
    top:            4,
    right:          4,
    backgroundColor: Palette.red500,
    borderRadius:   99,
    minWidth:       16,
    height:         16,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth:    1.5,
    borderColor:    '#fff',
  },
  badgeText: {
    color:      '#fff',
    fontSize:   9,
    fontWeight: '800',
  },
  avatarBtn: {
    borderRadius: 999,
  },
  avatarImg: {
    width:        38,
    height:       38,
    borderRadius: 19,
    borderWidth:  2,
  },
  avatarFallback: {
    width:          38,
    height:         38,
    borderRadius:   19,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize:   15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
