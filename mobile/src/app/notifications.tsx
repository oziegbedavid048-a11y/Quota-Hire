import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight, TabBarHeight } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotificationsData } from '@/hooks/useNotificationsData';
import { SkeletonNotificationItem } from '@/components/ui/skeleton';

export default function NotificationsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const {
    notifications,
    markNotificationRead,
    markAllRead,
    isLoading,
  } = useNotificationsData();

  // Expands/collapses items accordion style
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Just now';
    }
  };

  const toggleExpand = (id: string, read: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    if (!read) {
      markNotificationRead(id);
    }
  };

  const handleMarkAllRead = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAllRead();
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeAreaView style={[styles.safe, { backgroundColor: 'transparent' }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: TabBarHeight + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner header title & description */}
          <View style={styles.bannerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Stay updated with your latest job listings, candidate reviews, and pipeline matches.
              </Text>
            </View>
            {notifications.some(n => !n.read) && (
              <Pressable
                onPress={handleMarkAllRead}
                style={[styles.markAllBtn, { borderColor: Palette.accent600 }]}
              >
                <Feather name="check-square" size={12} color={Palette.accent600} />
                <Text style={styles.markAllBtnText}>Mark all read</Text>
              </Pressable>
            )}
          </View>

          {/* Content Card */}
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }, Shadow.card]}>
            {isLoading ? (
              // Skeleton loading — matches the shape of real notification rows
              <View>
                {[1, 2, 3, 4, 5].map(k => (
                  <SkeletonNotificationItem key={k} />
                ))}
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIconWrap, { backgroundColor: Palette.neutral50 }]}>
                  <Feather name="bell" size={28} color={Palette.neutral400} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  You have no new notifications right now.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {notifications.map((item, index) => {
                  const isExpanded = expandedIds.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleExpand(item.id, item.read)}
                      style={({ pressed }) => [
                        styles.item,
                        { borderBottomColor: colors.border, opacity: pressed ? 0.95 : 1 },
                        !item.read && { backgroundColor: Palette.accent50 }, // distinct background for unread
                        index === notifications.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <View style={styles.itemLeft}>
                        <View
                          style={[
                            styles.bellIconWrap,
                            {
                              backgroundColor: item.read
                                ? Palette.neutral100
                                : '#ffffff',
                            },
                          ]}
                        >
                          <Feather
                            name={item.read ? 'bell' : 'bell-off'}
                            size={15}
                            color={item.read ? Palette.neutral400 : Palette.accent500}
                          />
                        </View>
                        {!item.read && <View style={styles.unreadBadge} />}
                      </View>

                      <View style={styles.itemBody}>
                        <View style={styles.itemHeader}>
                          <Text
                            style={[
                              styles.itemTitle,
                              { color: colors.text },
                              !item.read ? { fontWeight: FontWeight.bold, fontSize: FontSize.sm } : { fontWeight: FontWeight.semibold },
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <Text style={[styles.itemTime, { color: colors.textMuted }]}>
                            {formatDate(item.createdAt)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.itemMessage,
                            { color: item.read ? colors.textSecondary : colors.text },
                            !item.read && { fontWeight: '500' },
                          ]}
                          numberOfLines={isExpanded ? undefined : 2}
                        >
                          {item.message}
                        </Text>
                        
                        <View style={styles.expandRow}>
                          <Text style={styles.expandText}>
                            {isExpanded ? 'Tap to collapse' : 'Tap to read full notification'}
                          </Text>
                          <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={11} color={Palette.neutral400} />
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  markAllBtnText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Palette.accent600,
  },
  card: {
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loaderWrap: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 4,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
  },
  list: {
    flexDirection: 'column',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  itemLeft: {
    position: 'relative',
  },
  bellIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.accent500,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  itemBody: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 13,
    maxWidth: '70%',
  },
  itemTime: {
    fontSize: 10,
    fontWeight: '500',
  },
  itemMessage: {
    fontSize: 12,
    lineHeight: 16,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  expandText: {
    fontSize: 10,
    color: Palette.neutral400,
    fontWeight: FontWeight.medium,
  },
});
