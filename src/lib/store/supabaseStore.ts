import type { SupabaseClient } from '@supabase/supabase-js';
import { Guest, RSVP, Wish } from '../../types/wedding';
import { DataStore } from './types';

// --- Pemetaan baris database (snake_case) ⇄ tipe aplikasi (camelCase) ---

interface GuestRow {
  id: string;
  code: string;
  name: string;
  salutation: string | null;
  group_name: string | null;
  phone: string | null;
  max_pax: number;
  sent_at: string | null;
  opened_at: string | null;
  open_count: number;
  created_at: string;
}

interface RsvpRow {
  id: string;
  guest_code: string | null;
  ticket_code: string;
  name: string;
  attendance: RSVP['attendance'];
  pax: number;
  note: string | null;
  checked_in_at: string | null;
  checked_in_pax: number | null;
  created_at: string;
  updated_at: string;
}

interface WishRow {
  id: string;
  name: string;
  message: string;
  relationship: string | null;
  is_hidden: boolean;
  created_at: string;
}

const u = <T,>(v: T | null): T | undefined => v ?? undefined;

const toGuest = (r: GuestRow): Guest => ({
  id: r.id,
  code: r.code,
  name: r.name,
  salutation: u(r.salutation),
  groupName: u(r.group_name),
  phone: u(r.phone),
  maxPax: r.max_pax,
  sentAt: u(r.sent_at),
  openedAt: u(r.opened_at),
  openCount: r.open_count,
  createdAt: r.created_at,
});

const fromGuest = (g: Guest): GuestRow => ({
  id: g.id,
  code: g.code,
  name: g.name,
  salutation: g.salutation ?? null,
  group_name: g.groupName ?? null,
  phone: g.phone ?? null,
  max_pax: g.maxPax,
  sent_at: g.sentAt ?? null,
  opened_at: g.openedAt ?? null,
  open_count: g.openCount,
  created_at: g.createdAt,
});

