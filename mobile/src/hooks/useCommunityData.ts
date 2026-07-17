import { useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../services/api';

export interface CommunityAuthor {
  id: number;
  name: string;
  avatar_url?: string | null;
}

export interface CommunityPost {
  id: string;
  type: 'post';
  author: CommunityAuthor;
  content: string;
  category: string;
  likes_count: number | null; // null = hidden by author
  comments_count: number;
  is_liked: boolean;
  is_author: boolean;        // true if the logged-in user authored this post
  is_anonymous: boolean;
  hide_likes: boolean;
  comments_disabled: boolean;
  created_at: string;
}

export interface CommunityPollChoice {
  id: number;
  text: string;
  order: number;
  votes_count: number;
}

export interface CommunityPoll {
  id: string;
  type: 'poll';
  author: CommunityAuthor;
  question: string;
  category: string;
  choices: CommunityPollChoice[];
  total_votes: number;
  user_voted_choice?: number;
  ends_at?: string;
  created_at: string;
}

export type CommunityFeedItem = CommunityPost | CommunityPoll;

export interface CommunityComment {
  id: string;
  author: CommunityAuthor;
  content: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  is_liked: boolean;
  is_disliked: boolean;
  is_author: boolean;
  parent?: string | null;
  parent_author_name?: string | null;
}

export function useCommunityData() {
  const [feed, setFeed] = useState<CommunityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Fetch feed (Posts & Polls)
  const fetchFeed = useCallback(async (category = '', isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setHasError(false);

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      // Fetch posts and polls in parallel
      const [postsData, pollsData] = await Promise.all([
        apiFetch(`/community/posts/?category=${category}`).catch(() => []),
        apiFetch('/community/polls/').catch(() => []),
      ]);

      const rawPosts = Array.isArray(postsData) ? postsData : (postsData?.results || []);
      const rawPolls = Array.isArray(pollsData) ? pollsData : (pollsData?.results || []);

      const formattedPosts: CommunityPost[] = rawPosts.map((p: any) => ({
        id: p.id.toString(),
        type: 'post' as const,
        author: p.author,
        content: p.content,
        category: p.category,
        likes_count: p.likes_count ?? 0,
        comments_count: p.comments_count || 0,
        is_liked: p.is_liked || false,
        is_author: p.is_author || false,
        is_anonymous: p.is_anonymous || false,
        hide_likes: p.hide_likes || false,
        comments_disabled: p.comments_disabled || false,
        created_at: p.created_at,
      }));

      const filteredRawPolls = category && category !== 'trending' && category !== 'polls'
        ? rawPolls.filter((p: any) => p.category === category)
        : rawPolls;

      const formattedPolls: CommunityPoll[] = filteredRawPolls.map((p: any) => ({
        id: p.id.toString(),
        type: 'poll' as const,
        author: p.author,
        question: p.question,
        category: p.category,
        choices: p.choices || [],
        total_votes: p.total_votes || 0,
        user_voted_choice: p.user_voted_choice,
        ends_at: p.ends_at,
        created_at: p.created_at,
      }));

      const combined: CommunityFeedItem[] = [...formattedPosts, ...formattedPolls].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFeed(combined);
    } catch (err) {
      console.warn('[Community] Failed to fetch feed:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Toggle Post Like
  const toggleLike = useCallback(async (postId: string) => {
    try {
      setFeed(prev =>
        prev.map(item => {
          if (item.type === 'post' && item.id === postId) {
            const liked = !item.is_liked;
            return {
              ...item,
              is_liked: liked,
              likes_count: (item.likes_count ?? 0) + (liked ? 1 : -1),
            };
          }
          return item;
        })
      );
      await apiFetch(`/community/posts/${postId}/like/`, { method: 'POST' });
    } catch (err) {
      fetchFeed();
    }
  }, [fetchFeed]);

  // Create Post
  const createPost = useCallback(async (
    content: string,
    category: string,
    options?: { is_anonymous?: boolean; hide_likes?: boolean; comments_disabled?: boolean }
  ) => {
    try {
      const newPost = await apiFetch('/community/posts/create/', {
        method: 'POST',
        body: JSON.stringify({ content, category, ...options }),
      });
      if (newPost && newPost.id) {
        const formatted: CommunityPost = {
          id: newPost.id.toString(),
          type: 'post' as const,
          author: newPost.author,
          content: newPost.content,
          category: newPost.category,
          likes_count: newPost.likes_count ?? 0,
          comments_count: newPost.comments_count || 0,
          is_liked: newPost.is_liked || false,
          is_author: true,
          is_anonymous: newPost.is_anonymous || false,
          hide_likes: newPost.hide_likes || false,
          comments_disabled: newPost.comments_disabled || false,
          created_at: newPost.created_at,
        };
        setFeed(prev => [formatted, ...prev.filter(p => p.type !== 'post' || p.id !== formatted.id)]);
      }
      fetchFeed(category);
      return true;
    } catch (err: any) {
      console.warn('[Community] Create post failed:', err);
      throw err;
    }
  }, [fetchFeed]);

  // Edit Post (content)
  const editPost = useCallback(async (postId: string, content: string) => {
    try {
      const updated = await apiFetch(`/community/posts/${postId}/edit/`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      });
      setFeed(prev =>
        prev.map(item => {
          if (item.type === 'post' && item.id === postId) {
            return { ...item, content: updated.content };
          }
          return item;
        })
      );
      return true;
    } catch (err: any) {
      console.warn('[Community] Edit post failed:', err);
      throw err;
    }
  }, []);

  // Update Post Settings (toggle hide_likes, comments_disabled, is_anonymous)
  const updatePostSettings = useCallback(async (
    postId: string,
    settings: { comments_disabled?: boolean; hide_likes?: boolean; is_anonymous?: boolean }
  ) => {
    // Optimistic update first
    setFeed(prev =>
      prev.map(item => {
        if (item.type === 'post' && item.id === postId) {
          return { ...item, ...settings };
        }
        return item;
      })
    );
    try {
      await apiFetch(`/community/posts/${postId}/edit/`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      return true;
    } catch (err: any) {
      console.warn('[Community] Update post settings failed:', err);
      // Roll back optimistic update on failure
      fetchFeed();
      throw err;
    }
  }, [fetchFeed]);

  // Delete Post
  const deletePost = useCallback(async (postId: string) => {
    try {
      await apiFetch(`/community/posts/${postId}/delete/`, { method: 'DELETE' });
      setFeed(prev => prev.filter(item => !(item.type === 'post' && item.id === postId)));
      return true;
    } catch (err: any) {
      console.warn('[Community] Delete post failed:', err);
      throw err;
    }
  }, []);

  // Report Post
  const reportPost = useCallback(async (postId: string, reason: string) => {
    try {
      await apiFetch(`/community/posts/${postId}/report/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return true;
    } catch (err: any) {
      console.warn('[Community] Report post failed:', err);
      throw err;
    }
  }, []);

  // Create Poll
  const createPoll = useCallback(async (question: string, category: string, choices: string[]) => {
    try {
      const newPoll = await apiFetch('/community/polls/create/', {
        method: 'POST',
        body: JSON.stringify({ question, category, choices }),
      });
      if (newPoll && newPoll.id) {
        const formatted: CommunityPoll = {
          id: newPoll.id.toString(),
          type: 'poll' as const,
          author: newPoll.author,
          question: newPoll.question,
          category: newPoll.category,
          choices: newPoll.choices || [],
          total_votes: newPoll.total_votes || 0,
          user_voted_choice: newPoll.user_voted_choice,
          ends_at: newPoll.ends_at,
          created_at: newPoll.created_at,
        };
        setFeed(prev => [formatted, ...prev.filter(p => p.type !== 'poll' || p.id !== formatted.id)]);
      }
      fetchFeed(category);
      return true;
    } catch (err: any) {
      console.warn('[Community] Create poll failed:', err);
      throw err;
    }
  }, [fetchFeed]);

  // Vote on Poll
  const voteOnPoll = useCallback(async (pollId: string, choiceId: number) => {
    try {
      setFeed(prev =>
        prev.map(item => {
          if (item.type === 'poll' && item.id === pollId) {
            const choices = item.choices.map(c => {
              let diff = 0;
              if (c.id === choiceId) {
                diff = 1;
              } else if (c.id === item.user_voted_choice) {
                diff = -1;
              }
              return { ...c, votes_count: c.votes_count + diff };
            });
            const voteDiff = item.user_voted_choice === undefined ? 1 : 0;
            return {
              ...item,
              choices,
              total_votes: item.total_votes + voteDiff,
              user_voted_choice: choiceId,
            };
          }
          return item;
        })
      );
      await apiFetch(`/community/polls/${pollId}/vote/`, {
        method: 'POST',
        body: JSON.stringify({ choice_id: choiceId }),
      });
    } catch (err) {
      fetchFeed();
    }
  }, [fetchFeed]);

  // Fetch comments for a specific post
  const fetchComments = useCallback(async (postId: string): Promise<CommunityComment[]> => {
    try {
      const data = await apiFetch(`/community/posts/${postId}/comments/`);
      const rawComments = Array.isArray(data) ? data : (data?.results || []);
      return rawComments.map((c: any) => ({
        id: c.id.toString(),
        author: c.author,
        content: c.content,
        created_at: c.created_at,
        likes_count: c.likes_count ?? 0,
        dislikes_count: c.dislikes_count ?? 0,
        is_liked: c.is_liked ?? false,
        is_disliked: c.is_disliked ?? false,
        is_author: c.is_author ?? false,
        parent: c.parent != null ? c.parent.toString() : null,
        parent_author_name: c.parent_author_name ?? null,
      }));
    } catch (err) {
      console.warn('[Community] Failed to fetch comments:', err);
      return [];
    }
  }, []);

  // Post Comment (with optional parent for replies)
  const addComment = useCallback(async (postId: string, content: string, parentId?: string) => {
    try {
      const body: any = { content };
      if (parentId) body.parent = parentId;
      const res = await apiFetch(`/community/posts/${postId}/comments/`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setFeed(prev =>
        prev.map(item => {
          if (item.type === 'post' && item.id === postId) {
            return { ...item, comments_count: item.comments_count + 1 };
          }
          return item;
        })
      );
      return {
        id: res.id.toString(),
        author: res.author,
        content: res.content,
        created_at: res.created_at,
        likes_count: res.likes_count ?? 0,
        dislikes_count: res.dislikes_count ?? 0,
        is_liked: res.is_liked ?? false,
        is_disliked: res.is_disliked ?? false,
        is_author: true,
        parent: res.parent != null ? res.parent.toString() : null,
        parent_author_name: res.parent_author_name ?? null,
      } as CommunityComment;
    } catch (err) {
      console.warn('[Community] Failed to post comment:', err);
      throw err;
    }
  }, []);

  // Edit a comment
  const editComment = useCallback(async (commentId: string, content: string) => {
    try {
      const res = await apiFetch(`/community/comments/${commentId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      });
      return res;
    } catch (err) {
      console.warn('[Community] Failed to edit comment:', err);
      throw err;
    }
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      await apiFetch(`/community/comments/${commentId}/`, { method: 'DELETE' });
      return true;
    } catch (err) {
      console.warn('[Community] Failed to delete comment:', err);
      throw err;
    }
  }, []);

  // Report a comment
  const reportComment = useCallback(async (commentId: string, reason: string) => {
    try {
      await apiFetch(`/community/comments/${commentId}/report/`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return true;
    } catch (err) {
      console.warn('[Community] Failed to report comment:', err);
      throw err;
    }
  }, []);

  // Toggle like on a comment
  const toggleCommentLike = useCallback(async (commentId: string) => {
    try {
      const res = await apiFetch(`/community/comments/${commentId}/like/`, { method: 'POST' });
      return res;
    } catch (err) {
      console.warn('[Community] Failed to like comment:', err);
      throw err;
    }
  }, []);

  // Toggle dislike on a comment
  const toggleCommentDislike = useCallback(async (commentId: string) => {
    try {
      const res = await apiFetch(`/community/comments/${commentId}/dislike/`, { method: 'POST' });
      return res;
    } catch (err) {
      console.warn('[Community] Failed to dislike comment:', err);
      throw err;
    }
  }, []);

  return {
    feed,
    isLoading,
    isRefreshing,
    hasError,
    fetchFeed,
    toggleLike,
    createPost,
    editPost,
    updatePostSettings,
    deletePost,
    reportPost,
    createPoll,
    voteOnPoll,
    fetchComments,
    addComment,
    editComment,
    deleteComment,
    reportComment,
    toggleCommentLike,
    toggleCommentDislike,
  };
}
