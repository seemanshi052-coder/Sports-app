import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AthleteDashboard } from './components/AthletePortal/AthleteDashboard';
import { DrillSelectionModal } from './components/AthletePortal/DrillSelectionModal';
import { AssessmentRoom } from './components/AthletePortal/AssessmentRoom';
import { AssessmentResultView } from './components/AthletePortal/AssessmentResultView';
import { LeaderboardView } from './components/AthletePortal/LeaderboardView';
import { ScoutOverview } from './components/ScoutDashboard/ScoutOverview';
import { Sport, AssessmentType, Assessment, UserRole } from './types';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('athlete');
  const [currentView, setCurrentView] = useState<
    'athlete_dashboard' | 'assessment_room' | 'assessment_result' | 'leaderboard' | 'scout_dashboard'
  >('athlete_dashboard');

  const [sports, setSports] = useState<Sport[]>([]);
  const [activeSportId, setActiveSportId] = useState<string>('football');
  const [isDrillSelectorOpen, setIsDrillSelectorOpen] = useState(false);

  const [selectedSport, setSelectedSport] = useState<Sport | null>(null);
  const [selectedDrill, setSelectedDrill] = useState<AssessmentType | null>(null);
  const [activeAssessmentResult, setActiveAssessmentResult] = useState<Assessment | null>(null);

  useEffect(() => {
    fetchSportsCatalog();
  }, []);

  const fetchSportsCatalog = async () => {
    try {
      const res = await fetch('/api/v1/sports');
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setSports(json.data);
        setSelectedSport(json.data[0]);
        if (json.data[0].assessment_types?.length > 0) {
          setSelectedDrill(json.data[0].assessment_types[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load sports catalog from REST API:', e);
    }
  };

  const handleStartDrill = (sport?: Sport, drill?: AssessmentType) => {
    if (sport && drill) {
      setSelectedSport(sport);
      setSelectedDrill(drill);
    } else if (sports.length > 0) {
      setSelectedSport(sports[0]);
      setSelectedDrill(sports[0].assessment_types?.[0] || null);
    }
    setIsDrillSelectorOpen(false);
    setCurrentView('assessment_room');
  };

  const handleAssessmentCompleted = (assessment: Assessment) => {
    setActiveAssessmentResult(assessment);
    setCurrentView('assessment_result');
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === 'scout') {
      setCurrentView('scout_dashboard');
    } else {
      setCurrentView('athlete_dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        userRole={userRole}
        onSwitchRole={handleSwitchRole}
        activeSport={activeSportId}
        onSelectSport={setActiveSportId}
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
            onRetake={() => handleStartDrill(selectedSport || undefined, selectedDrill || undefined)}
            onViewLeaderboard={() => setCurrentView('leaderboard')}
            onBackToDashboard={() => setCurrentView('athlete_dashboard')}
          />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardView
            sports={sports}
            onSelectAthleteForScout={(athId) => {
              setUserRole('scout');
              setCurrentView('scout_dashboard');
            }}
          />
        )}

        {currentView === 'scout_dashboard' && (
          <ScoutOverview sports={sports} />
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
