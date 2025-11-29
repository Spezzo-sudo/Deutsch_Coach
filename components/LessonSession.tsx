import React, { useState, useEffect } from 'react';
import { LessonContent, LanguageLevel, VocabularyCard, QuizQuestion } from '../types';
import { generateLesson, evaluateWriting } from '../services/geminiService';
import { ArrowLeft, ArrowRight, Volume2, Check, X, Loader2, Languages } from 'lucide-react';

interface Props {
  level: LanguageLevel;
  type: 'daily' | 'exam' | 'topic';
  onComplete: (score: number) => void;
  onBack: () => void;
}

type Stage = 'loading' | 'vocab' | 'reading' | 'writing' | 'feedback' | 'finished';

const LessonSession: React.FC<Props> = ({ level, type, onComplete, onBack }) => {
  const [content, setContent] = useState<LessonContent | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>({});
  const [showTranslation, setShowTranslation] = useState(false);
  const [writingText, setWritingText] = useState('');
  const [writingFeedback, setWritingFeedback] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadContent = async () => {
      const data = await generateLesson(level, type);
      if (isMounted && data) {
        setContent(data);
        // If it's an exam or daily, the first stage might differ, but let's standardize order
        if (data.vocabulary && data.vocabulary.length > 0) {
            setStage('vocab');
        } else if (data.readingText) {
            setStage('reading');
        } else if (data.writingPrompt) {
            setStage('writing');
        } else {
            // Fallback
            setStage('finished');
        }
      }
    };
    loadContent();
    return () => { isMounted = false; };
  }, [level, type]);

  const handleNext = () => {
    if (!content) return;

    if (stage === 'vocab') {
      if (currentCardIndex < content.vocabulary.length - 1) {
        setCurrentCardIndex(i => i + 1);
      } else {
        if (content.readingText) {
            setStage('reading');
            setShowTranslation(false); // Reset translation for new section
        }
        else if (content.writingPrompt) setStage('writing');
        else setStage('finished');
      }
    } else if (stage === 'reading') {
        if (content.writingPrompt) setStage('writing');
        else setStage('finished');
    }
  };

  const submitWriting = async () => {
    if (!content?.writingPrompt) return;
    setIsEvaluating(true);
    const feedback = await evaluateWriting(content.writingPrompt, writingText, level);
    setWritingFeedback(feedback);
    setIsEvaluating(false);
    setStage('feedback');
    setScore(s => s + 10); // Reward for writing
  };

  const finishLesson = () => {
      onComplete(score);
  };

  // --- RENDERING ---

  if (stage === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-teal-50">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-teal-800 font-medium">Preparing your customized lesson...</p>
        <p className="text-teal-600 text-sm mt-2">Generating content with AI</p>
      </div>
    );
  }

  if (!content) return <div className="p-8 text-center text-red-500">Error loading lesson. <button onClick={onBack} className="underline">Go Back</button></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800"><ArrowLeft /></button>
        <span className="font-bold text-gray-800">{type === 'daily' ? 'Daily Training' : content.topic || 'Lesson'}</span>
        <div className="w-6" /> {/* Spacer */}
      </div>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        
        {/* VOCAB STAGE */}
        {stage === 'vocab' && (
          <div className="h-full flex flex-col justify-center">
             <h2 className="text-xl font-bold text-center mb-6 text-teal-800">New Words ({currentCardIndex + 1}/{content.vocabulary.length})</h2>
             <div className="bg-white rounded-2xl shadow-lg p-8 text-center min-h-[300px] flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-teal-500"></div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{content.vocabulary[currentCardIndex].german}</h3>
                
                <div className="my-6 space-y-2">
                    <p className="text-gray-600 text-lg italic">"{content.vocabulary[currentCardIndex].exampleSentence}"</p>
                </div>
                
                <div className="border-t border-gray-100 pt-6 mt-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Meaning</p>
                    <p className="text-gray-800 mb-2">{content.vocabulary[currentCardIndex].englishExplanation}</p>
                    <p className="text-teal-700 font-medium font-serif bg-teal-50 inline-block px-3 py-1 rounded-full">
                        {content.vocabulary[currentCardIndex].hindiTranslation}
                    </p>
                </div>
             </div>
             <button 
                onClick={handleNext}
                className="mt-8 bg-teal-600 text-white w-full py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-colors"
             >
                Next Word
             </button>
          </div>
        )}

        {/* READING STAGE */}
        {stage === 'reading' && content.readingText && (
            <div className="space-y-8 pb-24">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                            <BookOpenIcon /> Lesen (Reading)
                        </h3>
                        {/* Translation Toggle for A0 or if available */}
                        {(level === 'A0' || content.readingTextTranslation) && (
                            <button 
                                onClick={() => setShowTranslation(!showTranslation)}
                                className="text-sm flex items-center gap-1 text-teal-600 hover:text-teal-800 font-medium px-2 py-1 bg-teal-50 rounded"
                            >
                                <Languages size={16} /> 
                                {showTranslation ? 'Hide English' : 'Translate'}
                            </button>
                        )}
                    </div>
                    
                    <p className="leading-relaxed text-gray-800 whitespace-pre-wrap text-lg font-normal">
                        {content.readingText}
                    </p>
                    
                    {/* Translation Block */}
                    {showTranslation && content.readingTextTranslation && (
                        <div className="mt-4 pt-4 border-t border-teal-100 animate-in fade-in slide-in-from-top-2">
                            <p className="text-gray-600 text-base leading-relaxed italic">
                                {content.readingTextTranslation}
                            </p>
                        </div>
                    )}

                    {/* Vocabulary Helper Section */}
                    {content.vocabulary && content.vocabulary.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="bg-teal-100 text-teal-700 py-0.5 px-2 rounded-full">Helper</span> Vocabulary from this lesson
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {content.vocabulary.map((vocab, i) => (
                                    <div key={i} className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="font-bold text-gray-900">{vocab.german}</div>
                                        <div className="text-gray-600 text-xs mt-1 leading-snug">{vocab.englishExplanation}</div>
                                        <div className="text-teal-700 font-medium text-xs mt-1">{vocab.hindiTranslation}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {content.readingQuestions?.map((q, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <p className="font-bold mb-4 text-gray-900 text-lg">{q.question}</p>
                        <div className="space-y-3">
                            {q.options.map((opt, optIdx) => {
                                const isSelected = readingAnswers[idx] === optIdx;
                                const isCorrect = q.correctAnswer === optIdx;
                                const showResult = readingAnswers[idx] !== undefined;
                                
                                let style = "border-gray-200 hover:bg-gray-50 text-gray-700";
                                if (showResult) {
                                    if (isCorrect) style = "bg-green-100 border-green-500 text-green-900 font-medium";
                                    else if (isSelected && !isCorrect) style = "bg-red-100 border-red-500 text-red-900";
                                    else style = "border-gray-200 text-gray-400"; // Fade out others
                                } else if (isSelected) {
                                    style = "border-teal-500 bg-teal-50 text-teal-900 font-medium";
                                }

                                return (
                                    <button 
                                        key={optIdx}
                                        disabled={showResult}
                                        onClick={() => {
                                            setReadingAnswers(prev => ({...prev, [idx]: optIdx}));
                                            if (optIdx === q.correctAnswer) setScore(s => s + 5);
                                        }}
                                        className={`w-full text-left p-3.5 border rounded-lg text-base transition-colors ${style}`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className="flex-1">{opt}</span>
                                            {showResult && isCorrect && <Check size={20} className="text-green-600 ml-2 flex-shrink-0" />}
                                            {showResult && isSelected && !isCorrect && <X size={20} className="text-red-600 ml-2 flex-shrink-0" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {readingAnswers[idx] !== undefined && q.explanation && (
                             <div className="mt-4 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <span className="font-bold text-blue-800">Explanation:</span> {q.explanation}
                             </div>
                        )}
                    </div>
                ))}

                {Object.keys(readingAnswers).length === (content.readingQuestions?.length || 0) && (
                     <button 
                     onClick={handleNext}
                     className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-colors text-lg"
                  >
                     Continue
                  </button>
                )}
            </div>
        )}

        {/* WRITING STAGE */}
        {stage === 'writing' && (
             <div className="h-full flex flex-col pb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">Schreiben (Writing)</h3>
                    <p className="text-gray-800 mb-4 text-lg">{content.writingPrompt}</p>
                    {content.writingPoints && (
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                            <p className="text-xs font-bold text-orange-800 uppercase mb-2">Points to cover:</p>
                            <ul className="list-disc list-inside text-gray-800 space-y-1">
                                {content.writingPoints.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
                
                <textarea 
                    className="w-full flex-1 border border-gray-300 rounded-xl p-4 text-gray-900 text-base focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none min-h-[200px]"
                    placeholder="Type your German text here..."
                    value={writingText}
                    onChange={(e) => setWritingText(e.target.value)}
                />

                <div className="mt-6">
                    <button 
                        onClick={submitWriting}
                        disabled={writingText.length < 10 || isEvaluating}
                        className="w-full bg-teal-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 text-lg hover:bg-teal-700 transition-colors"
                    >
                        {isEvaluating ? <Loader2 className="animate-spin" /> : 'Get Feedback'}
                    </button>
                </div>
             </div>
        )}

        {/* FEEDBACK STAGE */}
        {stage === 'feedback' && (
            <div className="pb-20">
                <div className="bg-white p-6 rounded-xl shadow mb-6 border border-gray-200">
                    <h3 className="font-bold text-xl mb-4 text-teal-800">Your Feedback</h3>
                    <div className="prose prose-sm prose-teal max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {writingFeedback}
                    </div>
                </div>
                <button 
                    onClick={() => setStage('finished')}
                    className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition-colors"
                >
                    See Summary
                </button>
            </div>
        )}

        {/* FINISHED STAGE */}
        {stage === 'finished' && (
             <div className="text-center pt-10">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 text-green-600 shadow-sm">
                    <Check size={48} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Well Done!</h2>
                <p className="text-gray-600 mb-10 text-lg">You have completed this session.</p>
                <div className="bg-white p-6 rounded-xl shadow-sm max-w-xs mx-auto mb-10 border border-gray-100">
                    <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Session Score</p>
                    <p className="text-4xl font-bold text-teal-600 mt-2">+{score} XP</p>
                </div>
                <button 
                    onClick={finishLesson}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
                >
                    Back to Dashboard
                </button>
             </div>
        )}
      </div>
    </div>
  );
};

const BookOpenIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
)

export default LessonSession;