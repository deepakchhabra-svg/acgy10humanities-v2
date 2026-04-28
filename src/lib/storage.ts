import { Attempt } from './types';

const KEY = 'y10geoExamProgressV47';

export function loadLocalAttempts(): Attempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Attempt[];
  } catch {
    return [];
  }
}

export function saveLocalAttempt(attempt: Attempt) {
  const existing = loadLocalAttempts();
  localStorage.setItem(KEY, JSON.stringify([attempt, ...existing].slice(0, 500)));
}
