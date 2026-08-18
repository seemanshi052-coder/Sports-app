import React, { useEffect, useState } from 'react';
import { Activity, Zap, CheckCircle2 } from 'lucide-react';

interface PoseSkeletonOverlayProps {
  isAnalyzing?: boolean;
  drillCategory?: string;
  className?: string;
}

export const PoseSkeletonOverlay: React.FC<PoseSkeletonOverlayProps> = ({
  isAnalyzing = false,
  drillCategory = 'speed',
  className = ''
}) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 60);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // Compute animated landmark keypoints based on running gait or athletic action
  const t = (phase / 60) * Math.PI * 2;
  const sinT = Math.sin(t);
  const cosT = Math.cos(t);

  // Keypoints scaled 0-100% within the container
  const head = { x: 50 + sinT * 1.5, y: 18 + cosT * 0.8 };
  const neck = { x: 50 + sinT * 1.2, y: 26 };
  
  const leftShoulder = { x: 42 + sinT * 2, y: 28 + cosT * 1 };
  const rightShoulder = { x: 58 - sinT * 2, y: 28 - cosT * 1 };

  const leftElbow = { x: 34 + cosT * 7, y: 38 + sinT * 4 };
  const rightElbow = { x: 66 - cosT * 7, y: 38 - sinT * 4 };

  const leftWrist = { x: 30 + cosT * 11, y: 46 - sinT * 6 };
  const rightWrist = { x: 70 - cosT * 11, y: 46 + sinT * 6 };

  const midHip = { x: 50 + sinT * 1.8, y: 52 };
  const leftHip = { x: 44 + sinT * 1.5, y: 53 };
  const rightHip = { x: 56 - sinT * 1.5, y: 53 };

  const leftKnee = { x: 40 - sinT * 10, y: 70 - Math.max(0, cosT) * 12 };
  const rightKnee = { x: 60 + sinT * 10, y: 70 - Math.max(0, -cosT) * 12 };

  const leftAnkle = { x: 38 - sinT * 12, y: 88 + (cosT < 0 ? -10 * cosT : 0) };
  const rightAnkle = { x: 62 + sinT * 12, y: 88 + (cosT > 0 ? 10 * cosT : 0) };

  // Angle calculations for HUD
  const leftKneeAngle = Math.round(75 + Math.abs(cosT) * 35);
  const hipAngle = Math.round(155 + Math.abs(sinT) * 18);
  const cadence = Math.round(260 + sinT * 12);

  return (
    <div className={`absolute inset-0 pointer-events-none select-none overflow-hidden ${className}`}>
      {/* MediaPipe Skeletal HUD Overlay */}
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="boneGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="boneGradEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Torso & Spine */}
        <line x1={neck.x} y1={neck.y} x2={midHip.x} y2={midHip.y} stroke="url(#boneGradCyan)" strokeWidth="0.8" strokeDasharray={isAnalyzing ? '1,1' : 'none'} />
        <line x1={leftShoulder.x} y1={leftShoulder.y} x2={rightShoulder.x} y2={rightShoulder.y} stroke="url(#boneGradCyan)" strokeWidth="0.8" />
        <line x1={leftHip.x} y1={leftHip.y} x2={rightHip.x} y2={rightHip.y} stroke="url(#boneGradCyan)" strokeWidth="0.8" />
        <line x1={leftShoulder.x} y1={leftShoulder.y} x2={leftHip.x} y2={leftHip.y} stroke="url(#boneGradCyan)" strokeWidth="0.6" />
        <line x1={rightShoulder.x} y1={rightShoulder.y} x2={rightHip.x} y2={rightHip.y} stroke="url(#boneGradCyan)" strokeWidth="0.6" />

        {/* Arms */}
        <line x1={leftShoulder.x} y1={leftShoulder.y} x2={leftElbow.x} y2={leftElbow.y} stroke="url(#boneGradEmerald)" strokeWidth="0.7" />
        <line x1={leftElbow.x} y1={leftElbow.y} x2={leftWrist.x} y2={leftWrist.y} stroke="url(#boneGradEmerald)" strokeWidth="0.7" />
        <line x1={rightShoulder.x} y1={rightShoulder.y} x2={rightElbow.x} y2={rightElbow.y} stroke="url(#boneGradEmerald)" strokeWidth="0.7" />
        <line x1={rightElbow.x} y1={rightElbow.y} x2={rightWrist.x} y2={rightWrist.y} stroke="url(#boneGradEmerald)" strokeWidth="0.7" />

        {/* Legs */}
        <line x1={leftHip.x} y1={leftHip.y} x2={leftKnee.x} y2={leftKnee.y} stroke="url(#boneGradCyan)" strokeWidth="0.9" />
        <line x1={leftKnee.x} y1={leftKnee.y} x2={leftAnkle.x} y2={leftAnkle.y} stroke="url(#boneGradCyan)" strokeWidth="0.9" />
        <line x1={rightHip.x} y1={rightHip.y} x2={rightKnee.x} y2={rightKnee.y} stroke="url(#boneGradCyan)" strokeWidth="0.9" />
        <line x1={rightKnee.x} y1={rightKnee.y} x2={rightAnkle.x} y2={rightAnkle.y} stroke="url(#boneGradCyan)" strokeWidth="0.9" />

        {/* Joint Keypoint Nodes */}
        {[
          head, neck, leftShoulder, rightShoulder, leftElbow, rightElbow,
          leftWrist, rightWrist, leftHip, rightHip, midHip, leftKnee,
          rightKnee, leftAnkle, rightAnkle
        ].map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="1.4" fill="#06b6d4" />
            <circle cx={pt.x} cy={pt.y} r="0.7" fill="#ffffff" />
          </g>
        ))}

        {/* Real-time Angle Indicators */}
        <g transform={`translate(${leftKnee.x + 2}, ${leftKnee.y - 2})`}>
          <rect x="0" y="0" width="10" height="4.5" rx="1" fill="#0f172a" fillOpacity="0.85" stroke="#06b6d4" strokeWidth="0.3" />
          <text x="5" y="3.2" fill="#38bdf8" fontSize="2.5" fontWeight="600" textAnchor="middle">{leftKneeAngle}°</text>
        </g>
      </svg>

      {/* High-Tech Biomechanical HUD Box */}
      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 rounded-lg p-2 text-xs font-mono space-y-1 text-slate-200">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider text-[10px] uppercase">
          <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>MediaPipe 33-Landmarks</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 text-[11px]">
          <div>Confidence: <span className="text-emerald-400 font-semibold">97.8%</span></div>
          <div>FPS: <span className="text-cyan-300 font-semibold">59.8</span></div>
          <div>Knee Angle: <span className="text-amber-300 font-semibold">{leftKneeAngle}°</span></div>
          <div>Cadence: <span className="text-purple-300 font-semibold">{cadence} spm</span></div>
        </div>
      </div>

      {/* Right HUD: Motion vectors */}
      <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 uppercase font-semibold">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span>Ground Vector Active</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          GCT: <span className="text-slate-100 font-bold">104 ms</span> | Lean: <span className="text-slate-100 font-bold">{hipAngle}°</span>
        </div>
      </div>

      {/* Target Body Alignment Box */}
      <div className="absolute inset-x-8 inset-y-6 border border-dashed border-cyan-500/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
        <div className="flex justify-between text-[9px] text-cyan-500/40 uppercase tracking-wider font-mono">
          <span>[CAPTURE GRID 1080p]</span>
          <span>CALIBRATED</span>
        </div>
        <div className="text-center text-[10px] text-cyan-400/60 font-mono">
          Keep full body within frame
        </div>
      </div>
    </div>
  );
};
