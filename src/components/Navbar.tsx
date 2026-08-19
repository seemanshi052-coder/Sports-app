import React from 'react';
import {
  Trophy,
  Activity,
  Smartphone,
  Video,
  Users
} from 'lucide-react';

interface NavbarProps {
  currentView: 'athlete_dashboard' | 'assessment_room' | 'assessment_result' | 'leaderboard' | 'community';
  onNavigate: (view: 'athlete_dashboard' | 'leaderboard' | 'community') => void;
  onStartNewAssessment: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onStartNewAssessment
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Brand */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => onNavigate('athlete_dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  THE <span className="text-cyan-400">ELITEZ</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                    Athlete App
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 hidden sm:block">Standardized Sports Video Assessment</p>
              </div>
            </div>
          </div>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onNavigate('athlete_dashboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'athlete_dashboard' || currentView === 'assessment_room' || currentView === 'assessment_result'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Athlete Profile & Assessments
            </button>

            <button
              onClick={() => onNavigate('leaderboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'leaderboard'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Leaderboard
            </button>

            <button
              onClick={() => onNavigate('community')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'community'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              Community & Opportunities
            </button>
          </nav>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onStartNewAssessment}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs sm:text-sm px-3.5 py-2 rounded-lg shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Record Assessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-900/90 border-t border-slate-800/80 px-2 py-2 text-xs">
        <button
          onClick={() => onNavigate('athlete_dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded ${
            currentView === 'athlete_dashboard' || currentView === 'assessment_room' || currentView === 'assessment_result'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => onNavigate('leaderboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded ${
            currentView === 'leaderboard' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Leaderboard</span>
        </button>
        <button
          onClick={() => onNavigate('community')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded ${
            currentView === 'community' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Community</span>
        </button>
      </div>
    </header>
  );
};
