import React from 'react';
import {
  Trophy,
  Activity,
  Smartphone,
  LayoutDashboard
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  currentView: 'athlete_dashboard' | 'assessment_room' | 'assessment_result' | 'leaderboard' | 'scout_dashboard';
  onNavigate: (view: 'athlete_dashboard' | 'leaderboard' | 'scout_dashboard') => void;
  userRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  activeSport: string;
  onSelectSport: (sport: string) => void;
  onStartNewAssessment: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  userRole,
  onSwitchRole,
  onStartNewAssessment
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
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
                    Mobile App
                  </span>
                </span>
                <p className="text-[11px] text-slate-400 hidden sm:block">Standardized Sports Video Analysis & Scouting</p>
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
              Athlete Portal
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
              Verified Leaderboard
            </button>

            <button
              onClick={() => onNavigate('scout_dashboard')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentView === 'scout_dashboard'
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Scout & Coach Hub
            </button>
          </nav>

          {/* Quick Action & Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick assessment launch button */}
            <button
              onClick={onStartNewAssessment}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-xs sm:text-sm px-3.5 py-2 rounded-lg shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Record</span> Assessment
            </button>

            {/* Persona switcher pill */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => {
                  onSwitchRole('athlete');
                  onNavigate('athlete_dashboard');
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  userRole === 'athlete'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Athlete View
              </button>
              <button
                onClick={() => {
                  onSwitchRole('scout');
                  onNavigate('scout_dashboard');
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  userRole === 'scout'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Scout Hub
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-slate-900/90 border-t border-slate-800/80 px-2 py-2 text-xs">
        <button
          onClick={() => onNavigate('athlete_dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            currentView === 'athlete_dashboard' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Athlete</span>
        </button>
        <button
          onClick={() => onNavigate('leaderboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            currentView === 'leaderboard' ? 'text-cyan-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>Rankings</span>
        </button>
        <button
          onClick={() => onNavigate('scout_dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded ${
            currentView === 'scout_dashboard' ? 'text-indigo-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Scouts</span>
        </button>
      </div>
    </header>
  );
};
