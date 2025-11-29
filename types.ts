export type LanguageLevel = 'A0' | 'A1' | 'A2' | 'B1';

export interface UserProfile {
  name: string;
  targetLevel: 'B1';
  currentLevel: LanguageLevel;
  dailyMinutes: number;
  nativeLanguage: 'Hindi';
  readDevanagari: boolean;
  onboardingComplete: boolean;
}

export interface CourseProgress {
  A1: { lessonsDone: number; totalLessons: number };
  A2: { lessonsDone: number; totalLessons: number };
  B1: { lessonsDone: number; totalLessons: number };
}

export interface ExamStats {
  lastScore: string;
  weakPoints: string[];
  lastSessionDate: string;
}

export interface AppState {
  profile: UserProfile;
  courseProgress: CourseProgress;
  examStats: ExamStats;
}

export interface VocabularyCard {
  german: string;
  englishExplanation: string;
  hindiTranslation: string; // Latin script
  exampleSentence: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export interface LessonContent {
  topic: string;
  level: string;
  vocabulary: VocabularyCard[];
  readingText?: string;
  readingTextTranslation?: string; // New field for A0 support
  readingQuestions?: QuizQuestion[];
  writingPrompt?: string;
  writingPoints?: string[]; // For B1 bullets
  listeningScenario?: string; // Text description of a listening scenario
  listeningQuestions?: QuizQuestion[];
}

// Helper for initial state
export const INITIAL_STATE: AppState = {
  profile: {
    name: '',
    targetLevel: 'B1',
    currentLevel: 'A0',
    dailyMinutes: 15,
    nativeLanguage: 'Hindi',
    readDevanagari: false,
    onboardingComplete: false,
  },
  courseProgress: {
    A1: { lessonsDone: 0, totalLessons: 20 },
    A2: { lessonsDone: 0, totalLessons: 25 },
    B1: { lessonsDone: 0, totalLessons: 30 },
  },
  examStats: {
    lastScore: 'N/A',
    weakPoints: [],
    lastSessionDate: '',
  },
};