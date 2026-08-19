import React from 'react';
import { X, Award, Flame, TrendingUp, Target, Trophy, CheckCircle2, Lock, Sparkles, Calendar } from 'lucide-react';
import { BadgeWithStatus } from '../../types';

interface GamificationBadgeModalProps {
  badge: BadgeWithStatus | null;
  onClose: () => void;
}

export const GamificationBadgeModal: React.FC<GamificationBadgeModalProps> = ({ badge, onClose }) => {
  if (!badge) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'LEVEL':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'STREAK':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'IMPROVEMENT':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'ASSESSMENT':
        return <Target className="w-4 h-4 text-cyan-400" />;
      case 'ACHIEVEMENT':
        return <Trophy className="w-4 h-4 text-purple-400" />;
      default:
        return <Award className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'LEVEL':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'STREAK':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'IMPROVEMENT':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'ASSESSMENT':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'ACHIEVEMENT':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-20 ${
          badge.unlocked ? 'bg-cyan-500' : 'bg-slate-700'
        }`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge Icon Showcase */}
        <div className="flex flex-col items-center text-center space-y-4 pt-2">
          <div className="relative">
            <div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl transition-transform duration-300 ${
                badge.unlocked
                  ? 'bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-cyan-500/50 shadow-cyan-500/20 scale-105'
                  : 'bg-slate-950/80 border border-slate-800 grayscale opacity-50'
              }`}
            >
              {badge.icon}
            </div>

            {badge.unlocked ? (
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="absolute -bottom-2 -right-2 bg-slate-800 text-slate-400 rounded-full p-1.5 border border-slate-700 shadow-lg">
                <Lock className="w-4 h-4" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getCategoryBadgeClass(badge.category)}`}>
                {getCategoryIcon(badge.category)}
                {badge.category} BADGE
              </span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">{badge.name}</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-xs">{badge.description}</p>
          </div>
        </div>

        {/* Badge Details Grid */}
        <div className="mt-6 space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-400">Unlock Requirement</span>
            <span className="font-semibold text-white font-mono">
              {badge.requirement_type.replace(/_/g, ' ')}: {badge.requirement_value}
            </span>
          </div>

          {badge.xp_reward > 0 && (
            <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-800/60">
              <span className="text-slate-400">XP Reward</span>
              <span className="font-bold text-amber-400 font-mono">+{badge.xp_reward} XP</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">Status</span>
            <span className={`font-semibold ${badge.unlocked ? 'text-emerald-400' : 'text-slate-500'}`}>
              {badge.unlocked ? 'Unlocked & Verified' : 'Locked'}
            </span>
          </div>

          {badge.unlocked && badge.unlocked_at && (
            <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Date Unlocked
              </span>
              <span className="text-slate-300 font-mono text-xs">
                {new Date(badge.unlocked_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Action */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
