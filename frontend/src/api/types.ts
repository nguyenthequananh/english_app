export type Grade = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';
export type Status = 'LOCKED' | 'ACTIVE' | 'DONE';
export type WordStatus = 'NEW' | 'LEARNING' | 'KNOWN';
export type SessionStep = 'REVIEW' | 'NEW' | 'LESSON' | 'DONE';
export type ExerciseType = 'MCQ' | 'FILL' | 'MINIMAL_PAIR' | 'DICTATION';

export interface Health { app: string; status: string; recoveredFrom: string | null; restoredFrom: string | null }

export interface Profile { id: number; name: string; avatar: string | null; hasPin: boolean; dailyMinutes: number; voice: string | null; speechRate: number }
export interface CreateProfile { name: string; avatar?: string | null; pin?: string | null; dailyMinutes?: number | null; voice?: string | null }
export interface UpdateProfile { name?: string; avatar?: string; pin?: string; removePin?: boolean; dailyMinutes?: number; voice?: string; speechRate?: number }
export interface ProfileImportResult { profile: Profile; skippedRows: number }

export interface Word {
  id: number; headword: string; pos: string; ipaUs: string | null; ipaUk: string | null; meaningVi: string;
  exampleEn: string | null; exampleVi: string | null; cefr: string | null; source: 'OXFORD' | 'AWL' | 'USER';
}
export interface WordBankItem { word: Word; status: WordStatus; dueDate: string | null }
export interface AddWord { headword: string; pos: string; ipaUs?: string; meaningVi: string; exampleEn?: string; exampleVi?: string }
export interface CardState { ease: number; intervalDays: number; repetitions: number; lapses: number; dueDate: string }

export interface SessionView {
  studyDate: string; step: SessionStep; currentCard: Word | null; reviewsLeft: number; newLeft: number;
  lessonCode: string | null; cardsDone: number; finished: boolean;
}

export interface ExerciseView { code: string; type: ExerciseType; prompt: string; options: string[] | null }
export interface ExerciseResult { code: string; given: string | null; correct: boolean; answer: string; explanationVi: string | null }
export interface Lesson { code: string; unitCode: string; type: string; day: string; title: string; bodyMd: string; exercises: ExerciseView[]; bestScore: number | null }
export interface LessonSummary { code: string; type: string; day: string; title: string; sortOrder: number; completed: boolean }
export interface SubmitResult { score: number; results: ExerciseResult[] }
export interface TestDto { code: string; kind: 'UNIT' | 'STAGE'; passRatio: number; exercises: ExerciseView[] }
export interface TestResult { score: number; passed: boolean; results: ExerciseResult[]; weakUnits: string[] }

export interface UnitView { code: string; title: string; status: Status }
export interface StageView { code: string; title: string; targetBand: number; status: Status; testAvailable: boolean; units: UnitView[] }
export interface Roadmap { stages: StageView[] }

export interface CurrentUnit { code: string; title: string; lessonsDone: number; lessonsTotal: number; testReady: boolean }
export interface Summary { streak: number; dueCount: number; currentUnit: CurrentUnit | null; finishedToday: boolean }
export interface DayMinutes { date: string; minutes: number }
export interface WeekCount { weekStart: string; total: number }
export interface TestResultItem { testCode: string; kind: string; score: number; passed: boolean; takenAt: string }
export interface Stats { streak: number; knownWords: number; learningWords: number; heatmap: DayMinutes[]; knownByWeek: WeekCount[]; tests: TestResultItem[] }

export interface BackupInfo { name: string; sizeBytes: number; createdAt: string }
export interface Settings { appHome: string; backupDir: string; logDir: string }
export interface ContentImportResult { file: string; ok: boolean; errors: string[] }
