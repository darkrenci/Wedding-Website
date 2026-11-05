// IndexedDB Storage Service for Custom Wedding Audio & Media
// Solves localStorage 5MB quota limit so custom MP3/WAV uploads persist permanently across page refreshes

const DB_NAME = 'WeddingMediaDB';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio_files';
const AUDIO_RECORD_KEY = 'current_custom_wedding_audio';

export interface StoredAudioRecord {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  size: number;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Saves an uploaded audio file (MP3, WAV, etc.) permanently to IndexedDB
 */
export async function saveCustomAudioFile(file: File | Blob, name: string): Promise<string> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);

      const record: StoredAudioRecord = {
        id: AUDIO_RECORD_KEY,
        blob: file,
        name: name || 'Custom Wedding Track',
        type: file.type || 'audio/mp3',
        size: file.size,
        updatedAt: Date.now(),
      };

      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        // Create an Object URL for immediate playback
        const objectUrl = URL.createObjectURL(file);
        resolve(objectUrl);
      };

      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    });
  } catch (err) {
    console.error('Failed to save audio to IndexedDB:', err);
    throw err;
  }
}

/**
 * Loads the saved custom audio file from IndexedDB and returns a playable Object URL.
 * If expectedName is provided, validates that the cached track matches the desired track.
 */
export async function loadCustomAudioFile(expectedName?: string): Promise<{ url: string; name: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(AUDIO_STORE);
      const getRequest = store.get(AUDIO_RECORD_KEY);

      getRequest.onsuccess = () => {
        const result = getRequest.result as StoredAudioRecord | undefined;
        if (result && result.blob) {
          // If a specific track name is expected and doesn't match the cache, treat as cache miss
          if (expectedName && result.name && result.name.trim().toLowerCase() !== expectedName.trim().toLowerCase()) {
            resolve(null);
            return;
          }

          const objectUrl = URL.createObjectURL(result.blob);
          resolve({
            url: objectUrl,
            name: result.name || 'Custom Wedding Track',
          });
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Could not load custom audio from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears custom audio from IndexedDB
 */
export async function clearCustomAudioFile(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([AUDIO_STORE], 'readwrite');
      const store = transaction.objectStore(AUDIO_STORE);
      const deleteRequest = store.delete(AUDIO_RECORD_KEY);
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => resolve();
    });
  } catch {}
}
