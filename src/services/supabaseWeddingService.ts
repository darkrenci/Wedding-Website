import { getSupabaseClient } from '../lib/supabase';
import { WeddingDetails } from '../types/wedding';
import { LoveNote } from '../utils/loveNotes';

const SETTINGS_KEY = '__wedding_global_settings__';
const AUDIO_META_KEY = '__wedding_audio_meta__';
const AUDIO_CHUNK_PREFIX = '__wedding_audio_chunk_';
const LOVE_NOTES_KEY = '__wedding_love_notes__';

const CHUNK_SIZE = 350000; // ~350KB per chunk to safely comply with HTTP and PostgREST limits

/**
 * Saves full wedding details (names, dates, pictures, music config, schedule) to Supabase cloud.
 * This ensures phones, other computers, and guests instantly see the updated website.
 */
export async function saveWeddingDetailsToSupabase(details: WeddingDetails): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Try primary wedding_settings table if configured
    try {
      const { error: primaryErr } = await client
        .from('wedding_settings')
        .upsert(
          { id: 'primary', data: details, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      if (!primaryErr) return true;
    } catch {}

    // 2. Reliable universal cloud sync using system config record in connected Supabase
    const payload = {
      name: SETTINGS_KEY,
      allocated_invitations: 1,
      rsvp_status: 'system',
      wishes: JSON.stringify(details),
    };

    const { error } = await client
      .from('guests')
      .upsert(payload, { onConflict: 'name' });

    if (error) {
      console.warn('Could not save wedding settings to Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Network error saving wedding details to Supabase:', err);
    return false;
  }
}

/**
 * Fetches the latest wedding details from Supabase cloud.
 */
export async function fetchWeddingDetailsFromSupabase(): Promise<WeddingDetails | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Check primary wedding_settings table first
    try {
      const { data: primaryData, error: primaryErr } = await client
        .from('wedding_settings')
        .select('data')
        .eq('id', 'primary')
        .maybeSingle();

      if (!primaryErr && primaryData?.data) {
        return primaryData.data as WeddingDetails;
      }
    } catch {}

    // 2. Check universal system record
    const { data, error } = await client
      .from('guests')
      .select('wishes')
      .eq('name', SETTINGS_KEY)
      .maybeSingle();

    if (error || !data || !data.wishes) {
      return null;
    }

    const parsed = JSON.parse(data.wishes);
    return parsed as WeddingDetails;
  } catch (err) {
    console.warn('Network error fetching wedding details from Supabase:', err);
    return null;
  }
}

interface AudioMeta {
  name: string;
  type: string;
  totalChunks: number;
  totalChars: number;
  updatedAt: number;
}

/**
 * Uploads a local custom audio track (MP3/WAV/etc.) to Supabase in robust chunks
 * so other devices and guest phones can stream and play the exact same track.
 */
export async function uploadCustomAudioToSupabase(
  file: File | Blob,
  name: string,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not connected.' };
  }

  try {
    if (onProgress) onProgress(5);

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        // strip data:audio/...;base64, prefix if desired, or keep raw
        resolve(res);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    if (onProgress) onProgress(15);

    const totalChars = base64Data.length;
    const totalChunks = Math.ceil(totalChars / CHUNK_SIZE);
    const updatedAt = Date.now();

    const meta: AudioMeta = {
      name: name || 'Custom Wedding Audio',
      type: file.type || 'audio/mp3',
      totalChunks,
      totalChars,
      updatedAt,
    };

    // 1. Upload all chunks in small batches
    for (let i = 0; i < totalChunks; i++) {
      const chunkStr = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkName = `${AUDIO_CHUNK_PREFIX}${i}__`;

      const { error: chunkErr } = await client.from('guests').upsert(
        {
          name: chunkName,
          allocated_invitations: 1,
          rsvp_status: 'system',
          wishes: chunkStr,
        },
        { onConflict: 'name' }
      );

      if (chunkErr) {
        throw new Error(`Failed to upload audio chunk ${i + 1}/${totalChunks}: ${chunkErr.message}`);
      }

      const progress = 15 + Math.round(((i + 1) / totalChunks) * 80);
      if (onProgress) onProgress(progress);
    }

    // 2. Upload metadata pointing to the new chunks
    const { error: metaErr } = await client.from('guests').upsert(
      {
        name: AUDIO_META_KEY,
        allocated_invitations: 1,
        rsvp_status: 'system',
        wishes: JSON.stringify(meta),
      },
      { onConflict: 'name' }
    );

    if (metaErr) {
      throw new Error(`Failed to record audio metadata: ${metaErr.message}`);
    }

    if (onProgress) onProgress(100);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to upload custom audio to Supabase:', err);
    return { success: false, error: err?.message || 'Upload failed' };
  }
}

/**
 * Downloads the custom wedding audio file from Supabase cloud
 * and returns a playable Object URL for playback on this device.
 */
export async function fetchCustomAudioFromSupabase(): Promise<{
  blob: Blob;
  url: string;
  name: string;
  updatedAt: number;
} | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Fetch audio metadata
    const { data: metaRow, error: metaErr } = await client
      .from('guests')
      .select('wishes')
      .eq('name', AUDIO_META_KEY)
      .maybeSingle();

    if (metaErr || !metaRow || !metaRow.wishes) {
      return null;
    }

    const meta: AudioMeta = JSON.parse(metaRow.wishes);
    if (!meta.totalChunks || meta.totalChunks <= 0) {
      return null;
    }

    // 2. Fetch all chunks
    const chunkNames = Array.from({ length: meta.totalChunks }, (_, i) => `${AUDIO_CHUNK_PREFIX}${i}__`);

    const { data: chunksRows, error: chunksErr } = await client
      .from('guests')
      .select('name, wishes')
      .in('name', chunkNames);

    if (chunksErr || !chunksRows || chunksRows.length < meta.totalChunks) {
      console.warn('Incomplete audio chunks retrieved from Supabase');
      return null;
    }

    // Sort chunks strictly in index order
    const chunkMap = new Map<string, string>();
    chunksRows.forEach((r) => chunkMap.set(r.name, r.wishes || ''));

    let fullBase64 = '';
    for (let i = 0; i < meta.totalChunks; i++) {
      const c = chunkMap.get(`${AUDIO_CHUNK_PREFIX}${i}__`);
      if (c === undefined) return null;
      fullBase64 += c;
    }

    // Convert data URL to Blob
    const response = await fetch(fullBase64);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      name: meta.name,
      updatedAt: meta.updatedAt,
    };
  } catch (err) {
    console.warn('Failed to fetch custom audio from Supabase:', err);
    return null;
  }
}

/**
 * Saves love notes list to Supabase so notes submitted from phone appear everywhere.
 */
export async function saveLoveNotesToSupabase(notes: LoveNote[]): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('guests').upsert(
      {
        name: LOVE_NOTES_KEY,
        allocated_invitations: 1,
        rsvp_status: 'system',
        wishes: JSON.stringify(notes),
      },
      { onConflict: 'name' }
    );
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches love notes list from Supabase cloud.
 */
export async function fetchLoveNotesFromSupabase(): Promise<LoveNote[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('guests')
      .select('wishes')
      .eq('name', LOVE_NOTES_KEY)
      .maybeSingle();

    if (error || !data || !data.wishes) return null;
    const parsed = JSON.parse(data.wishes);
    if (Array.isArray(parsed)) return parsed as LoveNote[];
    return null;
  } catch {
    return null;
  }
}
