import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Compass,
  Bookmark,
  Plus,
  Users,
  Building,
  ShieldCheck,
  Sparkles,
  Flame,
  Award
} from 'lucide-react';
import { Sport, CommunityPost, Opportunity } from '../../types';
import { CommunityFeed } from './CommunityFeed';
import { OpportunitiesView } from './OpportunitiesView';
import { CreatePostModal } from './CreatePostModal';
import { ReportModal } from './ReportModal';

interface CommunityHubProps {
  sports: Sport[];
  initialTab?: 'feed' | 'opportunities' | 'saved';
}

export const CommunityHub: React.FC<CommunityHubProps> = ({
  sports,
  initialTab = 'feed'
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'opportunities' | 'saved'>(initialTab);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [reportingTarget, setReportingTarget] = useState<{
    type: 'POST' | 'COMMENT' | 'OPPORTUNITY';
    id: string;
    title?: string;
  } | null>(null);

  // Current User Profile & Gamification Snapshot
  const [currentUserData, setCurrentUserData] = useState<{
    id: string;
    name: string;
    avatar_url: string;
    level: number;
    level_name: string;
    level_icon: string;
  }>({
    id: 'user_ath_1',
    name: 'Marcus Vance',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    level: 3,
    level_name: 'Semi-Pro Competitor',
    level_icon: '⚡'
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/v1/gamification/profile');
      const json = await res.json();
      if (json.success && json.data) {
        setCurrentUserData((prev) => ({
          ...prev,
          level: json.data.level || prev.level,
          level_name: json.data.level_name || prev.level_name,
          level_icon: json.data.level_icon || prev.level_icon
        }));
      }
    } catch (err) {
      console.warn('Failed to load user gamification profile for community hub:', err);
    }
  };

  const handleReportPost = (post: CommunityPost) => {
    setReportingTarget({
      type: 'POST',
      id: post.id,
      title: post.title || post.content.slice(0, 50)
    });
  };

  const handleReportOpportunity = (opp: Opportunity) => {
    setReportingTarget({
      type: 'OPPORTUNITY',
      id: opp.id,
      title: `${opp.title} (${opp.organization_name})`
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Community Header & Hub Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Athlete Network & Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Community & Opportunities
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Connect with certified athletes, share training milestones, and access official scout trials.
          </p>
        </div>

        {/* Action Button & Tab Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'feed'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Community Feed</span>
            </button>
            <button
              onClick={() => setActiveTab('opportunities')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'opportunities'
                  ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Opportunities & Trials</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-slate-800 text-amber-400 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved</span>
            </button>
          </div>

          {activeTab === 'feed' && (
            <button
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'feed' && (
        <CommunityFeed
          sports={sports}
          currentUserId={currentUserData.id}
          currentUserAvatar={currentUserData.avatar_url}
          currentUserName={currentUserData.name}
          currentUserLevel={{
            level: currentUserData.level,
            name: currentUserData.level_name,
            icon: currentUserData.level_icon
          }}
          onOpenCreatePost={() => setIsCreatePostOpen(true)}
          onReportPost={handleReportPost}
        />
      )}

      {activeTab === 'opportunities' && (
        <OpportunitiesView
          sports={sports}
          initialSavedOnly={false}
          onReportOpportunity={handleReportOpportunity}
        />
      )}

      {activeTab === 'saved' && (
        <OpportunitiesView
          sports={sports}
          initialSavedOnly={true}
          onReportOpportunity={handleReportOpportunity}
        />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={() => {
          // Trigger feed refresh by tab toggle or notification
          setActiveTab('feed');
        }}
        sports={sports}
        currentUserLevel={{
          level: currentUserData.level,
          name: currentUserData.level_name,
          icon: currentUserData.level_icon
        }}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={!!reportingTarget}
        onClose={() => setReportingTarget(null)}
        targetType={reportingTarget?.type || 'POST'}
        targetId={reportingTarget?.id || ''}
        targetTitle={reportingTarget?.title}
      />
    </div>
  );
};
