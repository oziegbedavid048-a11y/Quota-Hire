import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  View, Text, FlatList, TextInput, StyleSheet, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Alert, TouchableOpacity, Pressable, Image, Switch, DeviceEventEmitter,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle,
  withSpring, withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

import { useCommunityData, CommunityFeedItem, CommunityPost, CommunityPoll } from '@/hooks/useCommunityData';
import { HapticPressable } from '@/components/haptic-pressable';
import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { SkeletonPostCard } from '@/components/ui/skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE_MEMBERS = [
  { id: '1', name: 'Sarah M.', title: 'Enterprise AE', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: '2', name: 'David K.', title: 'SDR Lead', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Elena R.', title: 'VP of Sales', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Marcus B.', title: 'Senior AE', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: '5', name: 'Jessica T.', title: 'Account Director', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
  { id: '6', name: 'Alex Chen', title: 'Sales Ops', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { id: '7', name: 'Rachel P.', title: 'Fintech AE', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80' },
  { id: '8', name: 'James W.', title: 'Head of Growth', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { id: '9', name: 'Sophia H.', title: 'Strategic AE', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { id: '10', name: 'Michael O.', title: 'BDR Manager', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
];



const CATEGORIES = [
  { label: '🔥 Trending', value: 'trending' },
  { label: '💬 General', value: 'general' },
  { label: '🏆 Wins', value: 'wins' },
  { label: '❓ Questions', value: 'questions' },
  { label: '💡 Tips', value: 'tips' },
  { label: '📊 Polls', value: 'polls' },
];

const REPORT_REASONS = [
  { label: '🚫 Spam', value: 'spam' },
  { label: '⚠️ Inappropriate Content', value: 'inappropriate' },
  { label: '❌ Misleading Information', value: 'misleading' },
  { label: '👊 Harassment or Bullying', value: 'harassment' },
  { label: '🔖 Other', value: 'other' },
];

// AnimatedPressable for FAB sub-buttons
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function CommunityScreen() {
  const router = useRouter();

  const {
    feed, members: apiMembers, isLoading, isRefreshing, isFetchingMore, hasError, page, hasMore, fetchFeed, fetchMembers,
    toggleLike, voteOnPoll, createPost, editPost, updatePostSettings, deletePost, reportPost, createPoll,
  } = useCommunityData();

  const colors = Colors.light;

  // Track whether content is ready for skeleton loader
  const [imagesReady, setImagesReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setImagesReady(true);
    } else {
      setImagesReady(false);
    }
  }, [isLoading]);

  const insets = useSafeAreaInsets();

  // Real community members with 10-second batch rotation (20 per batch, cycling through all employees)
  const [allEmployeesPool, setAllEmployeesPool] = useState<{ id: string; name: string; avatar?: string | null }[]>([]);
  const [membersList, setMembersList] = useState<{ id: string; name: string; avatar?: string | null }[]>([]);
  const batchOffsetRef = useRef(0);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    const list: { id: string; name: string; avatar?: string | null }[] = [];
    const seenIds = new Set<string>();

    if (apiMembers && apiMembers.length > 0) {
      apiMembers.forEach(m => {
        if (m.id && !seenIds.has(m.id)) {
          seenIds.add(m.id);
          list.push({ id: m.id, name: m.name, avatar: m.avatar });
        }
      });
    }

    if (feed && feed.length > 0) {
      feed.forEach(item => {
        if (item.author && item.author.id && !item.author.name?.includes('Anonymous')) {
          const authId = item.author.id.toString();
          if (!seenIds.has(authId)) {
            seenIds.add(authId);
            list.push({ id: authId, name: item.author.name, avatar: item.author.avatar_url });
          }
        }
      });
    }

    if (list.length > 0) {
      setAllEmployeesPool(list);
      setMembersList(list.slice(0, 20));
      batchOffsetRef.current = 0;
    }
  }, [apiMembers, feed]);

  // Rotate to a new set of 20 employees every 10 seconds
  useEffect(() => {
    if (allEmployeesPool.length === 0) return;
    const BATCH_SIZE = 20;

    const timer = setInterval(() => {
      setAllEmployeesPool(pool => {
        if (pool.length === 0) return pool;

        let nextOffset = batchOffsetRef.current + BATCH_SIZE;
        if (nextOffset >= pool.length) {
          nextOffset = 0;
        }
        batchOffsetRef.current = nextOffset;

        let batch = pool.slice(nextOffset, nextOffset + BATCH_SIZE);
        if (batch.length < BATCH_SIZE && pool.length > batch.length) {
          const remainingNeeded = BATCH_SIZE - batch.length;
          const wrapItems = pool.slice(0, remainingNeeded);
          batch = [...batch, ...wrapItems];
        }

        setMembersList(batch);
        return pool;
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [allEmployeesPool.length]);



  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('user_name').then(name => {
      if (name) setCurrentUserName(name);
    });
  }, []);

  // FAB state
  const [fabOpen, setFabOpen] = useState(false);
  const fabProgress = useSharedValue(0);

  // Post modal
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [pollModalVisible, setPollModalVisible] = useState(false);

  // New post details
  const [postContent, setPostContent] = useState('');
  const [postCat, setPostCat] = useState('general');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Post privacy settings (applied at creation time — only anonymous at creation)
  const [settingAnonymous, setSettingAnonymous] = useState(false);

  // New poll details
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollChoices, setPollChoices] = useState(['', '']);
  const [pollCat, setPollCat] = useState('polls');
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);

  // 3-dot post settings menu (author only)
  const [postMenuPost, setPostMenuPost] = useState<CommunityPost | null>(null);
  const [postMenuVisible, setPostMenuVisible] = useState(false);

  // Long-press context menu (used for edit/delete confirmation)
  const [contextPost, setContextPost] = useState<CommunityPost | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);

  // Edit modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Report modal
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportPost_state, setReportPost_state] = useState<CommunityPost | null>(null);
  const [reportReason, setReportReason] = useState('spam');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Bookmark state
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});
  const handleToggleBookmark = (id: string) => {
    setBookmarkedPosts(prev => ({ ...prev, [id]: !prev[id] }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Listen for bottom tab bar plus button tap on community page
  useEffect(() => {
    const listener = DeviceEventEmitter.addListener('open-create-post-modal', () => {
      setPostModalVisible(true);
    });
    return () => listener.remove();
  }, []);

  // Fetch feed on initial load cleanly without triggering infinite focus re-renders
  useEffect(() => {
    fetchFeed('');
  }, [fetchFeed]);

  const handleRefresh = () => fetchFeed('', true);

  const handleLoadMore = () => {
    if (!hasMore || isFetchingMore) return;
    fetchFeed('', false, page + 1);
  };

  const handleLike = (id: string) => {
    toggleLike(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleVote = (pollId: string, choiceId: number) => {
    voteOnPoll(pollId, choiceId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleFab = () => {
    const next = !fabOpen;
    setFabOpen(next);
    // withTiming gives a snappier instant-pop feel vs springify wobble
    fabProgress.value = withTiming(next ? 1 : 0, { duration: 180 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeFab = () => {
    setFabOpen(false);
    fabProgress.value = withTiming(0, { duration: 150 });
  };

  const openModal = (which: 'post' | 'poll') => {
    // Close FAB first, then immediately open the modal — no setTimeout needed
    setFabOpen(false);
    fabProgress.value = withTiming(0, { duration: 150 });
    if (which === 'post') setPostModalVisible(true);
    else if (which === 'poll') setPollModalVisible(true);
  };

  // Submit Post
  const handleSubmitPost = async () => {
    if (!postContent.trim()) return;
    setIsSubmittingPost(true);
    try {
      await createPost(postContent.trim(), postCat, {
        is_anonymous: settingAnonymous,
      });
      setPostContent('');
      setSettingAnonymous(false);
      setPostModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Could not post', err?.message || 'Please try again.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Submit Poll
  const handleSubmitPoll = async () => {
    const validChoices = pollChoices.map(c => c.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validChoices.length < 2) return;
    setIsSubmittingPoll(true);
    try {
      await createPoll(pollQuestion.trim(), pollCat, validChoices);
      setPollQuestion('');
      setPollChoices(['', '']);
      setPollModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Could not create poll', err?.message || 'Please try again.');
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  // Open edit modal pre-filled (from 3-dot menu)
  const openEditModal = (post: CommunityPost) => {
    setContextPost(post);
    setPostMenuVisible(false);
    setEditContent(post.content);
    setTimeout(() => setEditModalVisible(true), 200);
  };

  // Confirm delete (from 3-dot menu)
  const handleDeletePost = (post: CommunityPost) => {
    setPostMenuVisible(false);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to permanently delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(post.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert('Error', 'Could not delete post. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Open report modal for a specific post (non-author)
  const openReportModal = (post: CommunityPost) => {
    setReportPost_state(post);
    setReportReason('spam');
    setReportModalVisible(true);
  };

  // Submit edit
  const handleSubmitEdit = async () => {
    if (!contextPost || !editContent.trim()) return;
    setIsSubmittingEdit(true);
    try {
      await editPost(contextPost.id, editContent.trim());
      setEditModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Could not edit post', err?.message || 'Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Submit report
  const handleSubmitReport = async () => {
    if (!reportPost_state) return;
    setIsSubmittingReport(true);
    try {
      await reportPost(reportPost_state.id, reportReason);
      setReportModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Reported', 'Thank you for keeping the community safe. Our team will review this post.');
    } catch (err: any) {
      const msg = err?.message || 'Could not submit report.';
      if (msg.includes('already reported')) {
        Alert.alert('Already Reported', 'You have already reported this post.');
        setReportModalVisible(false);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return `${Math.floor(hrs / 24)}d ago`;
    } catch { return ''; }
  };

  // Avatar component — real photo if available, gradient initial otherwise, or incognito icon for anonymous
  const AuthorAvatar = ({ author, isPost, isAnonymous }: { author: CommunityPost['author'] | CommunityPoll['author']; isPost: boolean; isAnonymous?: boolean }) => {
    if (isAnonymous || author?.name === 'Anonymous') {
      return (
        <LinearGradient colors={[Palette.neutral400, Palette.neutral500]} style={styles.avatar}>
          <Feather name="user" size={18} color="#fff" />
        </LinearGradient>
      );
    }
    const init = (author?.name || 'A').charAt(0).toUpperCase();
    if (author?.avatar_url) {
      return (
        <Image
          source={{ uri: author.avatar_url }}
          style={styles.avatar}
        />
      );
    }
    if (isPost) {
      return (
        <LinearGradient colors={[Palette.accent200, Palette.accent100]} style={styles.avatar}>
          <Text style={styles.avatarText}>{init}</Text>
        </LinearGradient>
      );
    }
    return (
      <LinearGradient colors={[Palette.warm100, '#FEF3C7']} style={styles.avatar}>
        <Text style={[styles.avatarText, { color: Palette.warm700 }]}>{init}</Text>
      </LinearGradient>
    );
  };

  const renderFeedItem = ({ item, index }: { item: CommunityFeedItem; index: number }) => {
    const isPost = item.type === 'post';

    if (isPost) {
      const p = item as CommunityPost;
      const isAuthor = p.is_author || (currentUserName !== null && p.author.name === currentUserName);

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.card}>
          <Pressable
            onPress={() => router.push({ pathname: '/community-detail', params: { id: p.id } } as any)}
            style={{ paddingHorizontal: 16, paddingVertical: 12 }}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <AuthorAvatar author={p.author} isPost={true} isAnonymous={p.is_anonymous} />
              <View style={styles.headerInfo}>
                <Text style={styles.authorName}>
                  {p.is_anonymous ? (isAuthor ? 'Anonymous (You)' : 'Anonymous') : p.author.name}
                </Text>
                <Text style={styles.timeText}>{formatTime(p.created_at)}</Text>
              </View>
              <View style={styles.headerRight}>
                {p.is_anonymous && (
                  <View style={styles.anonBadge}>
                    <Feather name="eye-off" size={10} color={Palette.neutral500} />
                  </View>
                )}
                {/* 3-dot menu for author only */}
                {isAuthor && (
                  <Pressable
                    onPress={() => { setPostMenuPost(p); setPostMenuVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={styles.threeDotBtn}
                    hitSlop={8}
                  >
                    <Feather name="more-vertical" size={18} color={Palette.neutral500} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Post content */}
            <Text style={styles.cardContent}>{p.content}</Text>

            {/* Bottom actions */}
            <View style={styles.cardActions}>
              <HapticPressable onPress={() => handleLike(p.id)} style={styles.actionButton}>
                {p.is_liked ? (
                  <FontAwesome name="heart" size={19} color={Palette.red500} />
                ) : (
                  <FontAwesome name="heart-o" size={19} color={Palette.neutral500} />
                )}
                {!p.hide_likes && p.likes_count !== null ? (
                  <Text style={[styles.actionCount, p.is_liked && { color: Palette.red500 }]}>{p.likes_count}</Text>
                ) : null}
              </HapticPressable>

              {!p.comments_disabled && (
                <View style={styles.actionButton}>
                  <Feather name="message-square" size={19} color={Palette.neutral500} />
                  <Text style={styles.actionCount}>{p.comments_count}</Text>
                </View>
              )}

              <HapticPressable onPress={() => handleToggleBookmark(p.id)} style={styles.actionButton}>
                <Feather
                  name="bookmark"
                  size={19}
                  color={bookmarkedPosts[p.id] ? Palette.accent600 : Palette.neutral400}
                  style={bookmarkedPosts[p.id] ? { opacity: 1 } : { opacity: 0.7 }}
                />
              </HapticPressable>

              {!isAuthor && (
                <Pressable onPress={() => openReportModal(p)} style={[styles.actionButton, { marginLeft: 'auto' }]}>
                  <Feather name="flag" size={18} color={Palette.neutral400} />
                </Pressable>
              )}
            </View>
          </Pressable>
        </Animated.View>
      );
    } else {
      const poll = item as CommunityPoll;
      const total = poll.total_votes || 1;
      const hasVoted = poll.user_voted_choice !== undefined && poll.user_voted_choice !== null;

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.card}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={styles.cardHeader}>
              <AuthorAvatar author={poll.author} isPost={false} />
              <View style={styles.headerInfo}>
                <Text style={styles.authorName}>{poll.author.name}</Text>
                <Text style={styles.timeText}>{formatTime(poll.created_at)}</Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: Palette.warm100 }]}>
                <Text style={[styles.categoryText, { color: Palette.warm700 }]}>POLL</Text>
              </View>
            </View>

            <Text style={[styles.cardContent, { fontWeight: FontWeight.semibold }]}>{poll.question}</Text>

            <View style={styles.pollChoicesContainer}>
              {poll.choices.map((c) => {
                const percent = Math.round((c.votes_count / total) * 100);
                const isSelected = poll.user_voted_choice === c.id;
                return (
                  <HapticPressable
                    key={c.id}
                    disabled={hasVoted}
                    onPress={() => handleVote(poll.id, c.id)}
                    style={[styles.pollChoiceRow, isSelected && styles.pollChoiceSelected]}
                  >
                    {hasVoted && (
                      <View style={[styles.pollProgressFill, { width: `${percent}%` }]} />
                    )}
                    <View style={styles.pollChoiceInner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {isSelected && <Feather name="check-circle" size={14} color={Palette.accent500} />}
                        <Text style={[styles.choiceText, isSelected && { fontWeight: FontWeight.semibold }]}>
                          {c.text}
                        </Text>
                      </View>
                      {hasVoted && <Text style={styles.percentText}>{percent}%</Text>}
                    </View>
                  </HapticPressable>
                );
              })}
            </View>
            <Text style={styles.totalVotesText}>{poll.total_votes} votes</Text>
          </View>
        </Animated.View>
      );
    }
  };

  // Animated styles for FAB sub-buttons (now only 2: Post + Poll)
  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(fabProgress.value, [0, 1], [0, 45], Extrapolation.CLAMP)}deg` }],
  }));

  const subBtn1Style = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [
      { translateY: interpolate(fabProgress.value, [0, 1], [0, -130], Extrapolation.CLAMP) },
      { scale: interpolate(fabProgress.value, [0, 1], [0.4, 1], Extrapolation.CLAMP) },
    ],
  }));
  const subBtn2Style = useAnimatedStyle(() => ({
    opacity: fabProgress.value,
    transform: [
      { translateY: interpolate(fabProgress.value, [0, 1], [0, -70], Extrapolation.CLAMP) },
      { scale: interpolate(fabProgress.value, [0, 1], [0.4, 1], Extrapolation.CLAMP) },
    ],
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(fabProgress.value, [0, 1], [0, 0.35], Extrapolation.CLAMP),
    pointerEvents: fabOpen ? 'auto' : 'none',
  } as any));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFBEB', '#F1FAF4', '#FFFBEB']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Feed */}
      <FlatList
        data={feed}
        keyExtractor={(item, index) =>
          `${(item as any).type}-${(item as any).id}`
        }
        renderItem={({ item, index }) => {
          return renderFeedItem({ item: item as CommunityFeedItem, index });
        }}
        ListHeaderComponent={
          <View>
            {/* Merged Top Community Header Cover */}
            <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: 16 }}>
              <View style={[styles.heroCoverCardHeader, { paddingTop: Math.max(insets.top + 8, 20) }]}>
                <ExpoImage
                  source={require('@/assets/images/illustrations/community_illustration.webp')}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                {/* Gradient dark overlay */}
                <LinearGradient
                  colors={['rgba(15, 23, 42, 0.60)', 'rgba(15, 23, 42, 0.85)']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />

                {/* Title and Subtitle inside header cover */}
                <View style={styles.heroCoverContent}>
                  <Text style={styles.coverTopTitle}>Quotahire Community</Text>
                  <Text style={styles.heroCoverSub}>
                    Connect, share insights & grow with top sales professionals
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Members Horizontal Carousel */}
            <View style={{ marginBottom: 18 }}>
              <View style={styles.sectionTitleRow}>
                <Text style={[styles.sectionHeading, { color: Palette.neutral900 }]}>Members</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
              >
                {membersList.map((m) => (
                  <View key={m.id} style={{ alignItems: 'center', width: 62 }}>
                    <View style={styles.activeAvatarWrap}>
                      {m.avatar ? (
                        <Image source={{ uri: m.avatar }} style={styles.activeAvatarImg} />
                      ) : (
                        <LinearGradient colors={[Palette.accent200, Palette.accent100]} style={[styles.activeAvatarImg, { justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ fontWeight: '700', color: Palette.accent700, fontSize: 16 }}>
                            {(m.name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </LinearGradient>
                      )}
                      <View style={styles.onlineStatusBadge} />
                    </View>
                    <Text style={[styles.activeMemberName, { color: Palette.neutral900 }]} numberOfLines={1}>
                      {m.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          imagesReady ? (
            <View style={[styles.centered, { marginTop: 40 }]}>
              <Feather name="message-square" size={48} color={Palette.neutral300} />
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to share a thought!</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContainer}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={4}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListFooterComponent={isFetchingMore ? (
          <ActivityIndicator size="small" color={Palette.accent600} style={{ paddingVertical: 12 }} />
        ) : null}
      />

      {/* FAB overlay dim */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.fabOverlay, overlayStyle]} pointerEvents={fabOpen ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeFab} />
      </Animated.View>

      {/* FAB container */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        {/* Sub-buttons only rendered when FAB is open — avoids invisible-but-blocking issue */}
        {fabOpen && (
          <>
            {/* Sub button 2: Poll */}
            <Animated.View entering={FadeInDown.duration(120)} style={[styles.subFabWrapper, { bottom: 80 }]}>
              <TouchableOpacity
                onPress={() => openModal('poll')}
                style={[styles.subFab, { backgroundColor: Palette.warm500 }]}
                activeOpacity={0.85}
              >
                <Feather name="bar-chart-2" size={18} color="#fff" />
                <Text style={styles.subFabLabel}>Poll</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Sub button 1: Post */}
            <Animated.View entering={FadeInDown.duration(80)} style={[styles.subFabWrapper, { bottom: 148 }]}>
              <TouchableOpacity
                onPress={() => openModal('post')}
                style={[styles.subFab, { backgroundColor: Palette.accent500 }]}
                activeOpacity={0.85}
              >
                <Feather name="edit-3" size={18} color="#fff" />
                <Text style={styles.subFabLabel}>Post</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}

        {/* Main + FAB */}
        <TouchableOpacity onPress={toggleFab} style={styles.mainFab} activeOpacity={0.85}>
          <Animated.View style={fabIconStyle}>
            <Feather name="plus" size={26} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* ── 3-DOT POST SETTINGS MENU (author only) ── */}
      <Modal visible={postMenuVisible} transparent animationType="fade" onRequestClose={() => setPostMenuVisible(false)}>
        <Pressable style={styles.contextOverlay} onPress={() => setPostMenuVisible(false)}>
          <View style={styles.contextMenu}>
            <Text style={styles.contextTitle} numberOfLines={2}>
              {postMenuPost?.content?.substring(0, 60)}{(postMenuPost?.content?.length ?? 0) > 60 ? '…' : ''}
            </Text>

            {/* Edit Post */}
            <TouchableOpacity style={styles.contextItem} onPress={() => postMenuPost && openEditModal(postMenuPost)}>
              <Feather name="edit-2" size={18} color={Palette.accent600} />
              <Text style={styles.contextItemText}>Edit Post</Text>
            </TouchableOpacity>

            <View style={styles.contextDivider} />

            {/* Toggle Comments */}
            <TouchableOpacity
              style={styles.contextItem}
              onPress={() => {
                if (!postMenuPost) return;
                updatePostSettings(postMenuPost.id, { comments_disabled: !postMenuPost.comments_disabled });
                setPostMenuPost(prev => prev ? { ...prev, comments_disabled: !prev.comments_disabled } : prev);
              }}
            >
              <Feather name="message-square" size={18} color={postMenuPost?.comments_disabled ? Palette.red500 : Palette.neutral600} />
              <Text style={styles.contextItemText}>
                {postMenuPost?.comments_disabled ? 'Enable Comments' : 'Disable Comments'}
              </Text>
            </TouchableOpacity>

            <View style={styles.contextDivider} />

            {/* Toggle Likes visibility */}
            <TouchableOpacity
              style={styles.contextItem}
              onPress={() => {
                if (!postMenuPost) return;
                updatePostSettings(postMenuPost.id, { hide_likes: !postMenuPost.hide_likes });
                setPostMenuPost(prev => prev ? { ...prev, hide_likes: !prev.hide_likes } : prev);
              }}
            >
              <FontAwesome name={postMenuPost?.hide_likes ? 'eye' : 'eye-slash'} size={18} color={Palette.neutral600} />
              <Text style={styles.contextItemText}>
                {postMenuPost?.hide_likes ? 'Show Like Count' : 'Hide Like Count'}
              </Text>
            </TouchableOpacity>

            <View style={styles.contextDivider} />

            {/* Delete Post */}
            <TouchableOpacity style={styles.contextItem} onPress={() => postMenuPost && handleDeletePost(postMenuPost)}>
              <Feather name="trash-2" size={18} color={Palette.red500} />
              <Text style={[styles.contextItemText, { color: Palette.red500 }]}>Delete Post</Text>
            </TouchableOpacity>

            <View style={styles.contextDivider} />

            <TouchableOpacity style={styles.contextItem} onPress={() => setPostMenuVisible(false)}>
              <Feather name="x" size={18} color={Palette.neutral500} />
              <Text style={[styles.contextItemText, { color: Palette.neutral500 }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* ── EDIT MODAL ── */}
      <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Post</Text>
              <HapticPressable onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Palette.neutral600} />
              </HapticPressable>
            </View>
            <TextInput
              multiline
              maxLength={500}
              value={editContent}
              onChangeText={setEditContent}
              style={styles.modalTextarea}
              placeholderTextColor={Palette.neutral400}
              placeholder="Edit your post..."
            />
            <Text style={styles.charCount}>{editContent.length}/500</Text>
            <HapticPressable
              disabled={isSubmittingEdit || !editContent.trim()}
              onPress={handleSubmitEdit}
              style={[styles.submitBtn, !editContent.trim() && styles.submitBtnDisabled]}
            >
              {isSubmittingEdit ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Save Changes</Text>}
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── REPORT MODAL ── */}
      <Modal visible={reportModalVisible} transparent animationType="slide" onRequestClose={() => setReportModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Post</Text>
              <HapticPressable onPress={() => setReportModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Palette.neutral600} />
              </HapticPressable>
            </View>
            <Text style={styles.inputLabel}>Why are you reporting this post?</Text>
            <View style={{ gap: 8, marginBottom: 20 }}>
              {REPORT_REASONS.map(r => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => setReportReason(r.value)}
                  style={[styles.reportOption, reportReason === r.value && styles.reportOptionActive]}
                >
                  <Text style={[styles.reportOptionText, reportReason === r.value && styles.reportOptionTextActive]}>
                    {r.label}
                  </Text>
                  {reportReason === r.value && <Feather name="check" size={16} color={Palette.accent600} />}
                </TouchableOpacity>
              ))}
            </View>
            <HapticPressable onPress={handleSubmitReport} style={styles.reportSubmitBtn} disabled={isSubmittingReport}>
              {isSubmittingReport
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.submitBtnText}>Submit Report</Text>}
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── CREATE POST MODAL ── */}
      <Modal visible={postModalVisible} animationType="slide" transparent onRequestClose={() => setPostModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share a Thought</Text>
              <HapticPressable onPress={() => setPostModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Palette.neutral600} />
              </HapticPressable>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.modalCategoryRow}>
              {CATEGORIES.slice(1, 5).map((c) => {
                const isSelected = postCat === c.value;
                return (
                  <HapticPressable
                    key={c.value}
                    onPress={() => setPostCat(c.value)}
                    style={[styles.modalChip, isSelected && styles.modalChipActive]}
                  >
                    <Text style={[styles.modalChipText, isSelected && styles.modalChipTextActive]}>
                      {c.label.substring(2)}
                    </Text>
                  </HapticPressable>
                );
              })}
            </View>

            <TextInput
              multiline maxLength={500}
              placeholder="What's on your mind? Keep it professional..."
              placeholderTextColor={Palette.neutral400}
              value={postContent}
              onChangeText={setPostContent}
              style={styles.modalTextarea}
            />
            <Text style={styles.charCount}>{postContent.length}/500</Text>

            {/* Anonymous toggle row — fully touchable card with instant haptic feedback */}
            <HapticPressable
              onPress={() => {
                setSettingAnonymous(prev => !prev);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[
                styles.privacyRow,
                {
                  marginTop: 12,
                  marginBottom: 4,
                  backgroundColor: settingAnonymous ? '#F0FDF4' : '#F8FAFF',
                  borderColor: settingAnonymous ? Palette.accent300 : '#E2E8F0',
                  borderWidth: 1.5,
                  borderRadius: 12,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather
                    name={settingAnonymous ? 'eye-off' : 'user'}
                    size={16}
                    color={settingAnonymous ? Palette.accent600 : Palette.neutral500}
                  />
                  <Text style={[styles.privacyLabel, settingAnonymous && { color: Palette.accent700, fontWeight: '800' }]}>
                    Post anonymously
                  </Text>
                </View>
                <Text style={styles.privacyDesc}>Others will see "Anonymous" as the author</Text>
              </View>
              <View pointerEvents="none">
                <Switch
                  value={settingAnonymous}
                  onValueChange={setSettingAnonymous}
                  trackColor={{ true: Palette.accent400, false: '#CBD5E1' }}
                  thumbColor={settingAnonymous ? Palette.accent600 : '#f4f3f4'}
                />
              </View>
            </HapticPressable>

            <HapticPressable
              disabled={isSubmittingPost || !postContent.trim()}
              onPress={handleSubmitPost}
              style={[styles.submitBtn, !postContent.trim() && styles.submitBtnDisabled]}
            >
              {isSubmittingPost ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Post</Text>}
            </HapticPressable>

            {/* Create Poll option button at bottom of modal */}
            <HapticPressable
              onPress={() => {
                setPostModalVisible(false);
                setTimeout(() => setPollModalVisible(true), 150);
              }}
              style={styles.pollOptionBtn}
            >
              <View style={styles.pollOptionLeft}>
                <View style={styles.pollIconWrap}>
                  <Feather name="bar-chart-2" size={16} color={Palette.accent600} />
                </View>
                <View>
                  <Text style={styles.pollOptionTitle}>Create a Poll</Text>
                  <Text style={styles.pollOptionSub}>Ask the community for votes & feedback</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={Palette.neutral400} />
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── CREATE POLL MODAL ── */}
      <Modal visible={pollModalVisible} animationType="slide" transparent onRequestClose={() => setPollModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create a Poll</Text>
              <HapticPressable onPress={() => setPollModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Palette.neutral600} />
              </HapticPressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Question</Text>
              <TextInput
                maxLength={300}
                placeholder="Ask the community a question..."
                placeholderTextColor={Palette.neutral400}
                value={pollQuestion}
                onChangeText={setPollQuestion}
                style={styles.modalInput}
              />
              <Text style={styles.inputLabel}>Options</Text>
              {pollChoices.map((choice, i) => (
                <TextInput
                  key={i} maxLength={100}
                  placeholder={`Choice ${i + 1}`}
                  placeholderTextColor={Palette.neutral400}
                  value={choice}
                  onChangeText={(text) => {
                    const next = [...pollChoices];
                    next[i] = text;
                    setPollChoices(next);
                  }}
                  style={styles.modalInput}
                />
              ))}
              {pollChoices.length < 4 && (
                <HapticPressable onPress={() => setPollChoices(prev => [...prev, ''])} style={styles.addOptionBtn}>
                  <Feather name="plus" size={14} color={Palette.accent500} />
                  <Text style={styles.addOptionText}>Add Choice</Text>
                </HapticPressable>
              )}
            </ScrollView>
            <HapticPressable
              disabled={isSubmittingPoll || !pollQuestion.trim() || pollChoices.filter(c => c.trim()).length < 2}
              onPress={handleSubmitPoll}
              style={[styles.submitBtn, (!pollQuestion.trim() || pollChoices.filter(c => c.trim()).length < 2) && styles.submitBtnDisabled]}
            >
              {isSubmittingPoll ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Launch Poll</Text>}
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBEB',
  },
  // ── Hero Banner ──
  heroBanner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  blob1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  blob2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 120, height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(21,117,10,0.05)',
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
    color: Palette.accent700,
  },
  heroTitle: {
    fontSize: 24, fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 6,
    color: Palette.neutral900,
  },
  heroSub: {
    fontSize: 12, lineHeight: 17,
    color: Palette.neutral600,
  },
  heroImage: {
    width: 100, height: 100,
    flexShrink: 0,
  },
  listContainer: {
    paddingTop: 0,
    paddingBottom: 120,
    paddingHorizontal: 0,
  },
  card: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  pollCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Palette.accent700,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Palette.neutral900,
  },
  timeText: {
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 2,
  },
  anonBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Palette.accent50,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Palette.accent700,
  },
  threeDotBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  cardContent: {
    fontSize: FontSize.base,
    color: Palette.neutral800,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontSize: FontSize.sm,
    color: Palette.neutral500,
    fontWeight: FontWeight.medium,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.7,
  },
  authorBadgeText: {
    fontSize: 10,
    color: Palette.accent400,
  },
  pollChoicesContainer: { gap: 8, marginBottom: 12 },
  pollChoiceRow: {
    height: 46,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  pollChoiceSelected: {
    borderColor: Palette.accent300,
    backgroundColor: Palette.accent50,
  },
  pollProgressFill: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(21, 117, 10, 0.08)',
  },
  pollChoiceInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    zIndex: 2,
  },
  choiceText: { fontSize: FontSize.sm, color: Palette.neutral800 },
  percentText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Palette.neutral700 },
  totalVotesText: { fontSize: FontSize.xs, color: Palette.neutral400 },
  // FAB
  fabOverlay: {
    backgroundColor: '#0f172a',
    zIndex: 10,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    alignItems: 'center',
    zIndex: 20,
  },
  mainFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Palette.accent600,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.cardMd,
  },
  subFabWrapper: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
  },
  subFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    ...Shadow.cardMd,
  },
  subFabLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
  // Context menu
  contextOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  contextMenu: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  contextTitle: {
    fontSize: FontSize.sm,
    color: Palette.neutral500,
    padding: 16,
    paddingBottom: 12,
    fontStyle: 'italic',
  },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  contextItemText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    color: Palette.neutral800,
  },
  contextDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  // Report
  reportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#f8fafc',
  },
  reportOptionActive: {
    borderColor: Palette.accent400,
    backgroundColor: Palette.accent50,
  },
  reportOptionText: {
    fontSize: FontSize.sm,
    color: Palette.neutral700,
    fontWeight: FontWeight.medium,
  },
  reportOptionTextActive: {
    color: Palette.accent700,
    fontWeight: FontWeight.semibold,
  },
  reportSubmitBtn: {
    height: 52,
    borderRadius: BorderRadius.button,
    backgroundColor: Palette.red500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Privacy
  privacySection: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#f8fafc',
    marginBottom: 16,
    overflow: 'hidden',
  },
  privacyTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Palette.neutral500,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Palette.neutral800,
  },
  privacyDesc: {
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 2,
  },
  settingsDesc: {
    fontSize: FontSize.sm,
    color: Palette.neutral500,
    lineHeight: 20,
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Palette.neutral700,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Palette.neutral500,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Palette.neutral900,
  },
  closeBtn: { padding: 4 },
  inputLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Palette.neutral700,
    marginBottom: 8,
    marginTop: 12,
  },
  modalCategoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#fff',
  },
  modalChipActive: {
    backgroundColor: Palette.accent500,
    borderColor: Palette.accent500,
  },
  modalChipText: {
    fontSize: FontSize.xs,
    color: Palette.neutral600,
    fontWeight: FontWeight.semibold,
  },
  modalChipTextActive: { color: '#fff' },
  modalTextarea: {
    height: 100,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: FontSize.base,
    color: Palette.neutral800,
    textAlignVertical: 'top',
    backgroundColor: '#f8fafc',
  },
  charCount: {
    fontSize: 11,
    color: Palette.neutral400,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 12,
  },
  modalInput: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    fontSize: FontSize.sm,
    color: Palette.neutral800,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 16,
  },
  addOptionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Palette.accent500,
  },
  submitBtn: {
    height: 52,
    borderRadius: BorderRadius.button,
    backgroundColor: Palette.accent500,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#E2E8F0' },
  submitBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
  pollOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    padding: 12,
    marginTop: 12,
  },
  pollOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pollIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.accent50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollOptionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Palette.neutral800,
  },
  pollOptionSub: {
    fontSize: 11,
    color: Palette.neutral400,
    marginTop: 1,
  },
  // ── Merged Top Header Cover ──
  heroCoverCardHeader: {
    height: 195,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    elevation: 4,
  },
  coverTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 3,
  },
  coverBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  coverTopTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroCoverContent: {
    padding: 16,
    zIndex: 2,
    alignItems: 'center',
  },
  communityTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: 6,
  },
  activeDotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  communityTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  heroCoverTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  heroCoverSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    textAlign: 'center',
  },
  // ── Active Members Carousel ──
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  liveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  activeAvatarWrap: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: '#10B981',
    padding: 1.5,
  },
  activeAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  onlineStatusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  activeMemberName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
  },
  activeMemberTitle: {
    fontSize: 9,
    textAlign: 'center',
  },
});
