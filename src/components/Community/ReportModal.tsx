import React, { useState } from 'react';
import { Flag, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { ReportReason } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'POST' | 'COMMENT' | 'OPPORTUNITY';
  targetId: string;
  targetTitle?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'INAPPROPRIATE_CONTENT',
    label: 'Inappropriate Content',
    description: 'Offensive language, nudity, or graphic material'
  },
  {
    value: 'HARASSMENT',
    label: 'Harassment or Bullying',
    description: 'Targeted hostility, intimidation, or derogatory remarks'
  },
  {
    value: 'SPAM',
    label: 'Spam or Commercial Promotion',
    description: 'Irrelevant advertisements, bot activity, or unsolicited links'
  },
  {
    value: 'FAKE_OPPORTUNITY',
    label: 'Fake or Fraudulent Opportunity',
    description: 'Unverified trials, scam fees, or impersonation of official clubs'
  },
  {
    value: 'MISLEADING_INFORMATION',
    label: 'Misleading Performance Data',
    description: 'Falsified assessment metrics or fabricated certifications'
  },
  {
    value: 'OTHER',
    label: 'Other Issue',
    description: 'Any other safety or integrity concern'
  }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('INAPPROPRIATE_CONTENT');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/community/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason: selectedReason,
          details: details.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 1800);
      } else {
        setErrorMessage(data.error || 'Failed to submit report. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Flag className="w-5 h-5" />
            <h3 className="text-base font-semibold text-white">
              Report {targetType.toLowerCase()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-white">Report Submitted</h4>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Thank you for keeping our athletic community safe. Our moderation team will review this {targetType.toLowerCase()} promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {targetTitle && (
              <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="font-semibold text-slate-300">Target:</span> {targetTitle}
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Reason for report
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedReason === r.value
                        ? 'bg-amber-950/30 border-amber-500/50 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r.value}
                      checked={selectedReason === r.value}
                      onChange={() => setSelectedReason(r.value)}
                      className="mt-0.5 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                    />
                    <div>
                      <div className="text-xs font-medium text-slate-200">{r.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{r.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide any specific context that will help our safety team investigate..."
                rows={3}
                maxLength={500}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
