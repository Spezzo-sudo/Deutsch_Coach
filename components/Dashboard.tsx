import React from 'react';
import { AppState, LanguageLevel } from '../types';
import { BookOpen, GraduationCap, Zap, TrendingUp, RefreshCw } from 'lucide-react';

interface Props {
  state: AppState;
  onStartSession: (type: 'daily' | 'exam' | 'topic', level: LanguageLevel) => void;
}

const Dashboard: React.FC<Props> = ({ state, onStartSession }) => {
  const { profile, courseProgress, examStats } = state;

  const getProgressWidth = (level: 'A1' | 'A2' | 'B1') => {
    const p = courseProgress[level];
    return Math.min(100, Math.round((p.lessonsDone / p.totalLessons) * 100));
  };

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-20">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <h1 className="text-xl font-bold">Namaste, {profile.name}!</h1>
        <p className="text-teal-100 text-sm mt-1">
          Current Level: <span className="font-semibold text-white">{profile.currentLevel}</span> • Target: {profile.targetLevel}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 p-2 rounded-lg w-fit">
          <TrendingUp size={14} />
          <span>Goal: {profile.dailyMinutes} min/day</span>
        </div>
      </div>

      {/* Main Action */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Zap className="text-orange-500" fill="currentColor" size={20} />
          Daily Training
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Your personalized mix: Vocab, Reading, Writing for {profile.currentLevel}.
        </p>
        <button 
          onClick={() => onStartSession('daily', profile.currentLevel)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow transition-transform active:scale-95"
        >
          Start Today's Session
        </button>
      </div>

      {/* Course Progress */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-800 ml-1">Your Journey to B1</h3>
        
        {(['A1', 'A2', 'B1'] as const).map((lvl) => {
           const percent = getProgressWidth(lvl);
           const isActive = profile.currentLevel === lvl;
           
           return (
            <div key={lvl} className={`bg-white p-4 rounded-xl border ${isActive ? 'border-teal-500 ring-1 ring-teal-100' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className={`font-bold ${isActive ? 'text-teal-700' : 'text-gray-500'}`}>Level {lvl}</span>
                <span className="text-xs text-gray-400">{courseProgress[lvl].lessonsDone}/{courseProgress[lvl].totalLessons} lessons</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
              </div>
              {isActive && (
                 <button 
                  onClick={() => onStartSession('topic', lvl as LanguageLevel)}
                  className="text-sm text-teal-600 font-medium flex items-center gap-1 hover:underline"
                 >
                   <BookOpen size={14} /> Continue Course
                 </button>
              )}
            </div>
           );
        })}
      </div>

      {/* Exam Mode */}
      <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                <GraduationCap size={20} />
                Exam Training B1
                </h2>
                <p className="text-xs text-indigo-700 mt-1">
                Last Score: <span className="font-semibold">{examStats.lastScore}</span>
                </p>
            </div>
            <button 
                onClick={() => onStartSession('exam', 'B1')}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
                Practice
            </button>
        </div>
        {examStats.weakPoints.length > 0 && (
            <div className="mt-3 text-xs text-indigo-600 bg-white/50 p-2 rounded">
                Focus on: {examStats.weakPoints.join(', ')}
            </div>
        )}
      </div>

      {/* Reset State (Debug) */}
      <div className="text-center pt-8">
        <button 
            onClick={() => {
                if(confirm("Reset all progress?")) {
                    localStorage.removeItem('deutsch_coach_state');
                    window.location.reload();
                }
            }}
            className="text-gray-400 text-xs flex items-center justify-center gap-1 mx-auto hover:text-red-500"
        >
            <RefreshCw size={10} /> Reset App Data
        </button>
      </div>

    </div>
  );
};

export default Dashboard;