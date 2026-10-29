import { getSupabaseClient } from '../lib/supabase';
import { InvitedGuest, RSVPResponse } from '../types/wedding';

export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- SUPABASE SQL SETUP FOR WEDDING GUEST LIST
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==========================================

-- 1. Create the Guests Table
create table if not exists public.guests (
  id text primary key default gen_random_uuid()::text,
  name text not null unique,
  allocated_invitations integer not null default 1,
  rsvp_status text default 'pending',
  attending_count integer,
  companion_names text[],
  email text,
  dietary text,
  wishes text,
  created_at timestamptz default now()
);

-- 2. Create the RSVPs Archive Table (Optional record of all submitted responses)
create table if not exists public.rsvps (
  id text primary key default gen_random_uuid()::text,
  guest_name text not null,
  attending text not null,
  guest_count integer not null default 1,
  companion_names text[],
  allocated_invitations integer default 1,
  email text,
  dietary text,
  wishes text,
  submitted_at timestamptz default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;

-- 4. Create Public Policies (allows your wedding guests to search their name and submit RSVP)
drop policy if exists "Allow public select guests" on public.guests;
create policy "Allow public select guests" on public.guests for select using (true);

drop policy if exists "Allow public insert guests" on public.guests;
create policy "Allow public insert guests" on public.guests for insert with check (true);

drop policy if exists "Allow public update guests" on public.guests;
create policy "Allow public update guests" on public.guests for update using (true);

drop policy if exists "Allow public delete guests" on public.guests;
create policy "Allow public delete guests" on public.guests for delete using (true);

drop policy if exists "Allow public select rsvps" on public.rsvps;
create policy "Allow public select rsvps" on public.rsvps for select using (true);

drop policy if exists "Allow public insert rsvps" on public.rsvps;
create policy "Allow public insert rsvps" on public.rsvps for insert with check (true);

-- 5. Seed with initial guest names and invitations (John Padilla with 4 invitations, etc.):
insert into public.guests (name, allocated_invitations)
values 
  ('John Padilla', 4),
  ('Eleanor Vance', 2),
  ('William Sterling', 2),
  ('David Santos', 3),
  ('Clara Montgomery', 1),
  ('Sarah Jenkins', 2),
  ('Alexander Wright', 1)
on conflict (name) do update 
set allocated_invitations = excluded.allocated_invitations;
`;

export function mapRowToInvitedGuest(row: any): InvitedGuest {
  return {
    id: String(row.id || row.name),
    name: String(row.name || ''),
    allocatedInvitations: Number(
      row.allocated_invitations ?? row.allocatedInvitations ?? 1
    ),
    rsvpStatus: (row.rsvp_status ?? row.rsvpStatus ?? 'pending') as
      | 'pending'
      | 'accepted'
      | 'declined',
    attendingCount:
      row.attending_count !== undefined
        ? Number(row.attending_count)
        : row.attendingCount !== undefined
        ? Number(row.attendingCount)
        : undefined,
    companionNames: Array.isArray(row.companion_names)
      ? row.companion_names
      : Array.isArray(row.companionNames)
      ? row.companionNames
      : undefined,
    email: row.email || undefined,
    dietary: row.dietary || undefined,
    wishes: row.wishes || undefined,
  };
}

export async function fetchGuestsFromSupabase(): Promise<InvitedGuest[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('guests')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Could not load guests from Supabase:', error.message);
      return null;
    }

    if (!Array.isArray(data)) return null;

    return data.map(mapRowToInvitedGuest);
  } catch (err) {
    console.warn('Network error loading guests from Supabase:', err);
    return null;
  }
}

export async function saveGuestToSupabase(
  guest: Partial<InvitedGuest> & { name: string; allocatedInvitations: number }
): Promise<InvitedGuest | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const payload = {
      name: guest.name.trim(),
      allocated_invitations: guest.allocatedInvitations,
      rsvp_status: guest.rsvpStatus || 'pending',
      attending_count: guest.attendingCount ?? null,
      companion_names: guest.companionNames || [],
      email: guest.email || null,
      dietary: guest.dietary || null,
      wishes: guest.wishes || null,
    };

    const { data, error } = await client
      .from('guests')
      .upsert(payload, { onConflict: 'name' })
      .select()
      .single();

    if (error) {
      console.error('Error saving guest to Supabase:', error);
      return null;
    }

    return mapRowToInvitedGuest(data);
  } catch (err) {
    console.error('Exception saving guest to Supabase:', err);
    return null;
  }
}

export async function updateGuestInSupabase(
  oldName: string,
  newName: string,
  allocatedInvitations: number
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();

    if (cleanOld.toLowerCase() === cleanNew.toLowerCase()) {
      const { error } = await client
        .from('guests')
        .update({ allocated_invitations: allocatedInvitations })
        .ilike('name', cleanOld);
      return !error;
    }

    // Try finding existing record by old name
    const { data: existing } = await client
      .from('guests')
      .select('*')
      .ilike('name', cleanOld)
      .maybeSingle();

    if (existing && existing.id) {
      const { error: updateErr } = await client
        .from('guests')
        .update({
          name: cleanNew,
          allocated_invitations: allocatedInvitations,
        })
        .eq('id', existing.id);
      return !updateErr;
    } else {
      // Upsert new name
      const { error: insertErr } = await client
        .from('guests')
        .upsert(
          {
            name: cleanNew,
            allocated_invitations: allocatedInvitations,
            rsvp_status: 'pending',
          },
          { onConflict: 'name' }
        );
      return !insertErr;
    }
  } catch (err) {
    console.error('Failed to update guest name in Supabase:', err);
    return false;
  }
}

export async function deleteAllGuestsFromSupabase(): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // Delete all rows in guests table
    const { error } = await client
      .from('guests')
      .delete()
      .neq('id', '___non_existent_id___');
    return !error;
  } catch {
    return false;
  }
}

export async function deleteGuestFromSupabase(idOrName: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error: err1 } = await client.from('guests').delete().eq('id', idOrName);
    if (!err1) return true;

    const { error: err2 } = await client.from('guests').delete().eq('name', idOrName);
    return !err2;
  } catch {
    return false;
  }
}

export async function recordRSVPToSupabase(rsvp: RSVPResponse): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    // 1. Try to update existing guest row
    const { data: updatedRows, error: updateErr } = await client
      .from('guests')
      .update({
        rsvp_status: rsvp.attending,
        attending_count: rsvp.guestCount,
        companion_names: rsvp.companionNames,
        email: rsvp.email,
        dietary: rsvp.dietary || null,
        wishes: rsvp.wishes || null,
      })
      .ilike('name', rsvp.guestName.trim())
      .select();

    // If guest did not exist in guests table yet, insert them
    if (!updateErr && (!updatedRows || updatedRows.length === 0)) {
      await client.from('guests').insert({
        name: rsvp.guestName.trim(),
        allocated_invitations: rsvp.allocatedInvitations || rsvp.guestCount || 1,
        rsvp_status: rsvp.attending,
        attending_count: rsvp.guestCount,
        companion_names: rsvp.companionNames,
        email: rsvp.email,
        dietary: rsvp.dietary || null,
        wishes: rsvp.wishes || null,
      });
    }

    // 2. Also log to rsvps table if exists
    try {
      await client.from('rsvps').insert({
        guest_name: rsvp.guestName,
        attending: rsvp.attending,
        guest_count: rsvp.guestCount,
        companion_names: rsvp.companionNames,
        allocated_invitations: rsvp.allocatedInvitations,
        email: rsvp.email,
        dietary: rsvp.dietary || null,
        wishes: rsvp.wishes || null,
      });
    } catch {
      // rsvps table is optional
    }

    return true;
  } catch (err) {
    console.error('Error recording RSVP to Supabase:', err);
    return false;
  }
}

export async function syncLocalGuestsToSupabase(
  localGuests: InvitedGuest[]
): Promise<{ count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { count: 0, error: 'Supabase is not configured or connected.' };
  }

  try {
    const rows = localGuests.map((g) => ({
      name: g.name.trim(),
      allocated_invitations: g.allocatedInvitations,
      rsvp_status: g.rsvpStatus || 'pending',
      attending_count: g.attendingCount ?? null,
      companion_names: g.companionNames || [],
      email: g.email || null,
      dietary: g.dietary || null,
      wishes: g.wishes || null,
    }));

    const { data, error } = await client
      .from('guests')
      .upsert(rows, { onConflict: 'name' })
      .select();

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: data?.length || rows.length };
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Unknown network error' };
  }
}

export async function bulkUpsertGuestsToSupabase(
  guests: InvitedGuest[]
): Promise<{ success: boolean; count: number; error?: string }> {
  return syncLocalGuestsToSupabase(guests).then((res) => ({
    success: !res.error,
    count: res.count,
    error: res.error,
  }));
}


