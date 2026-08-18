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
  CheckCircle2
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
import { AthleteProfile, Sport, Assessment, AssessmentType } from '../../types';

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    age: 18,
    height_cm: 184,
    weight_kg: 76,
    sport: 'football',
    position: 'Winger / Attacking Midfielder',
    location: 'Manchester, UK'
  });

  useEffect(() => {
    fetchProfileAndAssessments();
  }, []);

  const fetchProfileAndAssessments = async () => {
    try {
      const [profRes, asmsRes] = await Promise.all([
        fetch('/api/v1/athletes/me'),
        fetch('/api/v1/assessments')
      ]);
      const profData = await profRes.json();
      const asmsData = await asmsRes.json();

      if (profData.success && profData.data) {
        setProfile(profData.data);
        setEditForm({
          name: profData.data.name,
          age: profData.data.age,
          height_cm: profData.data.height_cm,
          weight_kg: profData.data.weight_kg,
          sport: profData.data.sport,
          position: profData.data.position,
          location: profData.data.location
        });
      }

      if (asmsData.success && asmsData.data) {
        setAssessments(asmsData.data);
      }
    } catch (e) {
      console.error('Failed to load profile data', e);
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

  const currentSport = sports.find(s => s.id === (profile?.sport || 'football')) || sports[0];

  // Dynamic Overall Rating: exact arithmetic mean of all completed assessment drill scores
  const completedWithScores = assessments.filter(a => a.status === 'completed' && a.overall_score != null);
  const calculatedOverallRating = completedWithScores.length > 0
    ? (completedWithScores.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completedWithScores.length)
    : (profile?.overall_rating || 83.5);

  const progressChartData = [
    { date: 'May 26', score: 76 },
    { date: 'Jun 26', score: 81 },
    { date: 'Jul 26', score: 85 },
    { date: 'Aug 26', score: Number(calculatedOverallRating) }
  ];

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

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
                  {profile?.name || 'Marcus Vance'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {profile?.experience_level?.toUpperCase() || 'ELITE PROSPECT'}
                </span>
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
              </p>

              {/* Physical Biometrics Chips */}
              <div className="flex items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
                <span>Height: <strong className="text-slate-200">{profile?.height_cm || 184} cm</strong></span>
                <span>|</span>
                <span>Weight: <strong className="text-slate-200">{profile?.weight_kg || 76} kg</strong></span>
                <span>|</span>
                <span>Assessments: <strong className="text-cyan-400">{profile?.total_assessments || assessments.length}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Hero Score & Action */}
          <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center min-w-[110px]">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Overall Rating</span>
              <span className="text-3xl font-extrabold text-cyan-400 font-display block">
                {Number(calculatedOverallRating).toFixed(1)}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Verified Drill Avg</span>
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
                {sports.map(s => (
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
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-500 text-white font-semibold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. Standardized Drills Catalog Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-mono text-cyan-400 font-semibold">Standardized Protocols</span>
            <h2 className="text-lg font-bold text-white font-display">Available Drills ({currentSport.name})</h2>
          </div>
          <button
            onClick={onOpenDrillSelector}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            Browse All Sports →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentSport.assessment_types.map(drill => (
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
                <span className="text-xs text-slate-400">{drill.metrics.length} CV biometric metrics</span>
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

      {/* 3. Performance Trend & Recent Assessment History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Line Chart (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Talent Score Trajectory
            </h3>
            <span className="text-xs font-mono text-emerald-400">+13 pts (Last 90 Days)</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis domain={[60, 100]} stroke="#64748b" fontSize={11} />
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
            Consistent improvement observed in ground reaction velocity and trunk lean posture.
          </p>
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
              <div className="p-8 text-center text-slate-500 text-xs">
                No assessments completed yet. Click "Start Drill" above to record your first session!
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
    </div>
  );
};
