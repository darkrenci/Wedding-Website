import { InvitedGuest, RSVPResponse } from '../types/wedding';
import {
  fetchGuestsFromSupabase,
  saveGuestToSupabase,
  deleteGuestFromSupabase,
  recordRSVPToSupabase,
  syncLocalGuestsToSupabase,
  updateGuestInSupabase,
  deleteAllGuestsFromSupabase,
  bulkUpsertGuestsToSupabase,
} from '../services/supabaseGuestService';
import { getSupabaseConfig } from '../lib/supabase';

const STORAGE_KEY = 'wedding_master_guest_list';

export const INITIAL_GUEST_LIST: InvitedGuest[] = [
  {
    id: 'guest-john-padilla',
    name: 'John Padilla',
    allocatedInvitations: 4, // Exactly per user requirement: John Padilla has 4 invitations
    rsvpStatus: 'pending',
  },
  {
    id: 'guest-eleanor-vance',
    name: 'Eleanor Vance',
    allocatedInvitations: 2,
    rsvpStatus: 'pending',
  },
  {
    id: 'guest-william-sterling',
    name: 'William Sterling',
    allocatedInvitations: 2,
    rsvpStatus: 'pending',
  },
  {
    id: 'guest-clara-montgomery',
    name: 'Clara Montgomery',
    allocatedInvitations: 1,
    rsvpStatus: 'pending',
  },
  {
    id: 'guest-david-santos',
    name: 'David Santos',
    allocatedInvitations: 3,
    rsvpStatus: 'pending',
  },
  {
    id: 'guest-sarah-jenkins',
    name: 'Sarah Jenkins',
    allocatedInvitations: 2,
    rsvpStatus: 'pending',
  },
  {
    id: 'guest-alexander-wright',
    name: 'Alexander Wright',
    allocatedInvitations: 1,
    rsvpStatus: 'pending',
  },
  {
    id: 'guest-marcus-aurelius',
    name: 'Marcus Aurelius',
    allocatedInvitations: 5,
    rsvpStatus: 'pending',
  },
];

type Listener = (guests: InvitedGuest[]) => void;
const listeners = new Set<Listener>();

function notifyListeners(guests: InvitedGuest[]) {
  listeners.forEach((listener) => {
    try {
      listener(guests);
    } catch (e) {
      console.error('Error notifying guest list listener:', e);
    }
  });
}

export function subscribeGuestList(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInvitedGuests(): InvitedGuest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GUEST_LIST));
      return INITIAL_GUEST_LIST;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_GUEST_LIST;
  } catch {
    return INITIAL_GUEST_LIST;
  }
}

export function saveInvitedGuests(list: InvitedGuest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    notifyListeners(list);
  } catch {
    // ignore
  }
}

let isSyncing = false;
export async function syncWithSupabase(): Promise<{
  synced: boolean;
  count: number;
  source: 'supabase' | 'local';
  error?: string;
}> {
  const config = getSupabaseConfig();
  if (!config.isConfigured || isSyncing) {
    return { synced: false, count: getInvitedGuests().length, source: 'local' };
  }

  isSyncing = true;
  try {
    const remoteGuests = await fetchGuestsFromSupabase();
    if (remoteGuests && remoteGuests.length > 0) {
      saveInvitedGuests(remoteGuests);
      return { synced: true, count: remoteGuests.length, source: 'supabase' };
    }
    return { synced: false, count: getInvitedGuests().length, source: 'local' };
  } catch (err: any) {
    return {
      synced: false,
      count: getInvitedGuests().length,
      source: 'local',
      error: err?.message,
    };
  } finally {
    isSyncing = false;
  }
}

export async function forcePullFromSupabase(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  try {
    const remote = await fetchGuestsFromSupabase();
    if (remote && Array.isArray(remote)) {
      if (remote.length > 0) {
        saveInvitedGuests(remote);
      }
      return { success: true, count: remote.length };
    }
    return { success: false, count: 0, error: 'No data returned from Supabase table "guests".' };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Failed to pull from Supabase' };
  }
}

export async function forcePushToSupabase(): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  const local = getInvitedGuests();
  const res = await syncLocalGuestsToSupabase(local);
  if (res.error) {
    return { success: false, count: 0, error: res.error };
  }
  return { success: true, count: res.count };
}

// Initial background sync if Supabase is active
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncWithSupabase().catch(() => {});
  }, 150);
}

export function searchInvitedGuests(query: string): InvitedGuest[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  const all = getInvitedGuests();
  return all.filter((g) => g.name.toLowerCase().includes(trimmed));
}

export function findGuestByName(name: string): InvitedGuest | undefined {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return undefined;
  const all = getInvitedGuests();
  return all.find((g) => g.name.toLowerCase() === trimmed);
}

