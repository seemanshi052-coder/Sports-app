import React, { useState } from 'react';
import {
  Building,
  MapPin,
  Calendar,
  Clock,
  Bookmark,
  ShieldCheck,
  ChevronRight,
  Award,
  CheckCircle
} from 'lucide-react';
import { Opportunity } from '../../types';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSelect: (opportunity: Opportunity) => void;
  onToggleSave: (oppId: string) => Promise<void>;
}

const TYPE_COLORS: Record<string, string> = {
  TRIALS: 'text-amber-400 bg-amber-950/70 border-amber-500/30',
  COMPETITION: 'text-purple-400 bg-purple-950/70 border-purple-500/30',
  CAMP: 'text-blue-400 bg-blue-950/70 border-blue-500/30',
  SCHOLARSHIP: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/30',
  ACADEMY_TRYOUT: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/30',
  SHOWCASE: 'text-rose-400 bg-rose-950/70 border-rose-500/30'
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onSelect,
  onToggleSave
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onToggleSave(opportunity.id);
    } finally {
      setIsSaving(false);
    }
  };

  const deadlineDate = new Date(opportunity.application_deadline);
  const now = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = diffDays <= 7 && diffDays >= 0;
  const isExpired = diffDays < 0;

  const typeClass = TYPE_COLORS[opportunity.opportunity_type] || 'text-slate-300 bg-slate-800 border-slate-700';

  return (
    <div
      onClick={() => onSelect(opportunity)}
      className="group bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-5 shadow-lg hover:shadow-cyan-500/5 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Header with Organization & Save Bookmark */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 p-1.5 flex items-center justify-center overflow-hidden flex-shrink-0">
              {opportunity.organization_logo ? (
                <img
                  src={opportunity.organization_logo}
                  alt={opportunity.organization_name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-300">{opportunity.organization_name}</span>
                {opportunity.is_verified && (
                  <span title="Verified Organization">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 capitalize">{opportunity.sport}</span>
            </div>
          </div>

          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`p-2 rounded-xl border transition-all ${
              opportunity.is_saved
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
            title={opportunity.is_saved ? 'Remove from saved' : 'Save opportunity'}
          >
            <Bookmark className={`w-4 h-4 ${opportunity.is_saved ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${typeClass}`}>
            {opportunity.opportunity_type.replace('_', ' ')}
          </span>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[150px]">{opportunity.location}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors line-clamp-1">
          {opportunity.title}
        </h3>

        {/* Description Snippet */}
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {opportunity.description}
        </p>

        {/* Highlights Tags */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {opportunity.requirements?.slice(0, 2).map((req, idx) => (
            <span
              key={idx}
              className="text-[10px] text-slate-300 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1"
            >
              <CheckCircle className="w-2.5 h-2.5 text-cyan-400" />
              <span className="truncate max-w-[140px]">{req}</span>
            </span>
          ))}
          {opportunity.benefits?.slice(0, 1).map((ben, idx) => (
            <span
              key={idx}
              className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1"
            >
              <Award className="w-2.5 h-2.5 text-amber-400" />
              <span className="truncate max-w-[140px]">{ben}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Footer Details & Deadline */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className={`text-[11px] font-medium ${
            isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-300 font-semibold' : 'text-slate-400'
          }`}>
            {isExpired ? 'Expired' : `${diffDays} days left to apply`}
          </span>
        </div>

        <span className="text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
