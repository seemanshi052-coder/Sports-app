import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  Calendar,
  Activity,
  Award,
  ShieldCheck,
  Trophy,
  Dumbbell,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  Star,
  Bookmark,
  Share2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { AthleteProfile, Assessment, ScoutNote } from '../../types';

interface AthleteDetailModalProps {
  athleteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AthleteDetailModal: React.FC<AthleteDetailModalProps> = ({
  athleteId,
  isOpen,
  onClose
}) => {
  const [data, setData] = useState<{
    athlete: AthleteProfile;
    assessments: Assessment[];
    scout_notes: ScoutNote[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [scoutRating, setScoutRating] = useState(9.0);
  const [recruitmentStatus, setRecruitmentStatus] = useState<'shortlisted' | 'trial_offered' | 'signed' | 'watching'>('shortlisted');

  useEffect(() => {
    if (athleteId && isOpen) {
      fetchAthleteDetails(athleteId);
    }
  }, [athleteId, isOpen]);

  const fetchAthleteDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/athletes/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to load athlete dossier', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddScoutNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athleteId || !newNote.trim()) return;

    try {
      const res = await fetch('/api/v1/scout/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          athlete_id: athleteId,
          note: newNote,
          rating: scoutRating,
          status: recruitmentStatus,
          tags: ['Scout Evaluation', 'Talent ID']
        })
      });
      const json = await res.json();
      if (json.success && data) {
        setData({
          ...data,
          scout_notes: [json.data, ...data.scout_notes]
        });
        setNewNote('');
      }
    } catch (err) {
      console.error('Failed to add note', err);
    }
  };

  if (!isOpen || !athleteId) return null;

  const athlete = data?.athlete;
  const latestAsm = data?.assessments?.[0];

  const radarData = [
    { subject: 'Speed', A: latestAsm?.metrics?.speed_score || 85, fullMark: 100 },
    { subject: 'Agility', A: latestAsm?.metrics?.agility_score || 82, fullMark: 100 },
    { subject: 'Technique', A: latestAsm?.metrics?.technique_score || 88, fullMark: 100 },
    { subject: 'Consistency', A: latestAsm?.metrics?.consistency_score || 80, fullMark: 100 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono px-2.5 py-1 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30 font-bold">
              Scout Evaluation Dossier
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">ID: {athleteId}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading || !athlete ? (
            <div className="py-20 text-center text-slate-400 text-sm font-mono">
              Compiling Biomechanical Dossier...
            </div>
          ) : (
            <>
              {/* Athlete Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <img
                    src={athlete.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={athlete.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-bold text-white font-display">{athlete.name}</h2>
                      <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-mono font-semibold">
                        {athlete.sport.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 font-medium">{athlete.position}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-3">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {athlete.location}</span>
                      <span>•</span>
                      <span>{athlete.age} yrs</span>
                      <span>•</span>
                      <span>{athlete.height_cm} cm / {athlete.weight_kg} kg</span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center min-w-[120px]">
                  <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block">Composite Score</span>
                  <span className="text-3xl font-extrabold text-cyan-400 font-display block">
                    {athlete.overall_rating || 88}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Scout Verified</span>
                </div>
              </div>

              {/* 2-Column Grid: Radar Matrix & Biomechanics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Athletic Radar Profile
                  </h4>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                        <Radar
                          name="Athlete"
                          dataKey="A"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.45}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Latest Biomechanical Metrics */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Latest Assessment Biometrics ({latestAsm?.assessment_name || 'Standard Drill'})
                  </h4>
                  {latestAsm?.raw_measurements ? (
                    <div className="space-y-2 text-xs">
                      {Object.entries(latestAsm.raw_measurements).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                          <span className="text-slate-400">{k}</span>
                          <strong className="text-cyan-300 font-mono">{v}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-6 text-center">No raw measurements available.</p>
                  )}
                </div>
              </div>

              {/* Scout Evaluation Notes & Timeline */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Scout Evaluations & Trial Notes ({data.scout_notes.length})
                  </h4>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddScoutNote} className="space-y-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Scout Rating:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="10"
                        value={scoutRating}
                        onChange={e => setScoutRating(Number(e.target.value))}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Status:</span>
                      <select
                        value={recruitmentStatus}
                        onChange={e => setRecruitmentStatus(e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-medium"
                      >
                        <option value="shortlisted">Shortlisted</option>
                        <option value="trial_offered">Trial Offered</option>
                        <option value="signed">Signed</option>
                        <option value="watching">Watching</option>
                      </select>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Enter scout observations, contact notes, or trial invitations..."
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newNote.trim()}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Add Evaluation Note
                    </button>
                  </div>
                </form>

                {/* Existing Scout Notes */}
                <div className="space-y-3 pt-2">
                  {data.scout_notes.map(note => (
                    <div key={note.id} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          {note.scout_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" /> {note.rating}/10
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                            {note.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{note.note}</p>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Logged on {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
