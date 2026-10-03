export type Attendance = 'hadir' | 'tidak_hadir' | 'ragu';

export interface Guest {
  id: string;
  code: string;
  name: string;
  /** Sapaan hormat, misal "Bapak", "Ibu", "Saudara/i". Kosong = sapaan umum. */
  salutation?: string;
  groupName?: string;
  phone?: string;
  maxPax: number;
  sentAt?: string;
  openedAt?: string;
  openCount: number;
  createdAt: string;
}

export interface RSVP {
  id: string;
  /** Kode tamu (Guest.code) jika RSVP berasal dari link personal. */
  guestCode?: string;
  ticketCode: string;
  name: string;
  attendance: Attendance;
  pax: number;
  note?: string;
  checkedInAt?: string;
  checkedInPax?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Wish {
  id: string;
  name: string;
  message: string;
  relationship?: string;
  createdAt: string;
  isHidden?: boolean;
}

/** Data tamu aktif yang sedang membuka undangan. */
export interface ActiveGuest {
  code: string;
  name: string;
  salutation?: string;
  maxPax: number;
  /** true jika kode ditemukan di daftar tamu. */
  isRegistered: boolean;
  /** true selama kode di URL masih dicocokkan dengan daftar tamu. */
  isPending?: boolean;
}
