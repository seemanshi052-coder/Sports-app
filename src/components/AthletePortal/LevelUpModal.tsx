import React from 'react';
import { Sparkles, Trophy, ArrowRight, ShieldCheck } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  levelName: string;
  levelIcon: string;
  totalXp: number;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  level,
  levelName,
  levelIcon,
  totalXp,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-center">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-5">
          {/* Header Tag */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-widest animate-pulse">
            <Sparkles className="w-4 h-4" />
            ATHLETIC LEVEL UP!
          </div>

          {/* Level Icon Avatar */}
          <div className="relative mx-auto w-28 h-28 flex items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-400 shadow-2xl shadow-amber-500/20 text-6xl">
            {levelIcon}
            <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-extrabold shadow-md">
              LEVEL {level}
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-black text-white tracking-tight font-display mt-2">
              {levelName}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              You've officially advanced to Level {level} on The Elitez. Your consistency and assessment results are unlocking your true potential.
            </p>
          </div>

          {/* Stats Highlight */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex items-center justify-around text-center">
            <div>
              <div className="text-xs text-slate-400 font-medium">Authoritative XP</div>
              <div className="text-xl font-black text-amber-400 font-mono">{totalXp.toLocaleString()} XP</div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-xs text-slate-400 font-medium">New Status</div>
              <div className="text-sm font-bold text-white flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Verified
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            Keep Pushing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
