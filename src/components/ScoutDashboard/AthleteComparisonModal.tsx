import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Activity,
  Award,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { AthleteProfile } from '../../types';

interface AthleteComparisonModalProps {
  athleteIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const AthleteComparisonModal: React.FC<AthleteComparisonModalProps> = ({
  athleteIds,
  isOpen,
  onClose
}) => {
  const [comparisonList, setComparisonList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && athleteIds.length > 0) {
      fetchComparison();
    }
  }, [isOpen, athleteIds]);

  const fetchComparison = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/scout/compare?ids=${athleteIds.join(',')}`);
      const json = await res.json();
      if (json.success && json.data) {
        setComparisonList(json.data);
      }
    } catch (e) {
      console.error('Failed to load comparison', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || athleteIds.length === 0) return null;

  // Compile multi-athlete radar dataset
  const radarData = [
    {
      subject: 'Speed',
      ...comparisonList.reduce((acc, item, i) => {
        acc[`athlete_${i}`] = item.average_speed;
        return acc;
      }, {})
    },
    {
      subject: 'Agility',
      ...comparisonList.reduce((acc, item, i) => {
        acc[`athlete_${i}`] = item.average_agility;
        return acc;
      }, {})
    },
    {
      subject: 'Technique',
      ...comparisonList.reduce((acc, item, i) => {
        acc[`athlete_${i}`] = item.average_technique;
        return acc;
      }, {})
    },
    {
      subject: 'Consistency',
      ...comparisonList.reduce((acc, item, i) => {
        acc[`athlete_${i}`] = item.average_consistency;
        return acc;
      }, {})
    }
  ];

  const colors = ['#06b6d4', '#ec4899', '#8b5cf6'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white font-display">Talent Head-to-Head Comparison</h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              {comparisonList.length} Athletes Selected
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-sm font-mono">
              Running Multi-Athlete Comparative Matrix...
            </div>
          ) : (
            <>
              {/* Radar Comparison Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Comparative Athletic Capability Radar
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                      {comparisonList.map((item, i) => (
                        <Radar
                          key={item.athlete.id}
                          name={item.athlete.name}
                          dataKey={`athlete_${i}`}
                          stroke={colors[i % colors.length]}
                          fill={colors[i % colors.length]}
                          fillOpacity={0.3}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Side-by-Side Comparison Columns */}
              <div className={`grid grid-cols-1 md:grid-cols-${comparisonList.length} gap-4`}>
                {comparisonList.map((item, idx) => (
                  <div
                    key={item.athlete.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Athlete Identity */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                        <img
                          src={item.athlete.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={item.athlete.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.athlete.name}</h4>
                          <p className="text-xs text-slate-400 font-mono">{item.athlete.position}</p>
                        </div>
                      </div>

                      {/* Key Metric Numbers */}
                      <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                        <div className="bg-slate-900 p-2 rounded-lg text-center">
                          <span className="text-slate-500 text-[10px] block font-mono">Overall Rating</span>
                          <strong className="text-cyan-400 text-lg font-display">{item.athlete.overall_rating}</strong>
                        </div>
                        <div className="bg-slate-900 p-2 rounded-lg text-center">
                          <span className="text-slate-500 text-[10px] block font-mono">Assessments</span>
                          <strong className="text-white text-lg font-display">{item.assessment_count}</strong>
                        </div>
                      </div>

                      {/* Physical Specs */}
                      <div className="space-y-1.5 text-xs text-slate-400 py-2 border-y border-slate-800/80 font-mono">
                        <div className="flex justify-between"><span>Age:</span> <strong className="text-slate-200">{item.athlete.age} yrs</strong></div>
                        <div className="flex justify-between"><span>Height:</span> <strong className="text-slate-200">{item.athlete.height_cm} cm</strong></div>
                        <div className="flex justify-between"><span>Weight:</span> <strong className="text-slate-200">{item.athlete.weight_kg} kg</strong></div>
                        <div className="flex justify-between"><span>Location:</span> <strong className="text-slate-200">{item.athlete.location}</strong></div>
                      </div>

                      {/* Biomechanics Strengths */}
                      <div className="mt-3 space-y-2 text-xs">
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                        </span>
                        <ul className="space-y-1 text-slate-300 text-[11px]">
                          {item.top_strengths.slice(0, 2).map((s: string, i: number) => (
                            <li key={i} className="line-clamp-2">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                      <span className="text-amber-400 font-semibold block">Focus Area:</span>
                      <p className="line-clamp-2 text-slate-300 mt-0.5">{item.key_improvement}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
