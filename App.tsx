import React, { useState, useEffect } from 'react';
import { AppState, INITIAL_STATE, UserProfile, LanguageLevel } from './types';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import LessonSession from './components/LessonSession';

const STORAGE_KEY = 'deutsch_coach_state';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'lesson'>('loading');
  const [activeLessonType, setActiveLessonType] = useState<{type: 'daily' | 'exam' | 'topic', level: LanguageLevel} | null>(null);

  // Load state from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
        if (parsed.profile.onboardingComplete) {
          setView('dashboard');
        } else {
          setView('onboarding');
        }
      } catch (e) {
        console.error("Failed to parse saved state", e);
        setView('onboarding');
      }
    } else {
      setView('onboarding');
    }
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (state.profile.onboardingComplete) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setState(prev => ({ ...prev, profile: { ...profile, onboardingComplete: true } }));
    setView('dashboard');
  };

  const handleStartSession = (type: 'daily' | 'exam' | 'topic', level: LanguageLevel) => {
    setActiveLessonType({ type, level });
    setView('lesson');
  };

  const handleLessonComplete = (score: number) => {
    // Update progress logic
    setState(prev => {
        const newState = { ...prev };
        const level = activeLessonType?.level || 'A1';
        
        // Simple progress increment
        if (newState.courseProgress[level].lessonsDone < newState.courseProgress[level].totalLessons) {
            newState.courseProgress[level].lessonsDone += 1;
        }

        // If it was exam training, update stats
        if (activeLessonType?.type === 'exam') {
            newState.examStats.lastSessionDate = new Date().toISOString();
            newState.examStats.lastScore = `Score: ${score}`; // Simplified
        }

        return newState;
    });
    setView('dashboard');
    setActiveLessonType(null);
  };

  if (view === 'loading') return null;

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {view === 'onboarding' && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {view === 'dashboard' && (
        <Dashboard 
          state={state} 
          onStartSession={handleStartSession} 
        />
      )}

      {view === 'lesson' && activeLessonType && (
        <LessonSession 
          level={activeLessonType.level} 
          type={activeLessonType.type} 
          onComplete={handleLessonComplete}
          onBack={() => setView('dashboard')}
        />
      )}
    </div>
  );
};

export default App;