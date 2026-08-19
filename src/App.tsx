import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AthleteDashboard } from './components/AthletePortal/AthleteDashboard';
import { DrillSelectionModal } from './components/AthletePortal/DrillSelectionModal';
import { AssessmentRoom } from './components/AthletePortal/AssessmentRoom';
import { AssessmentResultView } from './components/AthletePortal/AssessmentResultView';
import { LeaderboardView } from './components/AthletePortal/LeaderboardView';
import { CommunityHub } from './components/Community/CommunityHub';
import { SPORTS_DATA } from './data/mockDatabase';
import { Sport, AssessmentType, Assessment, GamificationEventResult } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<
    'athlete_dashboard' | 'assessment_room' | 'assessment_result' | 'leaderboard' | 'community'
  >('athlete_dashboard');

  const [sports, setSports] = useState<Sport[]>(SPORTS_DATA);
  const [activeSportId, setActiveSportId] = useState<string>('football');
  const [isDrillSelectorOpen, setIsDrillSelectorOpen] = useState(false);

  const [selectedSport, setSelectedSport] = useState<Sport | null>(SPORTS_DATA[0]);
  const [selectedDrill, setSelectedDrill] = useState<AssessmentType | null>(SPORTS_DATA[0]?.assessment_types?.[0] || null);
  const [activeAssessmentResult, setActiveAssessmentResult] = useState<Assessment | null>(null);
  const [activeGamificationResult, setActiveGamificationResult] = useState<GamificationEventResult | null>(null);

  useEffect(() => {
    fetchSportsCatalog();
  }, []);

  const fetchSportsCatalog = async () => {
    try {
      const res = await fetch('/api/v1/sports');
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setSports(json.data);
        if (!selectedSport) {
          setSelectedSport(json.data[0]);
        }
        if (!selectedDrill && json.data[0].assessment_types?.length > 0) {
          setSelectedDrill(json.data[0].assessment_types[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load sports catalog from REST API, using default catalog:', e);
    }
  };

  const handleStartDrill = (sport?: Sport, drill?: AssessmentType) => {
    const targetSport = sport || selectedSport || sports[0] || SPORTS_DATA[0];
    const targetDrill = drill || selectedDrill || targetSport?.assessment_types?.[0] || SPORTS_DATA[0].assessment_types[0];
    setSelectedSport(targetSport);
    setSelectedDrill(targetDrill);
    setIsDrillSelectorOpen(false);
    setCurrentView('assessment_room');
  };

  const handleAssessmentCompleted = (assessment: Assessment, gamification?: GamificationEventResult) => {
    setActiveAssessmentResult(assessment);
    setActiveGamificationResult(gamification || null);
    setCurrentView('assessment_result');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onStartNewAssessment={() => setIsDrillSelectorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'athlete_dashboard' && (
          <AthleteDashboard
            sports={sports}
            onStartAssessment={(s, d) => handleStartDrill(s, d)}
            onOpenDrillSelector={() => setIsDrillSelectorOpen(true)}
            onViewAssessmentResult={(asm) => {
              setActiveAssessmentResult(asm);
              setActiveGamificationResult(null);
              setCurrentView('assessment_result');
            }}
            onViewLeaderboard={() => setCurrentView('leaderboard')}
          />
        )}

        {currentView === 'assessment_room' && (selectedSport || sports[0]) && (selectedDrill || sports[0]?.assessment_types?.[0]) && (
          <AssessmentRoom
            sport={selectedSport || sports[0]}
            drill={selectedDrill || sports[0].assessment_types[0]}
            onBack={() => setCurrentView('athlete_dashboard')}
            onAssessmentCompleted={handleAssessmentCompleted}
          />
        )}

        {currentView === 'assessment_result' && activeAssessmentResult && (
          <AssessmentResultView
            assessment={activeAssessmentResult}
            gamification={activeGamificationResult}
            onRetake={() => handleStartDrill(selectedSport || undefined, selectedDrill || undefined)}
            onViewLeaderboard={() => setCurrentView('leaderboard')}
            onBackToDashboard={() => setCurrentView('athlete_dashboard')}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            sports={sports}
          />
        )}

        {currentView === 'community' && (
          <CommunityHub
            sports={sports}
          />
        )}
      </main>

      {/* Drill Selection Modal */}
      <DrillSelectionModal
        sports={sports}
        isOpen={isDrillSelectorOpen}
        onClose={() => setIsDrillSelectorOpen(false)}
        onSelectDrill={(sport, drill) => handleStartDrill(sport, drill)}
        initialSportId={activeSportId}
      />
    </div>
  );
}
