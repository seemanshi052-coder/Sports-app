import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Flag,
  Trash2,
  Send,
  Sparkles,
  Flame,
  Award,
  HelpCircle,
  TrendingUp,
  Loader2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { CommunityPost, PostComment, PostCategory } from '../../types';

interface CommunityPostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  onToggleLike: (postId: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onAddComment: (postId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onReportPost: (post: CommunityPost) => void;
}

const CATEGORY_STYLES: Record<PostCategory, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  PROGRESS: { label: 'Progress Update', icon: TrendingUp, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30' },
  TRAINING: { label: 'Drill / Training', icon: Flame, color: 'text-amber-400 bg-amber-950/60 border-amber-500/30' },
  ACHIEVEMENT: { label: 'Personal Best / PB', icon: Award, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' },
  PERFORMANCE: { label: 'Assessment Highlight', icon: Sparkles, color: 'text-purple-400 bg-purple-950/60 border-purple-500/30' },
  QUESTION: { label: 'Athlete Q&A', icon: HelpCircle, color: 'text-blue-400 bg-blue-950/60 border-blue-500/30' },
  MOTIVATION: { label: 'Motivation', icon: Sparkles, color: 'text-rose-400 bg-rose-950/60 border-rose-500/30' },
  GENERAL: { label: 'Discussion', icon: MessageSquare, color: 'text-slate-300 bg-slate-800/60 border-slate-700' }
};

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
  post,
  currentUserId,
  onToggleLike,
  onDeletePost,
  onAddComment,
  onDeleteComment,
  onReportPost
}) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const categoryConfig = CATEGORY_STYLES[post.post_type] || CATEGORY_STYLES.GENERAL;
  const CategoryIcon = categoryConfig.icon;
  const isAuthor = currentUserId && post.author_id === currentUserId;

  const handleToggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setIsLoadingComments(true);
      try {
        const res = await fetch(`/api/v1/community/posts/${post.id}/comments`);
        const json = await res.json();
        if (json.success && json.data) {
          setComments(json.data);
        }
      } catch (err) {
        console.warn('Failed to load comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onToggleLike(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(post.id, newCommentText.trim());
      // Refresh comments
      const res = await fetch(`/api/v1/community/posts/${post.id}/comments`);
      const json = await res.json();
      if (json.success && json.data) {
        setComments(json.data);
      }
      setNewCommentText('');
    } catch (err) {
      console.warn('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteCommentItem = async (commentId: string) => {
    try {
      await onDeleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.warn('Failed to delete comment:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <article className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-slate-750">
      {/* Post Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Author Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  post.author_avatar ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                }
                alt={post.author_name}
                className="w-10 h-10 rounded-full object-cover border border-slate-700 ring-2 ring-slate-800"
              />
              {post.author_level_icon && (
                <span
                  className="absolute -bottom-1 -right-1 text-xs bg-slate-900 rounded-full p-0.5 border border-slate-800"
                  title={`Level ${post.author_level} • ${post.author_level_name}`}
                >
                  {post.author_level_icon}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white tracking-tight hover:text-cyan-400 cursor-pointer transition-colors">
                  {post.author_name}
                </span>
                {post.author_level && (
                  <span className="text-[11px] font-medium text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>Lvl {post.author_level}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{post.author_level_name}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>{formatRelativeTime(post.created_at)}</span>
                {post.sport && post.sport !== 'all' && (
                  <>
                    <span>•</span>
                    <span className="capitalize text-slate-400">{post.sport}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category Badge & Context Menu */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${categoryConfig.color}`}
            >
              <CategoryIcon className="w-3 h-3 flex-shrink-0" />
              <span>{categoryConfig.label}</span>
            </span>

            {isAuthor ? (
              <button
                onClick={() => onDeletePost(post.id)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Delete your post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onReportPost(post)}
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Report post"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Post Title */}
        {post.title && (
          <h3 className="text-base font-bold text-white mt-3.5 tracking-tight">{post.title}</h3>
        )}

        {/* Post Text Content */}
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Media Attachment */}
      {post.media_url && (
        <div className="mt-2 bg-slate-950 border-y border-slate-800/80 max-h-96 overflow-hidden flex items-center justify-center">
          {post.media_type === 'video' ? (
            <video
              src={post.media_url}
              controls
              className="w-full max-h-96 object-contain bg-black"
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post attachment"
              className="w-full max-h-96 object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
        </div>
      )}

      {/* Action Stats Bar */}
      <div className="px-5 py-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-950/30">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
              post.liked_by_current_user
                ? 'text-rose-400 bg-rose-950/40 border border-rose-500/30 font-semibold'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800/60'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                post.liked_by_current_user ? 'fill-rose-400 text-rose-400' : ''
              }`}
            />
            <span>{post.like_count || 0}</span>
          </button>

          <button
            onClick={handleToggleComments}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors ${
              showComments
                ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30'
                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comment_count || 0}</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Copy link"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Expandable Comments Section */}
      {showComments && (
        <div className="border-t border-slate-800 bg-slate-950/60 p-5 space-y-4 animate-fade-in">
          {/* Add Comment Input */}
          <form onSubmit={handleCreateComment} className="flex items-center gap-2.5">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a supportive comment or drill tip..."
              maxLength={1000}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !newCommentText.trim()}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
            >
              {isSubmittingComment ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Post</span>
                </>
              )}
            </button>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Loading conversation...</span>
            </div>
          ) : comments.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500 italic">
              No comments yet. Be the first to congratulate or discuss!
            </p>
          ) : (
            <div className="space-y-3 pt-1">
              {comments.map((comm) => {
                const isCommAuthor = currentUserId && comm.author_id === currentUserId;
                return (
                  <div
                    key={comm.id}
                    className="flex items-start justify-between gap-3 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <img
                        src={
                          comm.author_avatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={comm.author_name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700 flex-shrink-0 mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-200">{comm.author_name}</span>
                          {comm.author_level && (
                            <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/30">
                              Lvl {comm.author_level}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">• {formatRelativeTime(comm.created_at)}</span>
                        </div>
                        <p className="text-slate-300 mt-1 leading-relaxed">{comm.content}</p>
                      </div>
                    </div>

                    {isCommAuthor && (
                      <button
                        onClick={() => handleDeleteCommentItem(comm.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
