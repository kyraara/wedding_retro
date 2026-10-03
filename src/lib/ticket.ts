import { RSVP } from '../types/wedding';
import { coupleNames, weddingYear } from './wedding';

/** Penanda acara di dalam QR tiket, misal "DIMAS_LARAS_PREMIERE_2027". */
export const EVENT_TAG = `${coupleNames.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_PREMIERE_${weddingYear}`;

export function buildTicketQrPayload(rsvp: RSVP): string {
  return JSON.stringify({
    event: EVENT_TAG,
    ticketCode: rsvp.ticketCode,
    guest: rsvp.name,
    pax: rsvp.pax,
  });
}

/** Ambil kode tiket dari hasil scan QR (payload JSON) atau input manual. */
export function parseTicketCode(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  if (text.startsWith('{')) {
    try {
      const data = JSON.parse(text) as { ticketCode?: string };
      return data.ticketCode?.trim() || null;
    } catch {
      return null;
    }
  }
  return text;
}

const RANDOM_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // tanpa 0/o/1/l agar mudah dibaca

/** String acak dari crypto (bukan Math.random) agar kode tidak bisa ditebak. */
export function randomToken(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => RANDOM_ALPHABET[b % RANDOM_ALPHABET.length]).join('');
}

/** Panjang akhiran acak minimal pada kode tamu, misal "budi-santoso-k7m2x9qa". */
export const GUEST_CODE_SUFFIX_LENGTH = 8;

/** Kode tamu lama (akhiran acak pendek / tanpa akhiran) mudah ditebak dan sebaiknya dibuat ulang. */
export function isWeakGuestCode(code: string): boolean {
  return !new RegExp(`-[a-z0-9]{${GUEST_CODE_SUFFIX_LENGTH},}$`).test(code);
}

export function generateTicketCode(): string {
  return 'TKT-' + randomToken(10).toUpperCase();
}
