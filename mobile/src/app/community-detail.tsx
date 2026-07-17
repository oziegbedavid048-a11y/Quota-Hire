import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, SafeAreaView, Alert, Image, Modal,
  Pressable, Keyboard, Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ExpoClipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  SlideInDown, SlideOutDown, FadeIn, FadeOut,
  withTiming, useSharedValue, useAnimatedStyle,
} from 'react-native-reanimated';

import { useCommunityData, CommunityPost, CommunityComment } from '@/hooks/useCommunityData';
import { apiFetch } from '@/services/api';
import { HapticPressable } from '@/components/haptic-pressable';
import { Colors, Palette, BorderRadius, FontSize, FontWeight } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActionSheetComment = CommunityComment & { _isAuthor: boolean };

// Group top-level comments with their replies
interface CommentGroup {
  comment: CommunityComment;
  replies: CommunityComment[];
}

// ─── Avatar Helper ────────────────────────────────────────────────────────────
function AvatarImage({ author, size = 40 }: { author: any; size?: number }) {
  const init = (author?.name || 'U').charAt(0).toUpperCase();
  if (author?.avatar_url) {
    return (
      <Image
        source={{ uri: author.avatar_url }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return (
    <LinearGradient
      colors={[Palette.accent200, Palette.accent100]}
      style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}
    >
      <Text style={{ fontSize: size * 0.42, fontWeight: FontWeight.bold, color: Palette.accent700 }}>
        {init}
      </Text>
    </LinearGradient>
  );
}

// ─── Format Time ─────────────────────────────────────────────────────────────
function formatTime(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  } catch { return ''; }
}

// ─── Build comment groups (top-level + nested replies) ────────────────────────
function buildGroups(allComments: CommunityComment[]): CommentGroup[] {
  const topLevel = allComments.filter(c => !c.parent);

  // Build a map of parentId → children for O(1) lookup
  const childMap = new Map<string, CommunityComment[]>();
  allComments.filter(c => !!c.parent).forEach(r => {
    const pid = r.parent!;
    if (!childMap.has(pid)) childMap.set(pid, []);
    childMap.get(pid)!.push(r);
  });

  // Recursively collect all descendants in insertion order
  function getDescendants(id: string): CommunityComment[] {
    const direct = childMap.get(id) || [];
    const result: CommunityComment[] = [];
    direct.forEach(child => {
      result.push(child);
      result.push(...getDescendants(child.id));
    });
    return result;
  }

  return topLevel.map(comment => ({
    comment,
    replies: getDescendants(comment.id),
  }));
}

// ─── Single Comment Row ───────────────────────────────────────────────────────
function CommentRow({
  item,
  isReply = false,
  onLongPress,
  onLike,
  onDislike,
}: {
  item: CommunityComment;
  isReply?: boolean;
  onLongPress: (c: CommunityComment) => void;
  onLike: (c: CommunityComment) => void;
  onDislike: (c: CommunityComment) => void;
}) {
  return (
    <Pressable
      onLongPress={() => onLongPress(item)}
      delayLongPress={500}
      style={[styles.commentRow, isReply && styles.replyRow]}
    >
      <AvatarImage author={item.author} size={isReply ? 28 : 34} />
      <View style={styles.commentBody}>
        <View style={styles.commentMeta}>
          <Text style={[styles.commentAuthor, isReply && { fontSize: 12 }]}>{item.author.name}</Text>
          <Text style={styles.commentTime}>{formatTime(item.created_at)}</Text>
        </View>
        <Text style={[styles.commentText, isReply && { fontSize: 13 }]}>{item.content}</Text>
      </View>

      {/* Like / Dislike stacked vertically on the right */}
      <View style={styles.commentActions}>
        <HapticPressable onPress={() => onLike(item)} style={styles.commentActionBtn}>
          <FontAwesome
            name={item.is_liked ? 'thumbs-up' : 'thumbs-o-up'}
            size={14}
            color={item.is_liked ? Palette.accent600 : Palette.neutral400}
          />
          {item.likes_count > 0 && (
            <Text style={[styles.commentActionCount, item.is_liked && { color: Palette.accent600 }]}>
              {item.likes_count}
            </Text>
          )}
        </HapticPressable>

        <View style={styles.actionSpacer} />

        <HapticPressable onPress={() => onDislike(item)} style={styles.commentActionBtn}>
          <FontAwesome
            name={item.is_disliked ? 'thumbs-down' : 'thumbs-o-down'}
            size={14}
            color={item.is_disliked ? Palette.red500 : Palette.neutral400}
          />
          {item.dislikes_count > 0 && (
            <Text style={[styles.commentActionCount, item.is_disliked && { color: Palette.red500 }]}>
              {item.dislikes_count}
            </Text>
          )}
        </HapticPressable>
      </View>
    </Pressable>
  );
}

// ─── Comment Group (top-level + collapsible replies with thread line) ─────────
function CommentGroupItem({
  group,
  onLongPress,
  onLike,
  onDislike,
  onReply,
}: {
  group: CommentGroup;
  onLongPress: (c: CommunityComment) => void;
  onLike: (c: CommunityComment) => void;
  onDislike: (c: CommunityComment) => void;
  onReply: (c: CommunityComment) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { comment, replies } = group;

  return (
    <View style={styles.commentGroupContainer}>
      <CommentRow item={comment} onLongPress={onLongPress} onLike={onLike} onDislike={onDislike} />

      {replies.length > 0 && (
        <View style={styles.repliesWrapper}>
          {/* Vertical thread line — positioned at centre of parent avatar */}
          <View style={styles.threadLine} pointerEvents="none" />

          {/* "View X replies" button — paddingLeft:60 aligns text with name after avatar */}
          <Pressable
            onPress={() => {
              setExpanded(e => !e);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.viewRepliesBtn}
          >
            <Feather
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={13}
              color={Palette.accent600}
            />
            <Text style={styles.viewRepliesText}>
              {expanded ? 'Hide' : 'View'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </Text>
          </Pressable>

          {/* Expanded replies with horizontal thread tick */}
          {expanded && replies.map(reply => (
            <View key={reply.id} style={styles.replyWithTick}>
              {/* Horizontal tick from thread line to avatar */}
              <View style={styles.threadHorizontalTick} />
              <View style={{ flex: 1 }}>
                <CommentRow
                  item={reply}
                  isReply
                  onLongPress={onLongPress}
                  onLike={onLike}
                  onDislike={onDislike}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CommunityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const {
    toggleLike, fetchComments, addComment,
    editComment, deleteComment, reportComment,
    toggleCommentLike, toggleCommentDislike,
  } = useCommunityData();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  // Input state
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyToComment, setReplyToComment] = useState<CommunityComment | null>(null);
  const [editingComment, setEditingComment] = useState<CommunityComment | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Action sheet state
  const [actionSheet, setActionSheet] = useState<ActionSheetComment | null>(null);

  // Fetch post
  const fetchPost = useCallback(async () => {
    if (!id) return;
    setIsLoadingPost(true);
    try {
      const data = await apiFetch(`/community/posts/?category=`);
      const raw = Array.isArray(data) ? data : (data?.results || []);
      const found = raw.find((p: any) => p.id?.toString() === id);
      if (found) {
        setPost({
          id: found.id.toString(),
          type: 'post' as const,
          author: found.author,
          content: found.content,
          category: found.category,
          likes_count: found.likes_count ?? 0,
          comments_count: found.comments_count || 0,
          is_liked: found.is_liked || false,
          is_author: found.is_author || false,
          is_anonymous: found.is_anonymous || false,
          hide_likes: found.hide_likes || false,
          comments_disabled: found.comments_disabled || false,
          created_at: found.created_at,
        });
      }
    } catch (err) {
      console.warn('[CommunityDetail] Failed to fetch post:', err);
    } finally {
      setIsLoadingPost(false);
    }
  }, [id]);

  // Load comments
  const loadComments = useCallback(async () => {
    if (!id) return;
    setIsLoadingComments(true);
    try {
      const data = await fetchComments(id);
      setComments(data);
    } catch (err) {
      console.warn('[CommunityDetail] Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  }, [id, fetchComments]);

  useEffect(() => {
    fetchPost();
    loadComments();
  }, [id]);

  // Like post
  const handleLike = () => {
    if (!post) return;
    setPost(prev => prev ? {
      ...prev,
      is_liked: !prev.is_liked,
      likes_count: (prev.likes_count ?? 0) + (prev.is_liked ? -1 : 1),
    } : prev);
    toggleLike(post.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Submit / Edit comment
  const handleSubmitComment = async () => {
    if (!id || !commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      if (editingComment) {
        await editComment(editingComment.id, commentText.trim());
        setComments(prev => prev.map(c =>
          c.id === editingComment.id ? { ...c, content: commentText.trim() } : c
        ));
        setEditingComment(null);
      } else {
        const newC = await addComment(id, commentText.trim(), replyToComment?.id);
        setComments(prev => [...prev, newC]);
        setPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev);
        setReplyToComment(null);
      }
      setCommentText('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const cancelInputContext = () => {
    setReplyToComment(null);
    setEditingComment(null);
    setCommentText('');
    Keyboard.dismiss();
  };

  // Long press → action sheet
  const handleLongPress = (item: CommunityComment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setActionSheet({ ...item, _isAuthor: item.is_author });
  };

  // Like/Dislike comment (optimistic)
  const handleCommentLike = async (item: CommunityComment) => {
    const prev = { liked: item.is_liked, disliked: item.is_disliked };
    setComments(cs => cs.map(c => c.id !== item.id ? c : {
      ...c,
      is_liked: !prev.liked,
      is_disliked: false,
      likes_count: prev.liked ? c.likes_count - 1 : c.likes_count + 1,
      dislikes_count: prev.disliked ? c.dislikes_count - 1 : c.dislikes_count,
    }));
    try { await toggleCommentLike(item.id); }
    catch { setComments(cs => cs.map(c => c.id === item.id ? { ...c, is_liked: prev.liked, is_disliked: prev.disliked } : c)); }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCommentDislike = async (item: CommunityComment) => {
    const prev = { liked: item.is_liked, disliked: item.is_disliked };
    setComments(cs => cs.map(c => c.id !== item.id ? c : {
      ...c,
      is_disliked: !prev.disliked,
      is_liked: false,
      dislikes_count: prev.disliked ? c.dislikes_count - 1 : c.dislikes_count + 1,
      likes_count: prev.liked ? c.likes_count - 1 : c.likes_count,
    }));
    try { await toggleCommentDislike(item.id); }
    catch { setComments(cs => cs.map(c => c.id === item.id ? { ...c, is_liked: prev.liked, is_disliked: prev.disliked } : c)); }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Action sheet actions
  const handleReply = () => {
    if (!actionSheet) return;
    setReplyToComment(actionSheet);
    setEditingComment(null);
    setCommentText('');
    setActionSheet(null);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleCopy = async () => {
    if (!actionSheet) return;
    await ExpoClipboard.setStringAsync(actionSheet.content);
    setActionSheet(null);
    Alert.alert('Copied', 'Comment text copied to clipboard.');
  };

  const handleEdit = () => {
    if (!actionSheet) return;
    setEditingComment(actionSheet);
    setReplyToComment(null);
    setCommentText(actionSheet.content);
    setActionSheet(null);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const handleDelete = () => {
    if (!actionSheet) return;
    const targetId = actionSheet.id;
    setActionSheet(null);
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteComment(targetId);
            setComments(prev => prev.filter(c => c.id !== targetId));
            setPost(prev => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count - 1) } : prev);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Error', 'Could not delete the comment. Please try again.');
          }
        }
      },
    ]);
  };

  const handleReport = () => {
    if (!actionSheet) return;
    const targetId = actionSheet.id;
    setActionSheet(null);
    Alert.alert('Report Comment', 'Why are you reporting this comment?', [
      { text: 'Spam', onPress: () => submitReport(targetId, 'spam') },
      { text: 'Inappropriate', onPress: () => submitReport(targetId, 'inappropriate') },
      { text: 'Harassment', onPress: () => submitReport(targetId, 'harassment') },
      { text: 'Misleading', onPress: () => submitReport(targetId, 'misleading') },
      { text: 'Other', onPress: () => submitReport(targetId, 'other') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitReport = async (commentId: string, reason: string) => {
    try {
      await reportComment(commentId, reason);
      Alert.alert('Reported', 'Thank you. We will review the comment shortly.');
    } catch (err: any) {
      if (err?.message?.includes('already reported')) {
        Alert.alert('Already Reported', 'You have already reported this comment.');
      } else {
        Alert.alert('Error', 'Could not submit your report. Please try again.');
      }
    }
  };

  // Build grouped data for the FlatList
  const groups = buildGroups(comments);
  const topLevelCount = comments.filter(c => !c.parent).length;

  if (isLoadingPost || !post) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Palette.accent500} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <HapticPressable onPress={() => router.replace('/community' as any)} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={Palette.neutral800} />
        </HapticPressable>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <FlatList
          data={groups}
          keyExtractor={(item) => item.comment.id}
          renderItem={({ item }) => (
            <CommentGroupItem
              group={item}
              onLongPress={handleLongPress}
              onLike={handleCommentLike}
              onDislike={handleCommentDislike}
              onReply={(c) => {
                setReplyToComment(c);
                setEditingComment(null);
                setCommentText('');
                setTimeout(() => inputRef.current?.focus(), 150);
              }}
            />
          )}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.postDetails}>
              {/* Author row */}
              <View style={styles.cardHeader}>
                <AvatarImage author={post.author} size={44} />
                <View style={styles.headerInfo}>
                  <Text style={styles.authorName}>{post.author.name}</Text>
                  <Text style={styles.timeText}>{formatTime(post.created_at)}</Text>
                </View>
                {post.is_anonymous && (
                  <View style={styles.anonBadge}>
                    <Feather name="eye-off" size={10} color={Palette.neutral500} />
                  </View>
                )}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{post.category.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.postBody}>{post.content}</Text>

              <View style={styles.cardActions}>
                <HapticPressable onPress={handleLike} style={styles.actionButton}>
                  {post.is_liked
                    ? <FontAwesome name="heart" size={18} color={Palette.red500} />
                    : <FontAwesome name="heart-o" size={18} color={Palette.neutral500} />
                  }
                  {post.likes_count !== null && (
                    <Text style={[styles.actionCount, post.is_liked && { color: Palette.red500 }]}>
                      {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                    </Text>
                  )}
                </HapticPressable>
              </View>

              <Text style={styles.sectionTitle}>
                {topLevelCount > 0 ? `${topLevelCount} Comment${topLevelCount !== 1 ? 's' : ''}` : 'Comments'}
              </Text>
              {isLoadingComments && (
                <ActivityIndicator size="small" color={Palette.accent500} style={{ marginTop: 12 }} />
              )}
            </View>
          }
          ListEmptyComponent={
            !isLoadingComments ? (
              <View style={styles.emptyComments}>
                <Feather name="message-circle" size={32} color={Palette.neutral300} />
                <Text style={styles.emptyCommentsText}>No comments yet. Be the first!</Text>
              </View>
            ) : null
          }
        />

        {/* Comment input */}
        {!post.comments_disabled ? (
          <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            {(replyToComment || editingComment) && (
              <View style={styles.contextBar}>
                <Feather
                  name={editingComment ? 'edit-2' : 'corner-down-right'}
                  size={13}
                  color={Palette.accent600}
                />
                <Text style={styles.contextBarText} numberOfLines={1}>
                  {editingComment
                    ? 'Editing your comment'
                    : `Replying to @${replyToComment?.author.name}`}
                </Text>
                <Pressable onPress={cancelInputContext} hitSlop={10}>
                  <Feather name="x" size={16} color={Palette.neutral500} />
                </Pressable>
              </View>
            )}
            <View style={styles.replyBar}>
              <TextInput
                ref={inputRef}
                multiline
                maxLength={300}
                placeholder={editingComment ? 'Edit your comment…' : 'Write a reply…'}
                placeholderTextColor={Palette.neutral400}
                value={commentText}
                onChangeText={setCommentText}
                style={styles.replyInput}
              />
              <HapticPressable
                disabled={isSubmittingComment || !commentText.trim()}
                onPress={handleSubmitComment}
                style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
              >
                {isSubmittingComment
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Feather name="send" size={16} color="#fff" />
                }
              </HapticPressable>
            </View>
          </View>
        ) : (
          <View style={[styles.disabledBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Feather name="lock" size={14} color={Palette.neutral400} />
            <Text style={styles.disabledText}>Comments are disabled for this post</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Action Sheet ──────────────────────────────────────────────────── */}
      {actionSheet && (
        <Modal transparent animationType="none" visible onRequestClose={() => setActionSheet(null)}>
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(180)}
            style={styles.sheetOverlay}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setActionSheet(null)} />

            {/* Smooth slide from bottom — no spring, no wobble */}
            <Animated.View
              entering={SlideInDown.duration(280)}
              exiting={SlideOutDown.duration(220)}
              style={[styles.actionSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
            >
              <View style={styles.sheetHandle} />

              {/* Preview */}
              <View style={styles.sheetPreview}>
                <AvatarImage author={actionSheet.author} size={28} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.sheetPreviewName}>{actionSheet.author.name}</Text>
                  <Text style={styles.sheetPreviewText} numberOfLines={2}>{actionSheet.content}</Text>
                </View>
              </View>

              <View style={styles.sheetDivider} />

              {/* Reply */}
              <Pressable style={styles.sheetOption} onPress={handleReply}>
                <View style={[styles.sheetOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Feather name="message-circle" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.sheetOptionText}>Reply</Text>
                <Feather name="chevron-right" size={16} color={Palette.neutral400} />
              </Pressable>

              {/* Copy */}
              <Pressable style={styles.sheetOption} onPress={handleCopy}>
                <View style={[styles.sheetOptionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Feather name="copy" size={18} color="#16A34A" />
                </View>
                <Text style={styles.sheetOptionText}>Copy Text</Text>
                <Feather name="chevron-right" size={16} color={Palette.neutral400} />
              </Pressable>

              {actionSheet._isAuthor ? (
                <>
                  {/* Edit */}
                  <Pressable style={styles.sheetOption} onPress={handleEdit}>
                    <View style={[styles.sheetOptionIcon, { backgroundColor: '#FFFBEB' }]}>
                      <Feather name="edit-2" size={18} color="#D97706" />
                    </View>
                    <Text style={styles.sheetOptionText}>Edit Comment</Text>
                    <Feather name="chevron-right" size={16} color={Palette.neutral400} />
                  </Pressable>

                  {/* Delete */}
                  <Pressable style={styles.sheetOption} onPress={handleDelete}>
                    <View style={[styles.sheetOptionIcon, { backgroundColor: '#FFF1F2' }]}>
                      <Feather name="trash-2" size={18} color="#EF4444" />
                    </View>
                    <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Delete Comment</Text>
                    <Feather name="chevron-right" size={16} color={Palette.neutral400} />
                  </Pressable>
                </>
              ) : (
                /* Report */
                <Pressable style={styles.sheetOption} onPress={handleReport}>
                  <View style={[styles.sheetOptionIcon, { backgroundColor: '#FFF1F2' }]}>
                    <Feather name="alert-triangle" size={18} color="#EF4444" />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Report Comment</Text>
                  <Feather name="chevron-right" size={16} color={Palette.neutral400} />
                </Pressable>
              )}
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBEB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBEB' },

  // Header
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Palette.neutral900 },

  // Post detail section
  scrollContent: { paddingBottom: 16 },
  postDetails: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  headerInfo: { flex: 1, marginLeft: 12 },
  authorName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Palette.neutral900 },
  timeText: { fontSize: FontSize.xs, color: Palette.neutral400, marginTop: 2 },
  anonBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: Palette.accent50 },
  categoryText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Palette.accent700 },
  postBody: { fontSize: FontSize.lg, color: Palette.neutral900, lineHeight: 26, marginBottom: 18 },
  cardActions: {
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9',
    paddingVertical: 10, flexDirection: 'row', marginBottom: 18,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionCount: { fontSize: FontSize.sm, color: Palette.neutral600, fontWeight: FontWeight.medium },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Palette.neutral800 },

  // Comment group container
  commentGroupContainer: {
    backgroundColor: '#fff',
    marginBottom: 6,          // ← spacing between comment groups
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  // Comment row
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,      // ← vertical breathing room
    gap: 10,
  },
  replyRow: {
    paddingLeft: 0,           // no extra indent — flush with parent
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  commentBody: { flex: 1, paddingRight: 4 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  commentAuthor: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Palette.neutral900 },
  commentTime: { fontSize: 11, color: Palette.neutral400 },
  commentText: { fontSize: FontSize.sm, color: Palette.neutral700, lineHeight: 19 },

  // Like / Dislike column
  commentActions: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 2,
  },
  commentActionBtn: { alignItems: 'center', minWidth: 28 },
  commentActionCount: { fontSize: 10, color: Palette.neutral400, fontWeight: FontWeight.medium },
  actionSpacer: { height: 10 },   // ← gap between thumbs-up and thumbs-down

  // Replies section
  repliesWrapper: {
    position: 'relative',
    paddingBottom: 6,
    backgroundColor: '#FAFAFA',
  },
  // Vertical thread line — runs at the centre of the parent avatar (x = 16 + 17 = 33)
  threadLine: {
    position: 'absolute',
    left: 33,
    top: 0,
    bottom: 6,
    width: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
    zIndex: 0,
  },
  // Wrapper for each reply row that draws the horizontal tick
  replyWithTick: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  // Horizontal tick from vertical line to reply avatar
  threadHorizontalTick: {
    width: 16,                // from x=33 to x=49 (16px tick)
    height: 2,
    backgroundColor: '#E2E8F0',
    borderRadius: 1,
    marginTop: 24,            // vertically centres against the reply avatar
    flexShrink: 0,
  },
  // "View X replies" button — paddingLeft:60 aligns chevron+text with name after avatar
  viewRepliesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingLeft: 60,          // 16 padding + 34 avatar + 10 gap = aligns with name text
  },
  viewRepliesText: {
    fontSize: 12,
    color: Palette.accent600,
    fontWeight: FontWeight.semibold,
  },

  // Empty state
  emptyComments: { padding: 40, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyCommentsText: { fontSize: FontSize.sm, color: Palette.neutral400, textAlign: 'center' },

  // Input area
  inputWrapper: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#E2E8F0' },
  contextBar: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Palette.accent50, borderBottomWidth: 1, borderColor: '#E2E8F0',
  },
  contextBarText: { flex: 1, fontSize: FontSize.xs, color: Palette.accent700, fontWeight: FontWeight.medium },
  replyBar: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  replyInput: {
    flex: 1, minHeight: 40, maxHeight: 100,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: '#CBD5E1',
    paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8,
    fontSize: FontSize.sm, color: Palette.neutral800, backgroundColor: '#f8fafc',
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.accent500, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#CBD5E1' },
  disabledBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16, backgroundColor: '#F8FAFC',
    borderTopWidth: 1, borderColor: '#E2E8F0',
  },
  disabledText: { fontSize: FontSize.sm, color: Palette.neutral500, fontWeight: FontWeight.medium },

  // Action sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0', alignSelf: 'center', marginBottom: 14,
  },
  sheetPreview: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingBottom: 14, gap: 10,
  },
  sheetPreviewName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Palette.neutral800, marginBottom: 2 },
  sheetPreviewText: { fontSize: FontSize.xs, color: Palette.neutral500, lineHeight: 16 },
  sheetDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 4 },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 20, gap: 14,
  },
  sheetOptionIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sheetOptionText: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Palette.neutral900 },
});
