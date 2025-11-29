import React, { useState } from 'react';
import { UserProfile, LanguageLevel } from '../types';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<UserProfile>>({
    name: '',
    targetLevel: 'B1',
    currentLevel: 'A0',
    dailyMinutes: 20,
    nativeLanguage: 'Hindi',
    readDevanagari: false,
    onboardingComplete: false
  });

  const handleNext = () => setStep(s => s + 1);

  const finish = () => {
    // Basic auto-estimation based on self-report
    onComplete(data as UserProfile);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-sm mt-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-teal-800">Willkommen!</h1>
        <p className="text-gray-600">Let's set up your personal German plan.</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700">What is your name?</span>
            <input 
              type="text" 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 p-2 border text-gray-900"
              value={data.name}
              onChange={(e) => setData({...data, name: e.target.value})}
            />
          </label>
          <button 
            disabled={!data.name}
            onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
          >
            Next <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="font-medium text-gray-700">What is your current German level?</p>
          <div className="space-y-2">
            {(['A0', 'A1', 'A2', 'B1'] as LanguageLevel[]).map(level => (
              <button
                key={level}
                onClick={() => setData({...data, currentLevel: level})}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${data.currentLevel === level ? 'border-teal-500 bg-teal-50 text-teal-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
              >
                <div className="font-bold">{level}</div>
                <div className="text-xs text-gray-500">
                  {level === 'A0' ? 'Absolute Beginner' : 
                   level === 'A1' ? 'I know some basics' :
                   level === 'A2' ? 'I can have short conversations' : 'I am advanced'}
                </div>
              </button>
            ))}
          </div>
          <button onClick={handleNext} className="w-full bg-teal-600 text-white py-2 rounded-lg mt-4 font-medium">Next</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="font-medium text-gray-700">Can you read Devanagari script (हिंदी)?</p>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setData({...data, readDevanagari: true})}
              className={`flex-1 p-3 border rounded-lg font-bold transition-all ${
                data.readDevanagari 
                  ? 'border-teal-600 bg-teal-100 text-teal-900 ring-2 ring-teal-200' 
                  : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
              }`}
            >
              Yes
            </button>
            <button 
              type="button"
              onClick={() => setData({...data, readDevanagari: false})}
              className={`flex-1 p-3 border rounded-lg font-bold transition-all ${
                data.readDevanagari === false 
                  ? 'border-teal-600 bg-teal-100 text-teal-900 ring-2 ring-teal-200' 
                  : 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
              }`}
            >
              No
            </button>
          </div>

          <div className="pt-4">
            <p className="font-medium text-gray-700">Minutes per day?</p>
             <div className="mt-2">
                <input 
                    type="range" min="10" max="60" step="5"
                    value={data.dailyMinutes}
                    onChange={(e) => setData({...data, dailyMinutes: parseInt(e.target.value)})}
                    className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                    <span>10m</span>
                    <span>30m</span>
                    <span>60m</span>
                </div>
                <div className="text-center font-bold text-teal-800 mt-1">{data.dailyMinutes} min</div>
             </div>
          </div>

          <button onClick={finish} className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg mt-6 font-medium shadow-md hover:bg-teal-700 transition-transform active:scale-95">
            <CheckCircle2 size={18} /> Start Learning
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;