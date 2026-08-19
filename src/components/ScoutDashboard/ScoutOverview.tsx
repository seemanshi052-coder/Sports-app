import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  Trophy,
  Activity,
  Award,
  Layers,
  MapPin,
  CheckCircle2,
  Bookmark,
  Star,
  ChevronRight,
  Eye,
  ArrowUpDown,
  Sparkles,
  SlidersHorizontal,
  Scale
} from 'lucide-react';
import { AthleteProfile, Sport, PlatformStats } from '../../types';
import { AthleteDetailModal } from './AthleteDetailModal';
import { AthleteComparisonModal } from './AthleteComparisonModal';

interface ScoutOverviewProps {
  sports: Sport[];
}

export const ScoutOverview: React.FC<ScoutOverviewProps> = ({ sports }) => {
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(70);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [activeDossierId, setActiveDossierId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  useEffect(() => {
    fetchAthletesAndStats();
  }, [selectedSport, minRating]);

  const fetchAthletesAndStats = async () => {
    setIsLoading(true);
    try {
      let url = `/api/v1/athletes?min_score=${minRating}`;
      if (selectedSport !== 'all') {
        url += `&sport=${selectedSport}`;
      }

      const [athRes, statsRes] = await Promise.all([
        fetch(url),
        fetch('/api/v1/stats/overview')
      ]);

      const athJson = await athRes.json();
      const statsJson = await statsRes.json();

      if (athJson.success && athJson.data) {
        setAthletes(athJson.data);
      }
      if (statsJson.success && statsJson.data) {
        setStats(statsJson.data);
      }
    } catch (e) {
      console.error('Failed to load scout data', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(item => item !== id));
    } else {
      if (compareIds.length >= 3) {
        alert('You can compare up to 3 athletes simultaneously.');
        return;
      }
      setCompareIds([...compareIds, id]);
    }
  };

  const filteredAthletes = athletes.filter(ath => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = ath.name.toLowerCase().includes(q) ||
        ath.location.toLowerCase().includes(q) ||
        ath.position.toLowerCase().includes(q) ||
        ath.sport.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedPosition !== 'all' && !ath.position.toLowerCase().includes(selectedPosition.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Scout Hub Banner & High-Level Platform Intelligence */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase px-2.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold">
                Coach & Scout Intelligence Hub
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                AI Biomechanical Index v2.4
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Talent Discovery & Scouting Matrix
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Filter athletes by standardized CV measurements, review frame-by-frame pose kinematics, and evaluate prospects objectively.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 self-stretch md:self-auto">
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Total Athletes</span>
              <span className="text-xl font-bold text-white font-display mt-0.5 block">{stats?.total_athletes || 1420}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">CV Assessments</span>
              <span className="text-xl font-bold text-cyan-400 font-display mt-0.5 block">{stats?.total_assessments || 4890}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">AI Accuracy</span>
              <span className="text-xl font-bold text-emerald-400 font-display mt-0.5 block">{stats?.ai_accuracy_rate || 97.4}%</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">Active Scouts</span>
              <span className="text-xl font-bold text-indigo-400 font-display mt-0.5 block">{stats?.scouts_active || 135}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Scouting Filters & Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by athlete name, position, sport, city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Sports</option>
              {(sports || []).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Min Score:</span>
            <select
              value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={70}>70+ (All Prospects)</option>
              <option value={80}>80+ (Regional Talent)</option>
              <option value={85}>85+ (Elite Prospect)</option>
              <option value={90}>90+ (National Level)</option>
            </select>
          </div>

          {/* Compare Button */}
          {compareIds.length > 0 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-transform active:scale-95 animate-pulse"
            >
              <Scale className="w-3.5 h-3.5" />
              Compare ({compareIds.length})
            </button>
          )}
        </div>
      </div>

      {/* 3. Athlete Talent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAthletes.map(ath => {
          const isComparing = compareIds.includes(ath.id);
          return (
            <div
              key={ath.id}
              onClick={() => setActiveDossierId(ath.id)}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-900/90 group shadow-lg"
            >
              <div>
                {/* Top Row: Avatar + Rating + Compare checkbox */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={ath.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={ath.name}
                      className="w-13 h-13 rounded-xl object-cover border border-slate-700 group-hover:border-indigo-500 transition-colors"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-indigo-300 transition-colors">
                        {ath.name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {ath.location}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-cyan-400 font-display">
                      {ath.overall_rating || 85}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block">Rating</span>
                  </div>
                </div>

                {/* Athlete Sport, Position & Bio */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800 font-bold">
                      {ath.sport}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {ath.position}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {ath.bio || 'Verified athlete with comprehensive video kinematic assessments on file.'}
                  </p>
                </div>

                {/* Physical Bio Specs */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Age</span>
                    <strong className="text-slate-200">{ath.age} yrs</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Height</span>
                    <strong className="text-slate-200">{ath.height_cm} cm</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Weight</span>
                    <strong className="text-slate-200">{ath.weight_kg} kg</strong>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => handleToggleCompare(ath.id, e)}
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    isComparing
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Scale className="w-3 h-3" />
                  {isComparing ? 'Comparing ✓' : '+ Compare'}
                </button>

                <div className="text-xs text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>View Dossier</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <AthleteDetailModal
        athleteId={activeDossierId}
        isOpen={Boolean(activeDossierId)}
        onClose={() => setActiveDossierId(null)}
      />

      {/* Multi-Athlete Comparison Modal */}
      <AthleteComparisonModal
        athleteIds={compareIds}
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
      />
    </div>
  );
};
