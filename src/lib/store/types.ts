import { Guest, RSVP, Wish } from '../../types/wedding';

/**
 * Kontrak penyimpanan data undangan.
 *
 * Implementasi bawaan (`LocalStorageStore`) menyimpan data di browser, cocok untuk demo.
 * Untuk produksi, buat implementasi baru (misal `SupabaseStore` / `FirebaseStore`) yang
 * memenuhi interface ini, lalu ganti ekspor `store` di `./index.ts`. Komponen tidak perlu diubah.
 */
export interface DataStore {
  // Tamu
  listGuests(): Promise<Guest[]>;
  getGuestByCode(code: string): Promise<Guest | undefined>;
  saveGuest(guest: Guest): Promise<void>;
  saveGuests(guests: Guest[]): Promise<void>;
  deleteGuest(id: string): Promise<void>;
  /** Catat bahwa link undangan tamu dibuka. */
  trackOpen(code: string): Promise<void>;
  /** Tandai undangan sudah dikirim (via WhatsApp / salin link). */
  markSent(id: string): Promise<void>;
  /**
   * Ganti kode link tamu. RSVP miliknya ikut dipindah (kode tiket = kode tamu baru),
   * dan status "dikirim" dikosongkan karena link lama tidak berlaku lagi.
   */
  changeGuestCode(id: string, newCode: string): Promise<void>;

  // RSVP & tiket
  listRsvps(): Promise<RSVP[]>;
  getRsvpByTicket(ticketCode: string): Promise<RSVP | undefined>;
  /** Simpan RSVP; mengembalikan versi tersimpan (server bisa menyesuaikan jumlah kursi). */
  saveRsvp(rsvp: RSVP): Promise<RSVP>;
  checkIn(ticketCode: string, pax: number): Promise<RSVP>;
  undoCheckIn(ticketCode: string): Promise<RSVP>;

  // Ucapan
  listWishes(options?: { includeHidden?: boolean }): Promise<Wish[]>;
  addWish(wish: Pick<Wish, 'name' | 'message' | 'relationship'>): Promise<Wish>;
  updateWish(id: string, patch: Partial<Pick<Wish, 'isHidden' | 'message'>>): Promise<void>;
  deleteWish(id: string): Promise<void>;

  /** Mode demo: kembalikan data contoh. Mode Supabase: hapus semua tamu, RSVP, dan ucapan. */
  resetData(): Promise<void>;
}
