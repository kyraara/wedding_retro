/**
 * Bentuk konten undangan yang bisa diedit dari panel admin (tab Konten).
 * Semua nilai harus bisa disimpan sebagai JSON. Gambar/video/audio berupa URL.
 */

export type TimeZoneId = 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura';

export interface Person {
  callname: string;
  fullname: string;
  bio: string;
  parents: string;
  instagram: string;
  photo: string;
}

export interface WeddingEventItem {
  id: string;
  title: string;
  subtitle: string;
  /** Waktu mulai (ISO 8601 dengan offset zona waktu). */
  dateISO: string;
  /** Waktu selesai (ISO 8601 dengan offset zona waktu). */
  endISO: string;
  venue: string;
  address: string;
  /** Kosongkan untuk dibuat otomatis dari nama venue + alamat. */
  mapsUrl: string;
}

export interface Scene {
  id: string;
  year: string;
  title: string;
  story: string;
  image: string;
}

export interface Still {
  id: string;
  title: string;
  caption: string;
  image: string;
}

export interface BankAccount {
  id: string;
  bank: string;
  number: string;
  holder: string;
}

export interface SectionToggles {
  trailer: boolean;
  story: boolean;
  gallery: boolean;
  dressCode: boolean;
  envelope: boolean;
  rsvp: boolean;
  wishes: boolean;
}

export interface WeddingContent {
  couple: {
    groom: Person;
    bride: Person;
  };
  /** Tampilkan fitur demo: parameter ?preview=before|live|after. */
  demoMode: boolean;
  sections: SectionToggles;
  presentedBy: string;
  /** Nama keluarga singkat untuk billing block poster. */
  producedBy: string;
  tagline: string;
  /** Kota/lokasi singkat untuk teks ringkas (tiket, WA, intro). */
  city: string;
  region: string;
  /** Zona waktu semua acara. */
  timeZone: TimeZoneId;
  filmEdgeText: string;
  posterImage: string;
  /** Gambar 1200x630 untuk preview link (dibuat otomatis saat poster diunggah). */
  ogImage: string;
  synopsis: {
    quote: string;
    source: string;
  };
  events: WeddingEventItem[];
  /** id acara yang dicetak di tiket premiere (lokasi registrasi QR). */
  mainEventId: string;
  rsvp: {
    /** Batas akhir konfirmasi kehadiran (ISO 8601). */
    deadlineISO: string;
  };
  /**
   * Template pesan WhatsApp untuk mengirim undangan dari panel admin.
   * Placeholder: {sapaan} {nama} {link} {pasangan} {tanggal} {kota}
   */
  whatsappTemplate: string;
  /** Video pendek yang diputar setelah hitungan mundur intro (file MP4, bukan YouTube). */
  intro: {
    videoUrl: string;
  };
  trailer: {
    title: string;
    caption: string;
    /** Link YouTube/Vimeo atau file video yang diunggah. */
    videoUrl: string;
  };
  dressCode: {
    title: string;
    description: string;
    palette: string[];
  };
  scenes: Scene[];
  stills: Still[];
  envelope: {
    qris: {
      /** Gambar QRIS asli dari bank (diutamakan). */
      image: string;
      /** Alternatif: string payload QRIS untuk dibuatkan kodenya. */
      payload: string;
      nmid: string;
      merchantName: string;
    };
    accounts: BankAccount[];
    giftAddress: {
      recipient: string;
      address: string;
      phone: string;
      note: string;
    };
  };
  credits: {
    executiveProducers: string[];
    supportingCast: string[];
    shootingLocation: string;
    soundtrack: string;
    specialThanks: string;
  };
  audio: {
    title: string;
    artist: string;
    src: string;
  };
  /** Konten yang tampil setelah acara selesai. */
  postEvent: {
    title: string;
    message: string;
    /** Link YouTube/Vimeo atau file video yang diunggah. */
    videoUrl: string;
    gallery: Array<{
      id: string;
      image: string;
      caption: string;
    }>;
  };
}
