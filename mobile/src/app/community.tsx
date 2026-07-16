import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, Modal,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useCommunityData, CommunityFeedItem, CommunityPost, CommunityPoll } from '@/hooks/useCommunityData';
import { HapticPressable } from '@/components/haptic-pressable';
import { Colors, Palette, Shadow, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { SkeletonPostCard } from '@/components/ui/skeleton';

const CATEGORIES = [
  { label: '🔥 Trending', value: 'trending' },
  { label: '💬 General', value: 'general' },
  { label: '🏆 Wins', value: 'wins' },
  { label: '❓ Questions', value: 'questions' },
  { label: '💡 Tips', value: 'tips' },
  { label: '📊 Polls', value: 'polls' },
];

export default function CommunityScreen() {
  const router = useRouter();
  const colors = Colors.light;

  const {
    feed, isLoading, isRefreshing, hasError, fetchFeed,
    toggleLike, voteOnPoll, createPost, createPoll
  } = useCommunityData();

  const [activeCategory, setActiveCategory] = useState('trending');

  // Creation states
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [pollModalVisible, setPollModalVisible] = useState(false);

  // New post details
  const [postContent, setPostContent] = useState('');
  const [postCat, setPostCat] = useState('general');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // New poll details
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollChoices, setPollChoices] = useState(['', '']);
  const [pollCat, setPollCat] = useState('polls');
  const [isSubmittingPoll, setIsSubmittingPoll] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed(activeCategory);
  }, [activeCategory, fetchFeed]);

  const handleRefresh = () => {
    fetchFeed(activeCategory, true);
  };

  const handleLike = (id: string) => {
    toggleLike(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleVote = (pollId: string, choiceId: number) => {
    voteOnPoll(pollId, choiceId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Submit Post
  const handleSubmitPost = async () => {
    if (!postContent.trim()) return;
    setIsSubmittingPost(true);
    setPostError(null);
    try {
      await createPost(postContent.trim(), postCat);
      setPostContent('');
      setPostModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const msg = err?.message || 'Failed to post. Please try again.';
      setPostError(msg);
      Alert.alert('Could not post', msg);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Submit Poll
  const handleSubmitPoll = async () => {
    const validChoices = pollChoices.map(c => c.trim()).filter(Boolean);
    if (!pollQuestion.trim() || validChoices.length < 2) return;

    setIsSubmittingPoll(true);
    setPollError(null);
    try {
      await createPoll(pollQuestion.trim(), pollCat, validChoices);
      setPollQuestion('');
      setPollChoices(['', '']);
      setPollModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const msg = err?.message || 'Failed to create poll. Please try again.';
      setPollError(msg);
      Alert.alert('Could not create poll', msg);
    } finally {
      setIsSubmittingPoll(false);
    }
  };

  // Formats date relative to now
  const formatTime = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  const renderFeedItem = ({ item, index }: { item: CommunityFeedItem; index: number }) => {
    const isPost = item.type === 'post';
    const authorInit = (item.author.name || 'U').charAt(0).toUpperCase();

    if (isPost) {
      const p = item as CommunityPost;
      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.card}>
          <HapticPressable
            onPress={() => router.push({ pathname: '/community-detail', params: { id: p.id } } as any)}
            style={{ padding: 16 }}
          >
            {/* Header row */}
            <View style={styles.cardHeader}>
              <LinearGradient colors={[Palette.accent200, Palette.accent100]} style={styles.avatar}>
                <Text style={styles.avatarText}>{authorInit}</Text>
              </LinearGradient>
              <View style={styles.headerInfo}>
                <Text style={styles.authorName}>{p.author.name}</Text>
                <Text style={styles.timeText}>{formatTime(p.created_at)}</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{p.category.toUpperCase()}</Text>
              </View>
            </View>

            {/* Post content */}
            <Text style={styles.cardContent}>{p.content}</Text>

            {/* Bottom Row Buttons */}
            <View style={styles.cardActions}>
              <HapticPressable onPress={() => handleLike(p.id)} style={styles.actionButton}>
                <Feather name={p.is_liked ? 'heart' : 'heart'} size={16} color={p.is_liked ? Palette.red500 : Palette.neutral500} />
                <Text style={[styles.actionCount, p.is_liked && { color: Palette.red500 }]}>{p.likes_count}</Text>
              </HapticPressable>

              <View style={styles.actionButton}>
                <Feather name="message-square" size={16} color={Palette.neutral500} />
                <Text style={styles.actionCount}>{p.comments_count}</Text>
              </View>
            </View>
          </HapticPressable>
        </Animated.View>
      );
    } else {
      const poll = item as CommunityPoll;
      const total = poll.total_votes || 1;
      const hasVoted = poll.user_voted_choice !== undefined && poll.user_voted_choice !== null;

      return (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={styles.card}>
          <View style={{ padding: 16 }}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <LinearGradient colors={[Palette.warm100, '#FEF3C7']} style={styles.avatar}>
                <Text style={[styles.avatarText, { color: Palette.warm700 }]}>{authorInit}</Text>
              </LinearGradient>
              <View style={styles.headerInfo}>
                <Text style={styles.authorName}>{poll.author.name}</Text>
                <Text style={styles.timeText}>{formatTime(poll.created_at)}</Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: Palette.warm100 }]}>
                <Text style={[styles.categoryText, { color: Palette.warm700 }]}>POLL</Text>
              </View>
            </View>

            {/* Question */}
            <Text style={[styles.cardContent, { fontWeight: FontWeight.semibold }]}>{poll.question}</Text>

            {/* Choices */}
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
                      {hasVoted && (
                        <Text style={styles.percentText}>{percent}%</Text>
                      )}
                    </View>
                  </HapticPressable>
                );
              })}
            </View>

            {/* Total Votes */}
            <Text style={styles.totalVotesText}>{poll.total_votes} votes</Text>
          </View>
        </Animated.View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Search/Filters bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((c) => {
            const isSelected = activeCategory === c.value;
            return (
              <HapticPressable
                key={c.value}
                onPress={() => {
                  setActiveCategory(c.value);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.chip, isSelected && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>
                  {c.label}
                </Text>
              </HapticPressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Feed List */}
      {isLoading ? (
        // Skeleton loading — matches the shape of real community post cards
        <View style={[styles.listContainer, { paddingBottom: 100 }]}>
          {[1, 2, 3].map(k => <SkeletonPostCard key={k} style={{ marginBottom: 16 }} />)}
        </View>
      ) : feed.length === 0 ? (
        <View style={styles.centered}>
          <Feather name="message-square" size={48} color={Palette.neutral300} />
          <Text style={styles.emptyTitle}>
            {activeCategory === 'polls' ? 'No polls yet' : 'Nothing here yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeCategory === 'polls'
              ? 'Tap the chart icon to start a poll!'
              : 'Be the first to share a thought or start a poll!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderFeedItem}
          contentContainerStyle={styles.listContainer}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* Double FAB Buttons */}
      <View style={styles.fabContainer}>
        <HapticPressable
          onPress={() => setPollModalVisible(true)}
          style={[styles.miniFab, { backgroundColor: Palette.warm500 }]}
        >
          <Feather name="bar-chart-2" size={18} color="#fff" />
        </HapticPressable>
        <HapticPressable
          onPress={() => setPostModalVisible(true)}
          style={[styles.fab, { backgroundColor: Palette.accent500 }]}
        >
          <Feather name="edit-3" size={20} color="#fff" />
        </HapticPressable>
      </View>

      {/* CREATE POST MODAL */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share a Thought</Text>
              <HapticPressable onPress={() => setPostModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Palette.neutral600} />
              </HapticPressable>
            </View>

            {/* Category selection */}
            <Text style={styles.inputLabel}>Select Category</Text>
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

            {/* Input fields */}
            <TextInput
              multiline
              maxLength={500}
              placeholder="What's on your mind? Keep it professional..."
              placeholderTextColor={Palette.neutral400}
              value={postContent}
              onChangeText={setPostContent}
              style={styles.modalTextarea}
            />
            <Text style={styles.charCount}>{postContent.length}/500</Text>

            {/* Submit button */}
            <HapticPressable
              disabled={isSubmittingPost || !postContent.trim()}
              onPress={handleSubmitPost}
              style={[styles.submitBtn, !postContent.trim() && styles.submitBtnDisabled]}
            >
              {isSubmittingPost ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Post</Text>
              )}
            </HapticPressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CREATE POLL MODAL */}
      <Modal
        visible={pollModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPollModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create a Poll</Text>
              <HapticPressable onPress={() => setPollModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={Palette.neutral600} />
              </HapticPressable>
            </View>

            {/* Scrollable contents to avoid keyboard blocking */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Question */}
              <Text style={styles.inputLabel}>Question</Text>
              <TextInput
                maxLength={300}
                placeholder="Ask the community a question..."
                placeholderTextColor={Palette.neutral400}
                value={pollQuestion}
                onChangeText={setPollQuestion}
                style={styles.modalInput}
              />

              {/* Choices inputs */}
              <Text style={styles.inputLabel}>Options</Text>
              {pollChoices.map((choice, i) => (
                <TextInput
                  key={i}
                  maxLength={100}
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

              {/* Add choice button if < 4 options */}
              {pollChoices.length < 4 && (
                <HapticPressable
                  onPress={() => setPollChoices(prev => [...prev, ''])}
                  style={styles.addOptionBtn}
                >
                  <Feather name="plus" size={14} color={Palette.accent500} />
                  <Text style={styles.addOptionText}>Add Choice</Text>
                </HapticPressable>
              )}
            </ScrollView>

            {/* Submit button */}
            <HapticPressable
              disabled={isSubmittingPoll || !pollQuestion.trim() || pollChoices.filter(c => c.trim()).length < 2}
              onPress={handleSubmitPoll}
              style={[
                styles.submitBtn,
                (!pollQuestion.trim() || pollChoices.filter(c => c.trim()).length < 2) && styles.submitBtnDisabled
              ]}
            >
              {isSubmittingPoll ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Launch Poll</Text>
              )}
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
  filterBar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: Palette.accent500,
    borderColor: Palette.accent500,
  },
  chipLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Palette.neutral700,
  },
  chipLabelActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  cardContent: {
    fontSize: FontSize.base,
    color: Palette.neutral800,
    lineHeight: 22,
    marginBottom: 16,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 12,
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
  pollChoicesContainer: {
    gap: 8,
    marginBottom: 12,
  },
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
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(21, 117, 10, 0.08)',
  },
  pollChoiceInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    zIndex: 2,
  },
  choiceText: {
    fontSize: FontSize.sm,
    color: Palette.neutral800,
  },
  percentText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Palette.neutral700,
  },
  totalVotesText: {
    fontSize: FontSize.xs,
    color: Palette.neutral400,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.cardMd,
  },
  miniFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.cardMd,
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
  closeBtn: {
    padding: 4,
  },
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
  modalChipTextActive: {
    color: '#fff',
  },
  modalTextarea: {
    height: 120,
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
    marginBottom: 16,
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
    marginTop: 16,
  },
  submitBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  submitBtnText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: '#fff',
  },
});
