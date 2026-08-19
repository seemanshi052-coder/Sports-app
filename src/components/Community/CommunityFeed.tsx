import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Plus,
  Filter,
  Flame,
  Award,
  TrendingUp,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Loader2,
  Send,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { CommunityPost, PostCategory, Sport } from '../../types';
import { CommunityPostCard } from './CommunityPostCard';

interface CommunityFeedProps {
  sports: Sport[];
  currentUserId?: string;
  currentUserLevel?: {
    level: number;
    name: string;
    icon: string;
  };
  currentUserAvatar?: string;
  currentUserName?: string;
  onOpenCreatePost: () => void;
  onReportPost: (post: CommunityPost) => void;
}

const CATEGORY_TABS: { value: string; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
  { value: 'ALL', label: 'All Posts' },
  { value: 'PROGRESS', label: 'Progress', icon: TrendingUp },
  { value: 'TRAINING', label: 'Drills & Training', icon: Flame },
  { value: 'ACHIEVEMENT', label: 'Achievements', icon: Award },
  { value: 'PERFORMANCE', label: 'Highlights', icon: Sparkles },
  { value: 'QUESTION', label: 'Q&A', icon: HelpCircle },
  { value: 'MOTIVATION', label: 'Motivation', icon: Sparkles }
];

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  sports,
  currentUserId,
  currentUserLevel,
  currentUserAvatar,
  currentUserName,
  onOpenCreatePost,
  onReportPost
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchPosts(1, true);
  }, [selectedCategory, selectedSport]);

  const fetchPosts = async (targetPage = 1, isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('post_type', selectedCategory);
      if (selectedSport !== 'all') params.append('sport', selectedSport);
      params.append('page', String(targetPage));
      params.append('limit', '10');

      const res = await fetch(`/api/v1/community/posts?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        const fetchedPosts: CommunityPost[] = json.data.posts || [];
        if (targetPage === 1) {
          setPosts(fetchedPosts);
        } else {
          setPosts((prev) => [...prev, ...fetchedPosts]);
        }
        setPage(targetPage);
        setHasMore(fetchedPosts.length >= 10 && posts.length + fetchedPosts.length < json.data.total);
      }
    } catch (err) {
      console.warn('Error fetching community posts:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newLiked = !p.liked_by_current_user;
          return {
            ...p,
            liked_by_current_user: newLiked,
            like_count: newLiked ? (p.like_count || 0) + 1 : Math.max(0, (p.like_count || 1) - 1)
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`/api/v1/community/posts/${postId}/like`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, like_count: json.data.like_count, liked_by_current_user: json.data.liked } : p))
        );
      }
    } catch (err) {
      console.warn('Failed to update like:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.warn('Failed to delete post:', err);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const res = await fetch(`/api/v1/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      const json = await res.json();
      if (json.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p))
        );
      }
    } catch (err) {
      console.warn('Failed to add comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/v1/community/comments/${commentId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to delete comment:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Quick Composer Card at Top */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <img
            src={
              currentUserAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
            alt={currentUserName || 'Athlete'}
            className="w-10 h-10 rounded-full object-cover border border-slate-700 ring-2 ring-slate-800"
          />
          <button
            onClick={onOpenCreatePost}
            className="flex-1 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-2.5 text-left text-xs sm:text-sm text-slate-400 hover:text-slate-300 transition-all flex items-center justify-between"
          >
            <span>Share training drill, video, or ask for athletic advice...</span>
            <Send className="w-4 h-4 text-cyan-400 hidden sm:block" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenCreatePost}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Drill Progress</span>
            </button>
            <button
              onClick={onOpenCreatePost}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Personal Best</span>
            </button>
            <button
              onClick={onOpenCreatePost}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span>Video / Media</span>
            </button>
          </div>

          <button
            onClick={onOpenCreatePost}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </div>
      </div>

      {/* Filter & Category Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.value;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sport Selector & Refresh */}
        <div className="flex items-center gap-2 justify-end">
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none capitalize text-xs pr-1"
            >
              <option value="all">All Sports</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchPosts(1, false);
            }}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Posts List */}
      {isLoading ? (
        <div className="space-y-4 py-8 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-cyan-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading athlete discussions...</span>
          </div>
          <div className="space-y-4 animate-pulse pt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Posts Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No athlete posts matching the current category or sport filter. Be the first to start the conversation!
            </p>
          </div>
          <button
            onClick={onOpenCreatePost}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onToggleLike={handleToggleLike}
              onDeletePost={handleDeletePost}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onReportPost={onReportPost}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchPosts(page + 1, false)}
                disabled={isLoadingMore}
                className="px-6 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load More Posts</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
