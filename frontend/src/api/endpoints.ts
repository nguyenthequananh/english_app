import { api } from './client';
import type * as T from '../types/api';

const enc = encodeURIComponent;

export const endpoints = {
  health: () => api.get<T.Health>('/health'),
  shutdown: () => api.post<{ message: string }>('/app/shutdown'),

  profiles: () => api.get<T.Profile[]>('/profiles'),
  createProfile: (body: T.CreateProfile) => api.post<T.Profile>('/profiles', body),
  selectProfile: (id: number, pin?: string) => api.post<void>(`/profiles/${id}/select`, { pin: pin ?? null }),
  currentProfile: () => api.get<T.Profile>('/profiles/current'),
  updateProfile: (body: T.UpdateProfile) => api.put<T.Profile>('/profiles/current', body),
  deleteProfile: () => api.del<void>('/profiles/current'),
  importProfile: (data: unknown) => api.post<T.ProfileImportResult>('/profiles/import', data),

  roadmap: () => api.get<T.Roadmap>('/roadmap'),
  unitLessons: (unitCode: string) => api.get<T.LessonSummary[]>(`/units/${enc(unitCode)}/lessons`),
  lesson: (code: string) => api.get<T.Lesson>(`/lessons/${enc(code)}`),
  submitLesson: (code: string, answers: Record<string, string>) =>
    api.post<T.SubmitResult>(`/lessons/${enc(code)}/submit`, { answers }),
  unitTest: (unitCode: string) => api.get<T.TestDto>(`/units/${enc(unitCode)}/test`),
  stageTest: (stageCode: string) => api.get<T.TestDto>(`/stages/${enc(stageCode)}/test`),
  submitTest: (code: string, answers: Record<string, string>) =>
    api.post<T.TestResult>(`/tests/${enc(code)}/submit`, { answers }),

  dueCards: (limit = 200) => api.get<T.Word[]>(`/cards/due?limit=${limit}`),
  reviewCard: (wordId: number, grade: T.Grade) => api.post<T.CardState>(`/cards/${wordId}/review`, { grade }),
  words: (q: string, status: T.WordStatus | '') => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    const qs = params.toString();
    return api.get<T.WordBankItem[]>(`/words${qs ? `?${qs}` : ''}`);
  },
  addWord: (body: T.AddWord) => api.post<T.Word>('/words', body),

  sessionToday: () => api.get<T.SessionView>('/session/today'),
  answerCard: (wordId: number, grade: T.Grade) => api.post<T.SessionView>(`/session/today/cards/${wordId}`, { grade }),

  summary: () => api.get<T.Summary>('/progress/summary'),
  stats: () => api.get<T.Stats>('/progress/stats'),

  backups: () => api.get<T.BackupInfo[]>('/backups'),
  createBackup: () => api.post<T.BackupInfo>('/backups'),
  restoreBackup: (name: string) => api.post<{ message: string }>(`/backups/${enc(name)}/restore`),
  settings: () => api.get<T.Settings>('/settings'),
  updateSettings: (backupDir: string | null) => api.put<T.Settings>('/settings', { backupDir }),
  openLogs: () => api.post<void>('/settings/open-logs'),
  importContent: (files: File[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return api.post<T.ContentImportResult[]>('/content/import', form);
  },
};

export const downloads = {
  profileExport: '/api/profiles/current/export',
  dbExport: '/api/backups/export',
};
