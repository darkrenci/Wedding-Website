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

const AUDIO_DATA_KEY = '__wedding_audio_data__';

interface AudioRecordMeta {
  name: string;
  type: string;
  size: number;
  updatedAt: number;
}

/**
 * Mobile-safe base64 to Blob decoder that avoids WebKit URL-length crashes.
 * Works seamlessly on iOS Safari, Android Chrome, and desktop browsers.
 */
function base64ToBlob(base64Data: string, contentType: string = 'audio/mpeg'): Blob {
  const clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType || 'audio/mpeg' });
}

/**
 * Uploads a local custom audio track (MP3/WAV/etc.) to Supabase in a single atomic record
 * so all phones, tablets, and computers can stream and play the exact same track.
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
    if (onProgress) onProgress(15);

    // Convert file/blob to base64 cleanly
    let base64Data = '';
    if (typeof (file as any).arrayBuffer === 'function') {
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      const len = bytes.byteLength;
      const chunkSize = 8192;
      for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
      }
      base64Data = `data:${file.type || 'audio/mp3'};base64,` + btoa(binary);
    } else if (typeof FileReader !== 'undefined') {
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }

    if (onProgress) onProgress(45);

    const meta: AudioRecordMeta = {
      name: name || 'Custom Wedding Audio',
      type: file.type || 'audio/mp3',
      size: file.size,
      updatedAt: Date.now(),
    };

    // Upsert atomic audio record into Supabase
    const payload = {
      name: AUDIO_DATA_KEY,
      allocated_invitations: 1,
      rsvp_status: 'system',
      dietary: JSON.stringify(meta),
      wishes: base64Data,
    };

    if (onProgress) onProgress(75);

    const { error: upsertErr } = await client
      .from('guests')
      .upsert(payload, { onConflict: 'name' });

    if (upsertErr) {
      throw new Error(`Supabase audio upload failed: ${upsertErr.message}`);
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
 * and returns a playable Object URL for instant playback on any mobile or desktop device.
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
    const { data, error } = await client
      .from('guests')
      .select('wishes, dietary')
      .eq('name', AUDIO_DATA_KEY)
      .maybeSingle();

    if (error || !data || !data.wishes) {
      return null;
    }

    let meta: AudioRecordMeta = {
      name: 'Custom Wedding Song',
      type: 'audio/mp3',
      size: data.wishes.length,
      updatedAt: Date.now(),
    };

    if (data.dietary) {
      try {
        meta = { ...meta, ...JSON.parse(data.dietary) };
      } catch {}
    }

    const blob = base64ToBlob(data.wishes, meta.type || 'audio/mp3');
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
