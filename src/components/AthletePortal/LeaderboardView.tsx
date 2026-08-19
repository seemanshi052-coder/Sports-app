import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Filter,
  CheckCircle2,
  MapPin,
  Flame,
  Activity,
  ArrowUpRight,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { LeaderboardItem, Sport } from '../../types';

interface LeaderboardViewProps {
  sports: Sport[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  sports
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedSport]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const url = selectedSport === 'all'
        ? '/api/v1/leaderboard'
        : `/api/v1/leaderboard?sport=${selectedSport}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data?.items) {
        setLeaderboard(json.data.items);
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    } finally {
      setIsLoading(false);
    }
  };

  const displayItems = leaderboard;

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-600 text-slate-950 font-extrabold flex items-center justify-center shadow-lg shadow-amber-500/20 font-mono text-sm">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-950 font-extrabold flex items-center justify-center font-mono text-sm">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-800 text-white font-extrabold flex items-center justify-center font-mono text-sm">
          3
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 font-bold flex items-center justify-center font-mono text-xs">
        {rank}
      </div>
    );
  };

  const getTierColor = (tier: string) => {
    if (tier.includes('National')) return 'text-amber-400 bg-amber-950/80 border-amber-500/30';
    if (tier.includes('Elite')) return 'text-cyan-400 bg-cyan-950/80 border-cyan-500/30';
    return 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Banner with Sport Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase font-bold tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            Verified Talent Standings
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            National Athletic Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Objective rankings verified by AI Computer Vision pose kinematics across standardized drill protocols.
          </p>
        </div>

        {/* Sport Filter Controls */}
        <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
          <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 rounded-2xl px-3.5 py-2 shadow-inner">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400 font-medium">Sport:</span>
            <select
              value={selectedSport}
              onChange={e => setSelectedSport(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Disciplines</option>
              {(sports || []).map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Athlete Ranking Summary Podium */}
      {displayItems.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          {/* #2 Silver */}
          <div className="order-2 md:order-1 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 font-bold">SILVER TIER</span>
              <div className="w-7 h-7 rounded-lg bg-slate-300 text-slate-950 font-bold flex items-center justify-center font-mono text-xs shadow">
                #2
              </div>
            </div>
            <div className="my-4 text-center space-y-2">
              <img
                src={displayItems[1]?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={displayItems[1]?.display_name}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-400 shadow-md"
              />
              <h3 className="font-bold text-white text-base tracking-tight">{displayItems[1]?.display_name}</h3>
              <p className="text-xs text-slate-400 font-mono">{displayItems[1]?.assessment_type}</p>
              <div className="text-2xl font-extrabold text-cyan-400 font-display">
                {displayItems[1]?.score} <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {displayItems[1]?.location}
              </span>
              <span className="text-slate-300 font-semibold">{displayItems[1]?.tier}</span>
            </div>
          </div>

          {/* #1 Gold Champion */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                GOLD CHAMPION
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-extrabold flex items-center justify-center font-mono text-sm shadow-md shadow-amber-500/30">
                #1
              </div>
            </div>
            <div className="my-4 text-center space-y-2">
              <img
                src={displayItems[0]?.avatar_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'}
                alt={displayItems[0]?.display_name}
                className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-amber-400 shadow-xl"
              />
              <h3 className="font-extrabold text-white text-lg tracking-tight">{displayItems[0]?.display_name}</h3>
              <p className="text-xs text-amber-300/80 font-mono">{displayItems[0]?.assessment_type}</p>
              <div className="text-3xl font-extrabold text-amber-400 font-display">
                {displayItems[0]?.score} <span className="text-sm font-normal text-slate-400">pts</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500/70" />
                {displayItems[0]?.location}
              </span>
              <span className="text-amber-300 font-semibold">{displayItems[0]?.tier}</span>
            </div>
          </div>

          {/* #3 Bronze */}
          <div className="order-3 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden transition-all shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-amber-700 font-bold">BRONZE TIER</span>
              <div className="w-7 h-7 rounded-lg bg-amber-700 text-white font-bold flex items-center justify-center font-mono text-xs shadow">
                #3
              </div>
            </div>
            <div className="my-4 text-center space-y-2">
              <img
                src={displayItems[2]?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                alt={displayItems[2]?.display_name}
                className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-amber-700 shadow-md"
              />
              <h3 className="font-bold text-white text-base tracking-tight">{displayItems[2]?.display_name}</h3>
              <p className="text-xs text-slate-400 font-mono">{displayItems[2]?.assessment_type}</p>
              <div className="text-2xl font-extrabold text-cyan-400 font-display">
                {displayItems[2]?.score} <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-medium">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                {displayItems[2]?.location}
              </span>
              <span className="text-slate-300 font-semibold">{displayItems[2]?.tier}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Leaderboard List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm font-display flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Ranked Athletic Index ({displayItems.length} Athletes)
          </h3>
          <span className="text-xs font-mono text-slate-400">Normalized Scale 0–100</span>
        </div>

        {displayItems.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Trophy className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white">No Leaderboard Rankings Available</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Verified standings will appear here as standardized assessments are recorded and evaluated.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 text-center">Rank</th>
                  <th className="py-3.5 px-4">Athlete</th>
                  <th className="py-3.5 px-4">Sport / Drill</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Score Breakdown</th>
                  <th className="py-3.5 px-4 text-right">Composite Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {displayItems.map(item => (
                  <tr key={`${item.athlete_id}_${item.assessment_type}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center">
                        {getRankBadge(item.rank)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={item.display_name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{item.display_name}</span>
                            {item.verified && (
                              <span title="CV Verified">
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getTierColor(item.tier)}`}>
                            {item.tier}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-200">{item.assessment_type}</div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase">{item.sport}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {item.location}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{item.age} yrs</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                        <span>Spd: <strong className="text-cyan-400">{item.speed_score || 80}</strong></span>
                        <span>•</span>
                        <span>Agl: <strong className="text-emerald-400">{item.agility_score || 80}</strong></span>
                        <span>•</span>
                        <span>Tec: <strong className="text-indigo-400">{item.technique_score || 80}</strong></span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-lg font-extrabold text-cyan-400 font-display">
                        {item.score}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">/ 100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