const toRsvp = (r: RsvpRow): RSVP => ({
  id: r.id,
  guestCode: u(r.guest_code),
  ticketCode: r.ticket_code,
  name: r.name,
  attendance: r.attendance,
  pax: r.pax,
  note: u(r.note),
  checkedInAt: u(r.checked_in_at),
  checkedInPax: u(r.checked_in_pax),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toWish = (r: WishRow): Wish => ({
  id: r.id,
  name: r.name,
  message: r.message,
  relationship: u(r.relationship),
  isHidden: r.is_hidden,
  createdAt: r.created_at,
});

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/**
 * Penyimpanan di Supabase. Tamu (anon) hanya mengakses data miliknya lewat fungsi RPC,
 * sedangkan admin yang login mendapat akses penuh (lihat supabase/schema.sql).
 */
export class SupabaseStore implements DataStore {
  constructor(private db: SupabaseClient) {}

  // --- Tamu ---
  async listGuests(): Promise<Guest[]> {
    const rows = check(await this.db.from('guests').select('*').order('created_at', { ascending: false }));
    return (rows as GuestRow[]).map(toGuest);
  }

  async getGuestByCode(code: string): Promise<Guest | undefined> {
    const rows = check(await this.db.rpc('get_guest', { p_code: code })) as Array<
      Pick<GuestRow, 'code' | 'name' | 'salutation' | 'max_pax'>
    >;
    const r = rows?.[0];
    if (!r) return undefined;
    return {
      id: '',
      code: r.code,
      name: r.name,
      salutation: u(r.salutation),
      maxPax: r.max_pax,
      openCount: 0,
      createdAt: '',
    };
  }

  async saveGuest(guest: Guest): Promise<void> {
    check(await this.db.from('guests').upsert(fromGuest(guest)));
  }

  async saveGuests(guests: Guest[]): Promise<void> {
    if (guests.length === 0) return;
    check(await this.db.from('guests').upsert(guests.map(fromGuest)));
  }

  async deleteGuest(id: string): Promise<void> {
    check(await this.db.from('guests').delete().eq('id', id));
  }

  async trackOpen(code: string): Promise<void> {
    check(await this.db.rpc('track_open', { p_code: code }));
  }

  async markSent(id: string): Promise<void> {
    check(await this.db.from('guests').update({ sent_at: new Date().toISOString() }).eq('id', id));
  }

  async changeGuestCode(id: string, newCode: string): Promise<void> {
    const guest = check(await this.db.from('guests').select('code').eq('id', id).single()) as Pick<GuestRow, 'code'>;
    check(await this.db.from('guests').update({ code: newCode, sent_at: null }).eq('id', id));
    check(
      await this.db
        .from('rsvps')
        .update({ guest_code: newCode, ticket_code: newCode.toUpperCase(), updated_at: new Date().toISOString() })
        .eq('guest_code', guest.code)
    );
  }

  // --- RSVP ---
  async listRsvps(): Promise<RSVP[]> {
    const rows = check(await this.db.from('rsvps').select('*').order('updated_at', { ascending: false }));
    return (rows as RsvpRow[]).map(toRsvp);
  }

  async getRsvpByTicket(ticketCode: string): Promise<RSVP | undefined> {
    const rows = check(await this.db.rpc('get_rsvp', { p_ticket: ticketCode })) as RsvpRow[];
    return rows?.[0] ? toRsvp(rows[0]) : undefined;
  }

  async saveRsvp(rsvp: RSVP): Promise<RSVP> {
    const row = check(
      await this.db.rpc('submit_rsvp', {
        p_ticket: rsvp.ticketCode,
        p_guest_code: rsvp.guestCode ?? null,
        p_name: rsvp.name,
        p_attendance: rsvp.attendance,
        p_pax: rsvp.pax,
        p_note: rsvp.note ?? '',
      })
    ) as RsvpRow;
    return toRsvp(row);
  }

  private async patchRsvp(ticketCode: string, patch: Partial<RsvpRow>): Promise<RSVP> {
    const row = check(
      await this.db
        .from('rsvps')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('ticket_code', ticketCode)
        .select()
        .single()
    ) as RsvpRow;
    return toRsvp(row);
  }

  checkIn(ticketCode: string, pax: number): Promise<RSVP> {
    return this.patchRsvp(ticketCode, { checked_in_at: new Date().toISOString(), checked_in_pax: pax });
  }

  undoCheckIn(ticketCode: string): Promise<RSVP> {
    return this.patchRsvp(ticketCode, { checked_in_at: null, checked_in_pax: null });
  }

  // --- Ucapan ---
  async listWishes(options?: { includeHidden?: boolean }): Promise<Wish[]> {
    let query = this.db.from('wishes').select('*').order('created_at', { ascending: false });
    if (!options?.includeHidden) query = query.eq('is_hidden', false);
    return (check(await query) as WishRow[]).map(toWish);
  }

  async addWish(wish: Pick<Wish, 'name' | 'message' | 'relationship'>): Promise<Wish> {
    const row = check(
      await this.db
        .from('wishes')
        .insert({ name: wish.name, message: wish.message, relationship: wish.relationship ?? null })
        .select()
        .single()
    ) as WishRow;
    return toWish(row);
  }

  async updateWish(id: string, patch: Partial<Pick<Wish, 'isHidden' | 'message'>>): Promise<void> {
    const row: Partial<WishRow> = {};
    if (patch.isHidden !== undefined) row.is_hidden = patch.isHidden;
    if (patch.message !== undefined) row.message = patch.message;
    check(await this.db.from('wishes').update(row).eq('id', id));
  }

  async deleteWish(id: string): Promise<void> {
    check(await this.db.from('wishes').delete().eq('id', id));
  }

  async resetData(): Promise<void> {
    // Filter "id tidak kosong" diperlukan karena Supabase menolak delete tanpa filter.
    check(await this.db.from('rsvps').delete().neq('id', ''));
    check(await this.db.from('wishes').delete().neq('id', ''));
    check(await this.db.from('guests').delete().neq('id', ''));
  }
}