export function addInvitedGuest(
  name: string,
  allocatedInvitations: number
): InvitedGuest {
  const list = getInvitedGuests();
  const newGuest: InvitedGuest = {
    id: `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    allocatedInvitations: Math.max(1, allocatedInvitations),
    rsvpStatus: 'pending',
  };
  const updated = [newGuest, ...list.filter((g) => g.name.toLowerCase() !== name.trim().toLowerCase())];
  saveInvitedGuests(updated);

  // Background sync to Supabase if configured
  saveGuestToSupabase(newGuest).catch((err) => {
    console.warn('Could not save new guest to Supabase:', err);
  });

  return newGuest;
}

export function updateGuestAllocation(id: string, newAllocated: number): void {
  const list = getInvitedGuests();
  const index = list.findIndex((g) => g.id === id);
  if (index >= 0) {
    const updated = {
      ...list[index],
      allocatedInvitations: Math.max(1, newAllocated),
    };
    list[index] = updated;
    saveInvitedGuests([...list]);
    saveGuestToSupabase(updated).catch(() => {});
  }
}

export function editInvitedGuest(
  id: string,
  newName: string,
  newAllocated: number
): InvitedGuest | null {
  const list = getInvitedGuests();
  const index = list.findIndex((g) => g.id === id);
  if (index < 0) return null;

  const oldGuest = list[index];
  const oldName = oldGuest.name;
  const cleanName = newName.trim();
  const cleanAllocated = Math.max(1, newAllocated);

  const updated: InvitedGuest = {
    ...oldGuest,
    name: cleanName,
    allocatedInvitations: cleanAllocated,
  };

  list[index] = updated;
  saveInvitedGuests([...list]);

  // Sync to Supabase in background
  updateGuestInSupabase(oldName, cleanName, cleanAllocated).catch((err) => {
    console.warn('Could not update guest in Supabase:', err);
  });

  return updated;
}

export async function bulkAddInvitedGuests(
  entries: Array<{ name: string; allocatedInvitations: number }>,
  mode: 'append' | 'replace' = 'append'
): Promise<{ count: number; error?: string }> {
  const existingList = mode === 'replace' ? [] : getInvitedGuests();

  const newItems: InvitedGuest[] = entries
    .filter((e) => e.name && e.name.trim().length > 0)
    .map((e, idx) => ({
      id: `guest-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: e.name.trim(),
      allocatedInvitations: Math.max(1, e.allocatedInvitations || 1),
      rsvpStatus: 'pending',
    }));

  if (newItems.length === 0) {
    return { count: 0 };
  }

  let merged: InvitedGuest[];
  if (mode === 'replace') {
    merged = newItems;
  } else {
    // Upsert by name
    const map = new Map<string, InvitedGuest>();
    existingList.forEach((g) => map.set(g.name.toLowerCase(), g));
    newItems.forEach((g) => {
      const key = g.name.toLowerCase();
      if (map.has(key)) {
        const prev = map.get(key)!;
        map.set(key, { ...prev, allocatedInvitations: g.allocatedInvitations });
      } else {
        map.set(key, g);
      }
    });
    merged = Array.from(map.values());
  }

  saveInvitedGuests(merged);

  // Sync all to Supabase
  try {
    const res = await bulkUpsertGuestsToSupabase(merged);
    return { count: merged.length, error: res.error };
  } catch (err: any) {
    return { count: merged.length, error: err?.message };
  }
}

export function removeInvitedGuest(id: string): void {
  const list = getInvitedGuests();
  const target = list.find((g) => g.id === id);
  const updated = list.filter((g) => g.id !== id);
  saveInvitedGuests(updated);

  if (target) {
    deleteGuestFromSupabase(target.id || target.name).catch(() => {});
  }
}

export function updateGuestRSVP(guestName: string, rsvp: RSVPResponse): void {
  const list = getInvitedGuests();
  const index = list.findIndex(
    (g) => g.name.toLowerCase() === guestName.trim().toLowerCase()
  );
  if (index >= 0) {
    list[index] = {
      ...list[index],
      rsvpStatus: rsvp.attending,
      attendingCount: rsvp.guestCount,
      companionNames: rsvp.companionNames,
      email: rsvp.email,
      dietary: rsvp.dietary,
      wishes: rsvp.wishes,
    };
    saveInvitedGuests(list);
  }

  // Sync to Supabase in background
  recordRSVPToSupabase(rsvp).catch((err) => {
    console.warn('Could not record RSVP in Supabase:', err);
  });
}

export function clearAllGuests(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    notifyListeners([]);
  } catch {
    // ignore
  }
  deleteAllGuestsFromSupabase().catch(() => {});
}

export function resetGuestList(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_GUEST_LIST));
    notifyListeners(INITIAL_GUEST_LIST);
  } catch {
    // ignore
  }
}

