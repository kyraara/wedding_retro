import { supabase } from '../supabase';
import { LocalStorageStore } from './localStore';
import { SupabaseStore } from './supabaseStore';
import { DataStore } from './types';

export type { DataStore } from './types';

/**
 * Sumber data aktif: Supabase jika env VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY diisi,
 * selain itu mode demo lokal (data di browser, berisi data contoh).
 */
export const store: DataStore = supabase ? new SupabaseStore(supabase) : new LocalStorageStore();

// --- Memori per-perangkat (tetap lokal walau memakai backend) ---

const MY_TICKET_KEY = 'premiere_my_ticket';

/** Kode tiket milik pengunjung tanpa link personal, agar RSVP-nya bisa diedit lagi. */
export function getMyTicketCode(): string | null {
  try {
    return localStorage.getItem(MY_TICKET_KEY);
  } catch {
    return null;
  }
}

export function setMyTicketCode(code: string): void {
  try {
    localStorage.setItem(MY_TICKET_KEY, code);
  } catch {
    // abaikan
  }
}
