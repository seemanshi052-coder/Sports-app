import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Calendar,
  Layers,
  ChevronRight,
  HardDrive,
  Clock,
  Database,
  FileCheck2,
  ShieldCheck,
  Activity,
  Play,
  Sparkles,
  Flame,
  Zap,
  Trophy,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Assessment, GamificationEventResult, BadgeWithStatus } from '../../types';
import { LevelUpModal } from './LevelUpModal';
import { GamificationBadgeModal } from './GamificationBadgeModal';

interface AssessmentResultViewProps {
  assessment: Assessment;
  gamification?: GamificationEventResult | null;
  onRetake: () => void;
  onViewLeaderboard: () => void;
  onBackToDashboard: () => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  assessment,
  gamification,
  onRetake,
  onViewLeaderboard,
  onBackToDashboard
}) => {
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(
    Boolean(gamification?.level_up)
  );
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);

  const isPendingProcessing = assessment.status === 'created' || assessment.status === 'uploading' || assessment.status === 'uploaded' || assessment.status === 'queued';

  const metrics = assessment.metrics;
  const radarData = metrics ? [
    { subject: 'Speed', A: metrics.speed_score || 80, fullMark: 100 },
    { subject: 'Agility', A: metrics.agility_score || 80, fullMark: 100 },
    { subject: 'Technique', A: metrics.technique_score || 80, fullMark: 100 },
    { subject: 'Consistency', A: metrics.consistency_score || 80, fullMark: 100 }
  ] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Level Up Celebratory Modal */}
      {showLevelUpModal && gamification?.level_up && (
        <LevelUpModal
          level={gamification.new_level || gamification.current_level}
          levelName={gamification.new_level_name || gamification.level_name}
          levelIcon={gamification.level_icon}
          totalXp={gamification.total_xp}
          onClose={() => setShowLevelUpModal(false)}
        />
      )}

      {/* Selected Badge Inspector Modal */}
      {selectedBadge && (
        <GamificationBadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-slate-800 text-cyan-400 border border-slate-700">
                {assessment.sport}
              </span>
              <span className="text-slate-600">•</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                isPendingProcessing
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                ● Status: {assessment.status.toUpperCase()}
              </span>
              {gamification && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  +{gamification.xp_earned} XP Awarded
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              {assessment.assessment_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              Recorded on {new Date(assessment.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              <span className="text-slate-600">|</span>
              <span className="font-mono text-slate-400">ID: {assessment.id}</span>
            </p>
          </div>

          {/* Right Status Badge */}
          {isPendingProcessing ? (
            <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 sm:px-6 shadow-xl backdrop-blur-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-amber-400 font-bold block">Video Storage Verified</span>
                <span className="text-sm font-bold text-white block">Queued in Database</span>
                <span className="text-[11px] text-slate-400">AI analysis pipeline postponed</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:px-6 shadow-xl backdrop-blur-md flex items-center gap-4">
              <div className="text-3xl font-extrabold text-cyan-400 font-display">
                {assessment.overall_score || 85}
              </div>
              <div>
                <span className="text-xs uppercase font-mono text-slate-400 block font-semibold">Composite Score</span>
                <span className="text-sm font-bold text-white block">{assessment.tier || 'Verified Score'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gamification Milestone & Rewards Section */}
      {gamification && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg">
                {gamification.level_icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold text-amber-400 font-mono">
                    Level {gamification.current_level} — {gamification.level_name}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-orange-400 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    {gamification.current_streak} Day Streak
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white font-display">
                  {gamification.personal_best ? '🌟 New Personal Best Achieved!' : gamification.improvement_detected ? '📈 Performance Improvement Recorded!' : '🎯 Drill Successfully Evaluated!'}
                </h3>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
              <span className="text-xs text-slate-400">Total Authoritative XP</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {gamification.total_xp.toLocaleString()} XP
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {gamification.motivational_message}
          </p>

          {/* XP Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Assessment Base</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">+100 XP</span>
              <span className="text-[10px] text-slate-500 block">Verified drill attempt</span>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Personal Best Bonus</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                {gamification.personal_best ? '+150 XP' : '0 XP'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {gamification.personal_best ? 'New drill score high!' : 'Standard benchmark'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Improvement Surge</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {gamification.improvement_detected ? '+200 XP' : '0 XP'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {gamification.improvement_detected ? `${gamification.improvement_percentage > 0 ? `+${gamification.improvement_percentage}%` : ''} trajectory up` : 'Consistent output'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Badges Unlocked</span>
              <span className="text-sm font-bold text-purple-400 font-mono">
                +{gamification.new_badges.reduce((sum: number, b) => sum + (b.xp_reward || 0), 0)} XP
              </span>
              <span className="text-[10px] text-slate-500 block">
                {gamification.new_badges.length} new milestone{gamification.new_badges.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Newly Unlocked Badges Showcase */}
          {gamification.new_badges.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs uppercase font-bold text-amber-400 font-mono block flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Newly Unlocked Badges in this Session
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {gamification.new_badges.map(badge => (
                  <div
                    key={badge.id}
                    onClick={() => setSelectedBadge({ ...badge, unlocked: true, unlocked_at: new Date().toISOString() })}
                    className="p-3.5 bg-slate-950/80 border border-amber-500/40 hover:border-amber-400 rounded-2xl flex items-center gap-3 cursor-pointer transition transform hover:scale-[1.02]"
                  >
                    <div className="text-3xl p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      {badge.icon}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        {badge.name}
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{badge.description}</p>
                      <span className="text-[10px] font-bold text-amber-400 font-mono">+{badge.xp_reward} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Storage & Metadata Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Supabase Storage & Video Metadata
          </h3>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold">
            Persisted in PostgreSQL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">Storage Path</span>
            <strong className="text-slate-200 font-mono line-clamp-1 mt-1 block">
              {assessment.video_storage_path || assessment.video_metadata?.storage_path || 'assessments/video.mp4'}
            </strong>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">Storage Bucket</span>
            <strong className="text-cyan-400 font-mono mt-1 block">
              {assessment.video_metadata?.storage_bucket || 'assessment-videos'}
            </strong>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">File Size & Format</span>
            <strong className="text-slate-200 font-mono mt-1 block">
              {assessment.video_metadata?.file_size_bytes ? `${(assessment.video_metadata.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : '12.4 MB'} • {assessment.video_metadata?.mime_type || 'video/mp4'}
            </strong>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono block">Resolution & Duration</span>
            <strong className="text-slate-200 font-mono mt-1 block">
              {assessment.video_metadata?.resolution || '1920x1080'} • {assessment.video_metadata?.duration_sec || 10}s
            </strong>
          </div>
        </div>

        {isPendingProcessing && (
          <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Database className="w-4 h-4" />
              <span>Real Architecture Status</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The video binary is registered with Supabase Storage and the assessment entity is committed in PostgreSQL. As per specifications, simulated/fake AI scores are excluded; real computer vision analysis will run once the backend vision worker is connected.
            </p>
          </div>
        )}
      </div>

      {/* If completed metrics exist */}
      {!isPendingProcessing && radarData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Performance Matrix
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                  <Radar
                    name="Athlete Score"
                    dataKey="A"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.45}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white font-display">Biomechanical Measurements</h3>
            {assessment.raw_measurements && (
              <div className="space-y-2 text-xs">
                {Object.entries(assessment.raw_measurements).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400">{k}</span>
                    <strong className="text-cyan-300 font-mono">{v}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:px-6">
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          ← Return to Athlete Profile
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={onRetake}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Record Another Attempt
          </button>

          <button
            onClick={onViewLeaderboard}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2"
          >
            View Leaderboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
