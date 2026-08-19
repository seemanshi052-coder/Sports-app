import React, { useState } from 'react';
import {
  X,
  Send,
  Image as ImageIcon,
  Video,
  Sparkles,
  Flame,
  Award,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { PostCategory, Sport, CommunityPost } from '../../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: CommunityPost) => void;
  sports: Sport[];
  currentUserLevel?: {
    level: number;
    name: string;
    icon: string;
  };
}

const POST_CATEGORIES: {
  value: PostCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  { value: 'PROGRESS', label: 'Progress Update', icon: TrendingUp, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30' },
  { value: 'TRAINING', label: 'Drill / Training', icon: Flame, color: 'text-amber-400 bg-amber-950/60 border-amber-500/30' },
  { value: 'ACHIEVEMENT', label: 'Achievement / PB', icon: Award, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' },
  { value: 'PERFORMANCE', label: 'Assessment Highlight', icon: Sparkles, color: 'text-purple-400 bg-purple-950/60 border-purple-500/30' },
  { value: 'QUESTION', label: 'Athlete Q&A', icon: HelpCircle, color: 'text-blue-400 bg-blue-950/60 border-blue-500/30' },
  { value: 'MOTIVATION', label: 'Motivation', icon: Sparkles, color: 'text-rose-400 bg-rose-950/60 border-rose-500/30' },
  { value: 'GENERAL', label: 'Discussion', icon: MessageSquare, color: 'text-slate-300 bg-slate-800/60 border-slate-700' }
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  sports,
  currentUserLevel
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PostCategory>('PROGRESS');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMessage('Please write some content for your post.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: selectedCategory,
          sport: selectedSport === 'all' ? undefined : selectedSport,
          title: title.trim() || undefined,
          content: content.trim(),
          media_url: mediaUrl.trim() || undefined,
          media_type: mediaUrl.trim() ? mediaType : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.data) {
        onPostCreated(data.data);
        onClose();
        // Reset
        setTitle('');
        setContent('');
        setMediaUrl('');
      } else {
        setErrorMessage(data.error || 'Failed to create post. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while creating post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Share with Athlete Community</h3>
              <p className="text-xs text-slate-400">Post drills, training milestones, and athletic advice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Author Badge Preview */}
          {currentUserLevel && (
            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{currentUserLevel.icon}</span>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Posting with Athlete Flair</div>
                  <div className="text-[11px] text-cyan-400">
                    Level {currentUserLevel.level} • {currentUserLevel.name}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Verified Author</span>
            </div>
          )}

          {/* Category Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POST_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? `${cat.color} ring-1 ring-cyan-400 font-semibold shadow-sm`
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sport & Optional Title Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Sport Tag
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 capitalize"
              >
                <option value="all">All Sports / General</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Post Headline (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Personal Best in Vertical Jump!"
                maxLength={120}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Post Content */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Post Content <span className="text-rose-400">*</span>
              </label>
              <span className={`text-[11px] font-mono ${content.length > 2000 ? 'text-amber-400' : 'text-slate-500'}`}>
                {content.length}/2500
              </span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what drill you performed, biomechanical adjustments you worked on, or ask fellow athletes for advice..."
              rows={5}
              maxLength={2500}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none leading-relaxed"
            />
          </div>

          {/* Media Attachment URL */}
          <div className="space-y-2 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                Media Attachment (Optional)
              </span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setMediaType('image')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                    mediaType === 'image' ? 'bg-cyan-500 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" /> Image
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('video')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 ${
                    mediaType === 'video' ? 'bg-cyan-500 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Video className="w-3 h-3" /> Video
                </button>
              </div>
            </div>

            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Paste public image URL (Unsplash, Cloudinary, etc.) or video URL..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            {mediaUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-slate-800 bg-slate-900/80 max-h-48 flex items-center justify-center">
                {mediaType === 'image' ? (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="max-h-48 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <video src={mediaUrl} controls className="max-h-48 w-full object-contain" />
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all disabled:opacity-50 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing Post...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publish to Community
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
