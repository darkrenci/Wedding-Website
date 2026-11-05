// Love Notes / Guest Wishes Service
// Stores guest warm wishes persistently in localStorage and provides real-time sync across client & admin

export interface LoveNote {
  id: string;
  name: string;
  message: string;
  date: string;
  timestamp: number;
}

const STORAGE_KEY = 'wedding_love_notes';
const SYNC_EVENT = 'wedding_love_notes_updated';

const DEFAULT_LOVE_NOTES: LoveNote[] = [
  {
    id: 'note-sample-1',
    name: 'Charlotte & James',
    message: 'So utterly delighted for you two! Counting down the days until we celebrate in NYC! ❤️',
    date: 'Yesterday',
    timestamp: Date.now() - 24 * 3600 * 1000,
  },
  {
    id: 'note-sample-2',
    name: 'Uncle Robert',
    message: 'A match made in heaven. Can’t wait for the dancing and wonderful reunion!',
    date: '2 days ago',
    timestamp: Date.now() - 48 * 3600 * 1000,
  },
];

export const getLoveNotes = (): LoveNote[] => {
  if (typeof window === 'undefined') return DEFAULT_LOVE_NOTES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOVE_NOTES));
      return DEFAULT_LOVE_NOTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_LOVE_NOTES;
  } catch {
    return DEFAULT_LOVE_NOTES;
  }
};

const notifyLoveNotesUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  }
};

import { saveLoveNotesToSupabase, fetchLoveNotesFromSupabase } from '../services/supabaseWeddingService';

export const syncLoveNotesFromSupabase = async (): Promise<LoveNote[]> => {
  try {
    const remote = await fetchLoveNotesFromSupabase();
    if (remote && Array.isArray(remote) && remote.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      notifyLoveNotesUpdated();
      return remote;
    }
  } catch {}
  return getLoveNotes();
};

export const addLoveNote = (name: string, message: string): LoveNote => {
  const current = getLoveNotes();
  const newNote: LoveNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    message: message.trim(),
    date: 'Just now',
    timestamp: Date.now(),
  };

  const updated = [newNote, ...current];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save love note:', err);
  }
  notifyLoveNotesUpdated();
  saveLoveNotesToSupabase(updated).catch(() => {});
  return newNote;
};

export const deleteLoveNote = (id: string): boolean => {
  const current = getLoveNotes();
  const filtered = current.filter((note) => note.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete love note:', err);
    return false;
  }
  notifyLoveNotesUpdated();
  saveLoveNotesToSupabase(filtered).catch(() => {});
  return true;
};

export const editLoveNote = (id: string, name: string, message: string): boolean => {
  const current = getLoveNotes();
  const idx = current.findIndex((note) => note.id === id);
  if (idx === -1) return false;

  current[idx] = {
    ...current[idx],
    name: name.trim(),
    message: message.trim(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to edit love note:', err);
    return false;
  }
  notifyLoveNotesUpdated();
  return true;
};

export const resetDefaultLoveNotes = (): LoveNote[] => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOVE_NOTES));
  } catch {}
  notifyLoveNotesUpdated();
  return DEFAULT_LOVE_NOTES;
};

export const clearAllLoveNotes = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch {}
  notifyLoveNotesUpdated();
};

export const LOVE_NOTES_SYNC_EVENT = SYNC_EVENT;
