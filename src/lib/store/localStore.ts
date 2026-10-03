import { Guest, RSVP, Wish } from '../../types/wedding';
import { DEMO_GUESTS, DEMO_RSVPS, DEMO_WISHES } from '../../content/demoSeed';
import { DataStore } from './types';

const KEYS = {
  version: 'premiere_store_version',
  guests: 'premiere_guests',
  rsvps: 'premiere_rsvps',
  wishes: 'premiere_wishes',
};

/** Naikkan angka ini jika bentuk data berubah agar data lama di browser di-reset. */
const STORE_VERSION = '2';

// Fallback in-memory jika localStorage tidak tersedia (mode privat, dsb.)
const memory = new Map<string, string>();

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key) ?? memory.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    const raw = memory.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  }
}

function write<T>(key: string, value: T): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    localStorage.setItem(key, raw);
  } catch (e) {
    console.error('Gagal menyimpan data', key, e);
  }
}

function seed(): void {
  write(KEYS.guests, DEMO_GUESTS);
  write(KEYS.rsvps, DEMO_RSVPS);
  write(KEYS.wishes, DEMO_WISHES);
  write(KEYS.version, STORE_VERSION);
}

function ensureSeeded(): void {
  if (read<string | null>(KEYS.version, null) !== STORE_VERSION) seed();
}

const sameCode = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export class LocalStorageStore implements DataStore {
  constructor() {
    ensureSeeded();
  }

  // --- Tamu ---
  async listGuests(): Promise<Guest[]> {
    return read<Guest[]>(KEYS.guests, []);
  }

  async getGuestByCode(code: string): Promise<Guest | undefined> {
    return (await this.listGuests()).find((g) => sameCode(g.code, code));
  }

  async saveGuest(guest: Guest): Promise<void> {
    const list = await this.listGuests();
    const idx = list.findIndex((g) => g.id === guest.id);
    if (idx >= 0) list[idx] = guest;
    else list.unshift(guest);
    write(KEYS.guests, list);
  }

  async saveGuests(guests: Guest[]): Promise<void> {
    const list = await this.listGuests();
    for (const guest of guests) {
      const idx = list.findIndex((g) => g.id === guest.id);
      if (idx >= 0) list[idx] = guest;
      else list.unshift(guest);
    }
    write(KEYS.guests, list);
  }

  async deleteGuest(id: string): Promise<void> {
    write(
      KEYS.guests,
      (await this.listGuests()).filter((g) => g.id !== id)
    );
  }

  async trackOpen(code: string): Promise<void> {
    const list = await this.listGuests();
    const guest = list.find((g) => sameCode(g.code, code));
    if (!guest) return;
    guest.openCount = (guest.openCount || 0) + 1;
    guest.openedAt = guest.openedAt || new Date().toISOString();
    write(KEYS.guests, list);
  }

  async markSent(id: string): Promise<void> {
    const list = await this.listGuests();
    const guest = list.find((g) => g.id === id);
    if (!guest) return;
    guest.sentAt = new Date().toISOString();
    write(KEYS.guests, list);
  }

  async changeGuestCode(id: string, newCode: string): Promise<void> {
    const guests = await this.listGuests();
    const guest = guests.find((g) => g.id === id);
    if (!guest) return;
    const oldCode = guest.code;
    guest.code = newCode;
    delete guest.sentAt;
    write(KEYS.guests, guests);

    const rsvps = await this.listRsvps();
    for (const r of rsvps) {
      if (r.guestCode && sameCode(r.guestCode, oldCode)) {
        r.guestCode = newCode;
        r.ticketCode = newCode.toUpperCase();
      }
    }
    write(KEYS.rsvps, rsvps);
  }

  // --- RSVP ---
  async listRsvps(): Promise<RSVP[]> {
    return read<RSVP[]>(KEYS.rsvps, []);
  }

  async getRsvpByTicket(ticketCode: string): Promise<RSVP | undefined> {
    return (await this.listRsvps()).find((r) => sameCode(r.ticketCode, ticketCode));
  }

  async saveRsvp(rsvp: RSVP): Promise<RSVP> {
    const list = await this.listRsvps();
    const idx = list.findIndex((r) => sameCode(r.ticketCode, rsvp.ticketCode));
    if (idx >= 0) list[idx] = rsvp;
    else list.push(rsvp);
    write(KEYS.rsvps, list);
    return rsvp;
  }

  private async patchRsvp(ticketCode: string, patch: (r: RSVP) => void): Promise<RSVP> {
    const list = await this.listRsvps();
    const rsvp = list.find((r) => sameCode(r.ticketCode, ticketCode));
    if (!rsvp) throw new Error('Tiket tidak ditemukan');
    patch(rsvp);
    rsvp.updatedAt = new Date().toISOString();
    write(KEYS.rsvps, list);
    return rsvp;
  }

  async checkIn(ticketCode: string, pax: number): Promise<RSVP> {
    return this.patchRsvp(ticketCode, (r) => {
      r.checkedInAt = new Date().toISOString();
      r.checkedInPax = pax;
    });
  }

  async undoCheckIn(ticketCode: string): Promise<RSVP> {
    return this.patchRsvp(ticketCode, (r) => {
      delete r.checkedInAt;
      delete r.checkedInPax;
    });
  }

  // --- Ucapan ---
  async listWishes(options?: { includeHidden?: boolean }): Promise<Wish[]> {
    const list = read<Wish[]>(KEYS.wishes, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return options?.includeHidden ? list : list.filter((w) => !w.isHidden);
  }

  async addWish(wish: Pick<Wish, 'name' | 'message' | 'relationship'>): Promise<Wish> {
    const newWish: Wish = {
      ...wish,
      id: 'w-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    write(KEYS.wishes, [newWish, ...read<Wish[]>(KEYS.wishes, [])]);
    return newWish;
  }

  async updateWish(id: string, patch: Partial<Pick<Wish, 'isHidden' | 'message'>>): Promise<void> {
    write(
      KEYS.wishes,
      read<Wish[]>(KEYS.wishes, []).map((w) => (w.id === id ? { ...w, ...patch } : w))
    );
  }

  async deleteWish(id: string): Promise<void> {
    write(
      KEYS.wishes,
      read<Wish[]>(KEYS.wishes, []).filter((w) => w.id !== id)
    );
  }

  async resetData(): Promise<void> {
    seed();
  }
}
