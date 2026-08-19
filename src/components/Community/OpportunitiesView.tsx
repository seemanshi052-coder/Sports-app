import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  Building,
  Sparkles,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Loader2,
  X,
  Compass
} from 'lucide-react';
import { Opportunity, Sport } from '../../types';
import { OpportunityCard } from './OpportunityCard';
import { OpportunityDetailModal } from './OpportunityDetailModal';

interface OpportunitiesViewProps {
  sports: Sport[];
  initialSavedOnly?: boolean;
  onReportOpportunity: (opp: Opportunity) => void;
}

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Types' },
  { value: 'TRIALS', label: 'Trials & Combines' },
  { value: 'COMPETITION', label: 'Competitions & Cups' },
  { value: 'CAMP', label: 'Development Camps' },
  { value: 'SCHOLARSHIP', label: 'Scholarships' },
  { value: 'ACADEMY_TRYOUT', label: 'Academy Tryouts' },
  { value: 'SHOWCASE', label: 'Scout Showcases' }
];

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  sports,
  initialSavedOnly = false,
  onReportOpportunity
}) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedType, setSelectedType] = useState('ALL');
  const [showSavedOnly, setShowSavedOnly] = useState(initialSavedOnly);
  const [includeExpired, setIncludeExpired] = useState(false);

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchOpportunities();
  }, [selectedSport, selectedType, searchQuery, showSavedOnly, includeExpired]);

  const fetchOpportunities = async () => {
    setIsLoading(true);
    try {
      if (showSavedOnly) {
        const res = await fetch('/api/v1/opportunities/saved/mine');
        const json = await res.json();
        if (json.success && json.data) {
          let list: Opportunity[] = json.data.items || [];
          if (selectedSport !== 'all') {
            list = list.filter((o) => o.sport.toLowerCase() === selectedSport.toLowerCase());
          }
          if (selectedType !== 'ALL') {
            list = list.filter((o) => o.opportunity_type === selectedType);
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
              (o) =>
                o.title.toLowerCase().includes(q) ||
                o.organization_name.toLowerCase().includes(q) ||
                o.location.toLowerCase().includes(q)
            );
          }
          setOpportunities(list);
        }
      } else {
        const params = new URLSearchParams();
        if (selectedSport !== 'all') params.append('sport', selectedSport);
        if (selectedType !== 'ALL') params.append('opportunity_type', selectedType);
        if (searchQuery.trim()) params.append('search', searchQuery.trim());
        if (includeExpired) params.append('include_expired', 'true');

        const res = await fetch(`/api/v1/opportunities?${params.toString()}`);
        const json = await res.json();
        if (json.success && json.data) {
          setOpportunities(json.data.items || []);
        }
      }
    } catch (err) {
      console.warn('Error querying opportunities:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleSave = async (oppId: string) => {
    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === oppId ? { ...o, is_saved: !o.is_saved } : o))
    );

    if (selectedOpportunity && selectedOpportunity.id === oppId) {
      setSelectedOpportunity((prev) => (prev ? { ...prev, is_saved: !prev.is_saved } : null));
    }

    try {
      await fetch(`/api/v1/opportunities/${oppId}/save`, { method: 'POST' });
    } catch (err) {
      console.warn('Failed to toggle save opportunity:', err);
    }
  };

  const handleOpenDetail = (opp: Opportunity) => {
    setSelectedOpportunity(opp);
    setIsDetailOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport('all');
    setSelectedType('ALL');
    setShowSavedOnly(false);
    setIncludeExpired(false);
  };

  const hasActiveFilters = searchQuery || selectedSport !== 'all' || selectedType !== 'ALL' || showSavedOnly || includeExpired;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Sports Pathways & Scouting Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Opportunities & Official Trials
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Discover verified academy tryouts, national showcases, training camps, and college athletic scholarships. Submit your standardized video assessments directly to scouts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 shadow-sm ${
                showSavedOnly
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/20'
                  : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${showSavedOnly ? 'fill-slate-950' : ''}`} />
              <span>Saved Shortlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, club/academy, or location..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sport Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 capitalize"
            >
              <option value="all">All Sports</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh & Reset */}
          <div className="md:col-span-1 flex items-center justify-end gap-1.5">
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchOpportunities();
              }}
              disabled={isRefreshing}
              className="p-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Refresh opportunities"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Secondary Filter Chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={(e) => setIncludeExpired(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
              />
              <span>Include past / expired deadlines</span>
            </label>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <span>Reset all filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Opportunities */}
      {isLoading ? (
        <div className="space-y-4 py-12 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-cyan-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading verified scouting opportunities...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Opportunities Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {showSavedOnly
                ? "You haven't saved any opportunities yet. Browse the catalog and bookmark trials or camps to track them here."
                : 'No active trials or scholarships match your selected filter criteria. Try adjusting your search or sport filter.'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onSelect={handleOpenDetail}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}

      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal
        isOpen={isDetailOpen}
        opportunity={selectedOpportunity}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedOpportunity(null);
        }}
        onToggleSave={handleToggleSave}
        onReport={(opp) => onReportOpportunity(opp)}
      />
    </div>
  );
};
