import React from 'react';
import {
  AlertTriangle,
  X,
  UploadCloud,
  Camera,
  Film,
  Scissors,
  CheckCircle2,
  HardDrive,
  Sparkles
} from 'lucide-react';

export interface FileSizeAlertDetails {
  fileName: string;
  fileSizeMB: number;
  maxLimitMB: number;
  message?: string;
  onSelectAnotherFile?: () => void;
  onSwitchToCamera?: () => void;
}

interface FileSizeAlertModalProps {
  alert: FileSizeAlertDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FileSizeAlertModal: React.FC<FileSizeAlertModalProps> = ({
  alert,
  isOpen,
  onClose
}) => {
  if (!isOpen || !alert) return null;

  const percentage = Math.min(Math.round((alert.fileSizeMB / alert.maxLimitMB) * 100), 400);

  return (
    <div
      id="file-size-alert-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-size-alert-title"
    >
      <div
        id="file-size-alert-card"
        className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-red-400">
                Storage Limit Exceeded
              </span>
              <h3 id="file-size-alert-title" className="text-base sm:text-lg font-bold text-white font-display">
                File Exceeds Allowed Limit
              </h3>
            </div>
          </div>
          <button
            id="close-file-size-alert-btn"
            onClick={onClose}
            aria-label="Close alert"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* File Name & Overview */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <Film className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{alert.fileName}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Video file selection rejected</p>
            </div>
          </div>

          {/* Size Metrics Comparison Card */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-red-400 font-semibold">
                Your File Size
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-red-400 font-display">
                {alert.fileSizeMB} <span className="text-xs font-normal text-slate-400">MB</span>
              </div>
            </div>

            <div className="space-y-1 border-l border-slate-800 pl-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-semibold">
                Max Allowed Limit
              </span>
              <div className="text-xl sm:text-2xl font-extrabold text-cyan-400 font-display">
                {alert.maxLimitMB} <span className="text-xs font-normal text-slate-400">MB</span>
              </div>
            </div>

            {/* Over-capacity progress bar */}
            <div className="col-span-2 pt-2 border-t border-slate-800/60 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Capacity Ratio</span>
                <span className="text-red-400 font-bold">{percentage}% of maximum limit</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* User-friendly Advice / How to resolve */}
          <div className="space-y-2.5">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold block">
              Recommended Solutions:
            </span>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg">
                <Scissors className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Trim video to drill duration:</strong> Keep only the 10–15 seconds of active drill performance.
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg">
                <HardDrive className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Adjust resolution or bitrate:</strong> 1080p (Full HD) at standard 30fps is optimal for AI pose analysis. Avoid 4K recordings.
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-950/40 border border-slate-800/60 p-2.5 rounded-lg">
                <Camera className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Use Built-in Live Camera:</strong> Record directly inside the app to auto-constrain video size to standard bounds.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            id="dismiss-file-size-alert-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
          {alert.onSwitchToCamera && (
            <button
              id="switch-to-camera-alert-btn"
              onClick={() => {
                onClose();
                alert.onSwitchToCamera?.();
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              Use Live Camera
            </button>
          )}
          {alert.onSelectAnotherFile && (
            <button
              id="choose-another-file-alert-btn"
              onClick={() => {
                onClose();
                alert.onSelectAnotherFile?.();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Choose Another File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
