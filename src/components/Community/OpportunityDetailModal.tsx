import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Building,
  CheckCircle,
  Clock,
  Bookmark,
  ExternalLink,
  Mail,
  Phone,
  ShieldCheck,
  Flag,
  Share2,
  Award,
  AlertCircle
} from 'lucide-react';
import { Opportunity } from '../../types';

interface OpportunityDetailModalProps {
  isOpen: boolean;
  opportunity: Opportunity | null;
  onClose: () => void;
  onToggleSave: (oppId: string) => Promise<void>;
  onReport: (opp: Opportunity) => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  isOpen,
  opportunity,
  onClose,
  onToggleSave,
  onReport
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !opportunity) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onToggleSave(opportunity.id);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const deadlineDate = new Date(opportunity.application_deadline);
  const now = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = diffDays <= 7 && diffDays >= 0;
  const isExpired = diffDays < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 my-8">
        {/* Modal Header */}
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 p-2 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                {opportunity.organization_logo ? (
                  <img
                    src={opportunity.organization_logo}
                    alt={opportunity.organization_name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building className="w-6 h-6 text-cyan-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-500/30">
                    {opportunity.opportunity_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md capitalize">
                    {opportunity.sport}
                  </span>
                  {opportunity.is_verified && (
                    <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified Official
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">{opportunity.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{opportunity.organization_name}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Key Quick Facts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Location
              </div>
              <div className="text-xs font-semibold text-white">
                {opportunity.location}
                {opportunity.is_remote && (
                  <span className="text-[10px] text-cyan-400 block font-normal">(Virtual Submissions Allowed)</span>
                )}
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${
              isExpired
                ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                : isUrgent
                ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
            }`}>
              <div className="text-[11px] flex items-center gap-1.5 mb-1 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Deadline
              </div>
              <div className="text-xs font-semibold text-white">
                {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className={`text-[10px] font-medium mt-0.5 ${
                isExpired ? 'text-rose-400' : isUrgent ? 'text-amber-400' : 'text-slate-400'
              }`}>
                {isExpired ? 'Application Closed' : `${diffDays} days remaining`}
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                Event Dates
              </div>
              <div className="text-xs font-semibold text-white">
                {opportunity.start_date
                  ? new Date(opportunity.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : 'Dates TBD'}
                {opportunity.end_date && ` - ${new Date(opportunity.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">About the Opportunity</h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {opportunity.description}
            </p>
          </div>

          {/* Eligibility */}
          {opportunity.eligibility && (
            <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-1">
              <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
                Eligibility Criteria
              </div>
              <p className="text-xs text-slate-300">{opportunity.eligibility}</p>
            </div>
          )}

          {/* Requirements & Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Requirements */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Application Requirements
              </h3>
              <ul className="space-y-2">
                {opportunity.requirements?.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Selected Athlete Benefits
              </h3>
              <ul className="space-y-2">
                {opportunity.benefits?.map((ben, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <Award className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{ben}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Details */}
          {(opportunity.contact_email || opportunity.contact_phone) && (
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Organizer Inquiries</div>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                {opportunity.contact_email && (
                  <a
                    href={`mailto:${opportunity.contact_email}`}
                    className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {opportunity.contact_email}
                  </a>
                )}
                {opportunity.contact_phone && (
                  <a
                    href={`tel:${opportunity.contact_phone}`}
                    className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {opportunity.contact_phone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                opportunity.is_saved
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={opportunity.is_saved ? 'Saved in your shortlist' : 'Save opportunity'}
            >
              <Bookmark className={`w-4 h-4 ${opportunity.is_saved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{opportunity.is_saved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs transition-colors"
              title="Share link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onReport(opportunity)}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 text-xs transition-colors"
              title="Report opportunity"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {opportunity.registration_url && (
              <a
                href={opportunity.registration_url}
                target="_blank"
                rel="noreferrer noopener"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-98"
              >
                <span>Apply / Register Now</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
