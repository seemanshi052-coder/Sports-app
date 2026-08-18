import React, { useState } from 'react';
import {
  X,
  Activity,
  Flame,
  Zap,
  Trophy,
  CheckCircle2,
  Camera,
  Play,
  ArrowRight,
  ShieldCheck,
  Clock,
  Gauge
} from 'lucide-react';
import { Sport, AssessmentType } from '../../types';

interface DrillSelectionModalProps {
  sports: Sport[];
  isOpen: boolean;
  onClose: () => void;
  onSelectDrill: (sport: Sport, drill: AssessmentType) => void;
  initialSportId?: string;
}

export const DrillSelectionModal: React.FC<DrillSelectionModalProps> = ({
  sports,
  isOpen,
  onClose,
  onSelectDrill,
  initialSportId = 'football'
}) => {
  const [selectedSportId, setSelectedSportId] = useState(initialSportId);
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSport = sports.find(s => s.id === selectedSportId) || sports[0];
  const currentDrill = currentSport?.assessment_types.find(d => d.id === selectedDrillId) || currentSport?.assessment_types[0];

  const getSportIcon = (iconName: string) => {
    switch (iconName) {
      case 'Activity': return <Activity className="w-5 h-5 text-emerald-400" />;
      case 'Flame': return <Flame className="w-5 h-5 text-amber-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'Trophy': return <Trophy className="w-5 h-5 text-sky-400" />;
      default: return <Activity className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <span className="text-xs uppercase tracking-wider font-mono text-cyan-400 font-bold">Standardized Assessment</span>
            <h2 className="text-xl font-bold text-white font-display">Select Sport & Performance Drill</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Sport Selector Pills */}
          <div>
            <label className="text-xs font-mono uppercase text-slate-400 font-semibold mb-2.5 block">1. Choose Sport Discipline</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sports.map(sport => {
                const isSelected = sport.id === selectedSportId;
                return (
                  <button
                    key={sport.id}
                    onClick={() => {
                      setSelectedSportId(sport.id);
                      setSelectedDrillId(sport.assessment_types[0]?.id || null);
                    }}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {getSportIcon(sport.icon)}
                      {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{sport.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{sport.assessment_types.length} drills defined</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Assessment Drill Selection */}
          <div>
            <label className="text-xs font-mono uppercase text-slate-400 font-semibold mb-2.5 block">2. Standardized Drill Protocols ({currentSport.name})</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {currentSport.assessment_types.map(drill => {
                const isSelected = (selectedDrillId || currentSport.assessment_types[0]?.id) === drill.id;
                return (
                  <div
                    key={drill.id}
                    onClick={() => setSelectedDrillId(drill.id)}
                    className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold ${
                          drill.category === 'speed' ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/30' :
                          drill.category === 'power' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                          drill.category === 'agility' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                          'bg-indigo-950 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {drill.category}
                        </span>
                        <span className="flex items-center gap-1 text-slate-400 text-xs font-mono">
                          <Clock className="w-3 h-3" />
                          {drill.duration_sec}s
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base">{drill.name}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{drill.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-400">{drill.metrics.length} CV metrics</span>
                      <span className={isSelected ? 'text-cyan-400 font-semibold' : 'text-slate-500'}>
                        {isSelected ? 'Selected ✓' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Selected Drill Protocol Deep-Dive & Guidelines */}
          {currentDrill && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Protocol Verification & Computer Vision Calibration</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Instructions */}
                <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/60">
                  <h5 className="font-semibold text-slate-200">Execution Instructions</h5>
                  <ul className="space-y-1.5 text-slate-400">
                    {currentDrill.instructions.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-mono font-bold mt-0.5">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Camera Setup */}
                <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/60">
                  <h5 className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    Camera Setup Guidelines
                  </h5>
                  <ul className="space-y-1.5 text-slate-400">
                    {currentDrill.camera_setup_guidelines.map((guide, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{guide}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Target Metrics Preview */}
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/40">
                <span className="text-[11px] font-mono text-slate-400 block mb-2">Automated CV Metrics Tracked:</span>
                <div className="flex flex-wrap gap-2">
                  {currentDrill.metrics.map(m => (
                    <span key={m.key} className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                      <Gauge className="w-3 h-3 text-cyan-400" />
                      <strong>{m.name}</strong> ({m.unit})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (currentSport && currentDrill) {
                onSelectDrill(currentSport, currentDrill);
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            Proceed to Assessment Room
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
