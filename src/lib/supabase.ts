import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'wedding_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'custom' | 'none';
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export const DEFAULT_SUPABASE_URL = 'https://mghkhteukycwqyjvijvc.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_NOkWGuCQFppWznUZEWybag_EaSc3WMs';

export function getSupabaseConfig(): SupabaseConfig {
  // Check env vars first
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && !envUrl.includes('your-project-ref') && !envUrl.includes('your-project-id')) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  // Check localStorage for direct user override
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          isConfigured: true,
          source: 'custom',
        };
      }
    }
  } catch {
    // ignore
  }

  // Use the connected project credentials
  if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
    return {
      url: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_ANON_KEY,
      isConfigured: true,
      source: 'preset' as any,
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
    );
  } catch {
    // ignore
  }
  cachedClient = null;
  cachedKey = '';
}

export function clearCustomSupabaseConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  cachedClient = null;
  cachedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    return null;
  }

  const cacheId = `${config.url}::${config.anonKey}`;
  if (cachedClient && cachedKey === cacheId) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedKey = cacheId;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  rowCount?: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or Anon Public Key is missing or invalid.',
    };
  }

  try {
    // Check if guests table exists and can be queried
    const { data, error, count } = await client
      .from('guests')
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      // If table doesn't exist yet, give clear guidance
      if (
        error.message?.includes('relation "guests" does not exist') ||
        error.code === '42P01' ||
        error.message?.includes('not found')
      ) {
        return {
          success: true,
          message:
            'Connected to Supabase! The "guests" table was not found yet. Please run the provided SQL setup script to create it.',
          rowCount: 0,
        };
      }
      return {
        success: false,
        message: `Supabase error: ${error.message} (${error.code || 'code unknown'})`,
      };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase! Found ${count ?? data?.length ?? 0} guest records in the "guests" table.`,
      rowCount: count ?? data?.length ?? 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Network error connecting to Supabase: ${err?.message || 'Check URL and CORS'}`,
    };
  }
}
