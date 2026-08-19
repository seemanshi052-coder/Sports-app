import React, { useState, useEffect } from 'react';
import {
  Activity,
  Trophy,
  Zap,
  Flame,
  Clock,
  Play,
  TrendingUp,
  User,
  MapPin,
  Award,
  ChevronRight,
  Plus,
  Edit3,
  Calendar,
  CheckCircle2,
  Globe,
  Lock,
  Shield,
  FileCheck,
  ExternalLink,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  AthleteProfile,
  Sport,
  Assessment,
  AssessmentType,
  ProfileVisibility,
  Achievement,
  AchievementEvidenceType,
  GamificationProfile,
  BadgeWithStatus,
  BadgeCategory
} from '../../types';
import { SPORTS_DATA } from '../../data/mockDatabase';
import { GamificationBadgeModal } from './GamificationBadgeModal';

interface AthleteDashboardProps {
  sports: Sport[];
  onStartAssessment: (sport?: Sport, drill?: AssessmentType) => void;
  onOpenDrillSelector: () => void;
  onViewAssessmentResult: (assessment: Assessment) => void;
  onViewLeaderboard: () => void;
}

export const AthleteDashboard: React.FC<AthleteDashboardProps> = ({
  sports,
  onStartAssessment,
  onOpenDrillSelector,
  onViewAssessmentResult,
  onViewLeaderboard
}) => {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<'ALL' | BadgeCategory>('ALL');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    age: 18,
    height_cm: 184,
    weight_kg: 76,
    sport: 'football',
    position: 'Winger / Attacking Midfielder',
    location: 'Manchester, UK',
    profile_visibility: 'PUBLIC' as ProfileVisibility
  });

  const [achievementForm, setAchievementForm] = useState({
    title: '',
    sport: 'football',
    event_name: '',
    date_achieved: new Date().toISOString().split('T')[0],
    evidence_type: 'Digital Certificate' as AchievementEvidenceType,
    certificate_url: '',
    notes: ''
  });

  const [isSavingAchievement, setIsSavingAchievement] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const [profRes, asmsRes, achRes, gamRes] = await Promise.all([
        fetch('/api/v1/athletes/me'),
        fetch('/api/v1/assessments'),
        fetch('/api/v1/achievements'),
        fetch('/api/v1/gamification/me')
      ]);

      const profData = await profRes.json();
      const asmsData = await asmsRes.json();
      const achData = await achRes.json();
      const gamData = await gamRes.json();

      if (profData.success && profData.data) {
        setProfile(profData.data);
        setEditForm({
          name: profData.data.name || '',
          age: profData.data.age || 18,
          height_cm: profData.data.height_cm || 184,
          weight_kg: profData.data.weight_kg || 76,
          sport: profData.data.sport || 'football',
          position: profData.data.position || '',
          location: profData.data.location || '',
          profile_visibility: profData.data.profile_visibility || 'PUBLIC'
        });
      }

      if (asmsData.success && asmsData.data) {
        setAssessments(asmsData.data);
      }

      if (achData.success && achData.data) {
        setAchievements(achData.data);
      }

      if (gamData.success && gamData.data) {
        setGamification(gamData.data);
      }
    } catch (e) {
      console.error('Failed to load athlete profile data', e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/athletes/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setIsEditingProfile(false);
      }
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleUpdateVisibilityQuick = async (newVisibility: ProfileVisibility) => {
    try {
      const res = await fetch('/api/v1/athletes/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_visibility: newVisibility })
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, profile_visibility: newVisibility } : null);
        setEditForm(prev => ({ ...prev, profile_visibility: newVisibility }));
      }
    } catch (err) {
      console.error('Visibility update failed', err);
    }
  };

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAchievement(true);
    try {
      const res = await fetch('/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(achievementForm)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAchievements(prev => [data.data, ...prev]);
        setIsAddingAchievement(false);
        setAchievementForm({
          title: '',
          sport: profile?.sport || 'football',
          event_name: '',
          date_achieved: new Date().toISOString().split('T')[0],
          evidence_type: 'Digital Certificate',
          certificate_url: '',
          notes: ''
        });
      }
    } catch (err) {
      console.error('Achievement creation failed', err);
    } finally {
      setIsSavingAchievement(false);
    }
  };

  const activeSportsList = sports && sports.length > 0 ? sports : SPORTS_DATA;
  const currentSport = activeSportsList.find(s => s.id === (profile?.sport || 'football')) || activeSportsList[0] || SPORTS_DATA[0];

  // Dynamic Overall Rating: arithmetic mean of completed assessment drill scores
  const completedWithScores = assessments.filter(a => a.status === 'completed' && a.overall_score != null);
  const calculatedOverallRating = completedWithScores.length > 0
    ? (completedWithScores.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completedWithScores.length)
    : (profile?.overall_rating || null);

  // Dynamic trajectory chart data
  const progressChartData = completedWithScores.length > 0
    ? completedWithScores.slice(-5).map((a, idx) => ({
        date: new Date(a.completed_at || a.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: a.overall_score || 0
      }))
    : [];

  const getVisibilityBadge = (visibility: ProfileVisibility) => {
    switch (visibility) {
      case 'COACHES_ONLY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Coaches Only
          </span>
        );
      case 'PRIVATE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            Private Profile
          </span>
        );
      case 'PUBLIC':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Public Profile
          </span>
        );
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Verified
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
            <Clock className="w-3 h-3 text-indigo-400" />
            Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-500/40">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Clarification Needed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-500/40">
            <Clock className="w-3 h-3 text-amber-400" />
            Evidence Submitted
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Athlete Hero Profile Dossier Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Personal Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <img
                src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={profile?.name || 'Athlete'}
                className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/10"
              />
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 border-2 border-slate-900" title="Active Certified Athlete" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight flex items-center gap-2">
                  {profile?.name || 'Marcus Vance'}
                  {gamification?.level_icon && (
                    <span className="text-xl" title={`Level ${gamification.level} — ${gamification.level_name}`}>
                      {gamification.level_icon}
                    </span>
                  )}
                </h1>
                {gamification && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <span>{gamification.level_icon}</span>
                    <span>Lvl {gamification.level} — {gamification.level_name}</span>
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {profile?.experience_level?.toUpperCase() || 'ELITE PROSPECT'}
                </span>
                {getVisibilityBadge(profile?.profile_visibility || 'PUBLIC')}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                <span className="text-cyan-400 font-semibold">{profile?.position || 'Winger / Attacking Midfielder'}</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile?.location || 'Manchester, UK'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{profile?.age || 18} yrs old</span>
                {gamification && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-orange-400 font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
                      {gamification.current_streak} Day Streak
                    </span>
                  </>
                )}
              </p>

              {/* Physical Biometrics & XP Chips */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
                <span>Height: <strong className="text-slate-200">{profile?.height_cm || 184} cm</strong></span>
                <span>|</span>
                <span>Weight: <strong className="text-slate-200">{profile?.weight_kg || 76} kg</strong></span>
                <span>|</span>
                <span>Assessments: <strong className="text-cyan-400">{profile?.total_assessments || assessments.length}</strong></span>
                <span>|</span>
                <span>Total XP: <strong className="text-amber-400">{gamification?.total_xp?.toLocaleString() || 600} XP</strong></span>
              </div>
            </div>
          </div>

          {/* Right Hero Score & Action */}
          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[130px]">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Overall Rating</span>
              {calculatedOverallRating != null ? (
                <>
                  <span className="text-3xl font-extrabold text-cyan-400 font-display block">
                    {Number(calculatedOverallRating).toFixed(1)}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Verified Drill Avg</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-bold text-amber-400 font-display block py-1">
                    Not Rated Yet
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Complete drill to rate</span>
                </>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={onOpenDrillSelector}
                className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Drill
              </button>

              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* Inline Edit Profile Form Drawer */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in duration-150">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Primary Sport</label>
              <select
                value={editForm.sport}
                onChange={e => setEditForm({ ...editForm, sport: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                {activeSportsList.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Position / Discipline</label>
              <input
                type="text"
                value={editForm.position}
                onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Age</label>
              <input
                type="number"
                value={editForm.age}
                onChange={e => setEditForm({ ...editForm, age: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Height (cm)</label>
              <input
                type="number"
                value={editForm.height_cm}
                onChange={e => setEditForm({ ...editForm, height_cm: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Weight (kg)</label>
              <input
                type="number"
                value={editForm.weight_kg}
                onChange={e => setEditForm({ ...editForm, weight_kg: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Profile Privacy & Visibility</label>
              <select
                value={editForm.profile_visibility}
                onChange={e => setEditForm({ ...editForm, profile_visibility: e.target.value as ProfileVisibility })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:border-cyan-500 focus:outline-none"
              >
                <option value="PUBLIC">PUBLIC — Visible to All & Public Leaderboard</option>
                <option value="COACHES_ONLY">COACHES_ONLY — Verified Scouts & Coaches Only</option>
                <option value="PRIVATE">PRIVATE — Hidden from Search & Public Rankings</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex items-end justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-2 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-500 text-white font-semibold shadow-md hover:bg-cyan-400 transition-colors"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Gamification Progression & Streak Hub */}
      {gamification && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Level & XP Progress Card (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner">
                  {gamification.level_icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                      Level {gamification.level}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-semibold text-slate-300">
                      {gamification.level_name}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white font-display">
                    {gamification.total_xp.toLocaleString()} <span className="text-amber-400 font-mono text-sm">Authoritative XP</span>
                  </h3>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-mono block">Next Milestone</span>
                <span className="text-xs font-bold text-cyan-400">
                  {gamification.next_level_xp
                    ? `${(gamification.next_level_xp - gamification.total_xp).toLocaleString()} XP to Lvl ${gamification.level + 1}`
                    : 'Max Tier Reached'}
                </span>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 p-0.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(8, gamification.level_progress_percentage))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
                <span>Lvl {gamification.level} ({gamification.current_level_min_xp.toLocaleString()} XP)</span>
                <span>{Math.round(gamification.level_progress_percentage)}% completed</span>
                <span>{gamification.next_level_xp ? `Lvl ${gamification.level + 1} (${gamification.next_level_xp.toLocaleString()} XP)` : 'Elite Peak'}</span>
              </div>
            </div>

            {/* Motivational Banner */}
            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-slate-300 font-medium">
                  Authoritative Progression Hub: Complete standardized drills and hit personal bests to unlock elite badges.
                </span>
              </div>
            </div>
          </div>

          {/* Daily Streak & Activity Ledger (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
                  <Flame className="w-5 h-5 fill-orange-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display">Daily Activity Streak</h4>
                  <p className="text-[11px] text-slate-400">Consistent training multiplier</p>
                </div>
              </div>
              <span className="text-2xl font-black text-orange-400 font-display flex items-center gap-1">
                {gamification.current_streak} <span className="text-xs font-mono text-slate-400 font-normal">days</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-center font-mono">
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Longest Streak</span>
                <span className="text-sm font-bold text-white">{gamification.longest_streak} Days</span>
              </div>
              <div className="p-2 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Badges Earned</span>
                <span className="text-sm font-bold text-cyan-400">
                  {gamification.badges.filter(b => b.unlocked).length} / {gamification.badges.length}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-medium italic text-center">
              "Every standardized assessment performed maintains your streak and awards XP."
            </p>
          </div>
        </div>
      )}

      {/* 3. Badges & Milestones Collection Showcase */}
      {gamification && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white font-display">Earned Badges & Milestones</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Unlock badges for levels, training streaks, performance milestones, and personal bests. Tap any badge to inspect requirements.
              </p>
            </div>

            {/* Badge Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {(['ALL', 'LEVEL', 'STREAK', 'IMPROVEMENT', 'ASSESSMENT', 'ACHIEVEMENT'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setBadgeFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    badgeFilter === tab
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'ALL' ? 'All Badges' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
            {gamification.badges
              .filter(b => badgeFilter === 'ALL' || b.category === badgeFilter)
              .map(badge => (
                <button
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-between transition-all duration-200 group ${
                    badge.unlocked
                      ? 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950 shadow-md'
                      : 'bg-slate-950/30 border-slate-850 opacity-50 grayscale hover:grayscale-0 hover:opacity-75'
                  }`}
                >
                  <div className="relative mb-2">
                    <div className="text-3xl transition-transform group-hover:scale-110">
                      {badge.icon}
                    </div>
                    {badge.unlocked && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" />
                    )}
                  </div>

                  <div className="space-y-0.5 w-full">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block truncate">
                      {badge.category}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {badge.name}
                    </h4>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 w-full flex items-center justify-between text-[10px] font-mono">
                    <span className={badge.unlocked ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {badge.unlocked ? 'Unlocked' : 'Locked'}
                    </span>
                    {badge.xp_reward > 0 && (
                      <span className="text-amber-400 font-bold">+{badge.xp_reward}XP</span>
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 4. Achievements & Verification Evidence Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white font-display">Achievements & Certificates</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified competition medals, tournament certificates, and institutional recognitions.
            </p>
          </div>
          <button
            onClick={() => setIsAddingAchievement(!isAddingAchievement)}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Achievement
          </button>
        </div>

        {/* Add Achievement Drawer */}
        {isAddingAchievement && (
          <form onSubmit={handleAddAchievement} className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                Submit Evidence for Verification
              </span>
              <button
                type="button"
                onClick={() => setIsAddingAchievement(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Achievement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Championship MVP / 100m Gold"
                  value={achievementForm.title}
                  onChange={e => setAchievementForm({ ...achievementForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Competition / Event Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Youth Athletics Games 2026"
                  value={achievementForm.event_name}
                  onChange={e => setAchievementForm({ ...achievementForm, event_name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Evidence Type</label>
                <select
                  value={achievementForm.evidence_type}
                  onChange={e => setAchievementForm({ ...achievementForm, evidence_type: e.target.value as AchievementEvidenceType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Digital Certificate">Digital Certificate</option>
                  <option value="Physical Certificate">Physical Certificate</option>
                  <option value="Competition Result">Competition Result</option>
                  <option value="Institution Verification">Institution Verification</option>
                  <option value="Organizer Verification">Organizer Verification</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Date Achieved *</label>
                <input
                  type="date"
                  required
                  value={achievementForm.date_achieved}
                  onChange={e => setAchievementForm({ ...achievementForm, date_achieved: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Certificate / Result Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://... (URL to digital certificate or photo)"
                  value={achievementForm.certificate_url}
                  onChange={e => setAchievementForm({ ...achievementForm, certificate_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Notes / Additional Verification Context</label>
                <textarea
                  rows={2}
                  placeholder="Add details on award category, timing, or issuing authority..."
                  value={achievementForm.notes}
                  onChange={e => setAchievementForm({ ...achievementForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingAchievement(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingAchievement}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isSavingAchievement ? 'Submitting...' : 'Submit Achievement'}
              </button>
            </div>
          </form>
        )}

        {/* Achievements List or Empty State */}
        {achievements.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
              <Award className="w-5 h-5 text-amber-400/80" />
            </div>
            <h4 className="text-sm font-semibold text-white">No Achievements Recorded Yet</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Submit competition results, certificates, or institutional recognitions to build your verified athlete credentials.
            </p>
            <button
              onClick={() => setIsAddingAchievement(true)}
              className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold transition-colors"
            >
              + Add First Achievement
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {achievements.map(ach => (
              <div
                key={ach.id}
                className="p-4 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-sm">{ach.title}</h3>
                    <p className="text-xs text-cyan-400 font-medium">{ach.event_name}</p>
                  </div>
                  {getVerificationBadge(ach.verification_status)}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(ach.date_achieved).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <FileText className="w-3 h-3 text-slate-500" />
                    {ach.evidence_type}
                  </span>
                  {ach.verified_by && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400">By {ach.verified_by}</span>
                    </>
                  )}
                </div>

                {ach.notes && (
                  <p className="text-xs text-slate-300/90 italic leading-relaxed pt-1">
                    "{ach.notes}"
                  </p>
                )}

                {ach.certificate_url && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Attached Evidence Document</span>
                    <a
                      href={ach.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      <span>View File</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Standardized Drills Catalog Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono text-cyan-400 font-semibold">Standardized Protocols</span>
            <h2 className="text-lg font-bold text-white font-display">Available Drills ({currentSport?.name || 'Football'})</h2>
          </div>
          <button
            onClick={onOpenDrillSelector}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            Browse All Sports →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(currentSport?.assessment_types || []).map(drill => (
            <div
              key={drill.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                    drill.category === 'speed' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30' :
                    drill.category === 'power' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {drill.category}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                    <Clock className="w-3 h-3" />
                    {drill.duration_sec}s
                  </span>
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                  {drill.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{drill.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">{drill.metrics.length} biometric metrics</span>
                <button
                  onClick={() => onStartAssessment(currentSport, drill)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Perform
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Performance Trend & Recent Assessment History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Line Chart (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Talent Score Trajectory
            </h3>
            {completedWithScores.length > 0 && (
              <span className="text-xs font-mono text-emerald-400">
                {completedWithScores.length} Drill{completedWithScores.length > 1 ? 's' : ''} Scored
              </span>
            )}
          </div>

          {progressChartData.length > 0 ? (
            <>
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis domain={[50, 100]} stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#06b6d4' }}
                      activeDot={{ r: 6, fill: '#38bdf8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-slate-400 text-center font-mono">
                Progress tracking across standardized kinematic drill repetitions.
              </p>
            </>
          ) : (
            <div className="py-14 px-4 text-center space-y-2">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="text-xs font-semibold text-white">No Trajectory Data Yet</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Perform and complete standardized drills to generate your historical talent trajectory and score trends.
              </p>
            </div>
          )}
        </div>

        {/* Recent Completed Assessments (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm font-display flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Assessment History & Breakdown
            </h3>
            <button
              onClick={onViewLeaderboard}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Check Leaderboard
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
            {assessments.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2 bg-slate-950/40 border border-slate-800/80 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">No assessments completed yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click "Start Drill" above to record your first video assessment session!
                </p>
              </div>
            ) : (
              assessments.map(asm => (
                <div
                  key={asm.id}
                  onClick={() => onViewAssessmentResult(asm)}
                  className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-slate-950 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">
                        {asm.assessment_name}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {asm.sport}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(asm.completed_at || asm.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <span>•</span>
                      <span className="text-emerald-400">Confidence {asm.confidence_score || 95}%</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-cyan-400 font-display">
                        {asm.overall_score || 85}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">{asm.tier || 'Scouted'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Interactive Badge Inspection Modal */}
      {selectedBadge && (
        <GamificationBadgeModal
          badge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
        />
      )}
    </div>
  );
};
