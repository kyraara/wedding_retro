import { weddingConfig } from '../content/wedding.config';
import type { TimeZoneId, WeddingEventItem } from '../content/types';

export type WeddingEvent = WeddingEventItem;

const { groom, bride } = weddingConfig.couple;

/** "Dimas & Laras" */
export const coupleNames = `${groom.callname} & ${bride.callname}`;

const PLACEHOLDER_EVENT: WeddingEvent = {
  id: 'acara',
  title: 'ACARA',
  subtitle: '',
  dateISO: new Date(Date.now() + 30 * 864e5).toISOString(),
  endISO: new Date(Date.now() + 30 * 864e5 + 2 * 36e5).toISOString(),
  venue: '',
  address: '',
  mapsUrl: '',
};

/** Acara yang dicetak di tiket (lokasi registrasi QR). */
export const mainEvent: WeddingEvent =
  weddingConfig.events.find((e) => e.id === weddingConfig.mainEventId) ?? weddingConfig.events[0] ?? PLACEHOLDER_EVENT;

const validTimes = (key: 'dateISO' | 'endISO') =>
  weddingConfig.events
    .map((e) => new Date(e[key]).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

const sortedStarts = validTimes('dateISO');
const sortedEnds = validTimes('endISO');

/** Mulai acara pertama & selesai acara terakhir (epoch ms). */
export const weddingStart = sortedStarts[0] ?? new Date(mainEvent.dateISO).getTime();
export const weddingEnd = sortedEnds[sortedEnds.length - 1] ?? new Date(mainEvent.endISO).getTime();

const tz = weddingConfig.timeZone;

export const TIME_ZONES: Array<{ id: TimeZoneId; label: string; offset: string }> = [
  { id: 'Asia/Jakarta', label: 'WIB', offset: '+07:00' },
  { id: 'Asia/Makassar', label: 'WITA', offset: '+08:00' },
  { id: 'Asia/Jayapura', label: 'WIT', offset: '+09:00' },
];

const tzInfo = (id: string) => TIME_ZONES.find((z) => z.id === id) ?? TIME_ZONES[0];

/** "WIB" / "WITA" / "WIT" */
export const tzLabel = tzInfo(tz).label;

/** "Sabtu, 20 Maret 2027" */
export function formatDateLong(iso: string | number): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  }).format(new Date(iso));
}

/** "20 Maret 2027" */
export function formatDateShort(iso: string | number): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  }).format(new Date(iso));
}

/** "20.03.2027" */
export function formatDateDots(iso: string | number): string {
  const parts = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: tz,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('day')}.${get('month')}.${get('year')}`;
}

/** "11.30" */
export function formatTime(iso: string | number): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz,
  })
    .format(new Date(iso))
    .replace(':', '.');
}

/** Tanggal & jam dalam zona lokal pengguna, untuk data admin. "20 Mar 2027 11.30" */
export function formatDateTimeLocal(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d
    .toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    .replace(',', '');
}

/** Format waktu UTC untuk Google Calendar & .ics: "20270320T043000Z" */
export function toCalendarUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** "Sabtu, 20 Maret 2027" untuk satu acara. */
export const eventDateLabel = (e: WeddingEvent) => formatDateLong(e.dateISO);

/** "08.00 — 10.00 WIB" */
export const eventTimeLabel = (e: WeddingEvent) => `${formatTime(e.dateISO)} — ${formatTime(e.endISO)} ${tzLabel}`;

/** Link Google Maps acara; dibuat dari venue + alamat jika tidak diisi. */
export function eventMapsUrl(e: WeddingEvent): string {
  if (e.mapsUrl.trim()) return e.mapsUrl.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue}, ${e.address}`)}`;
}

/** Pecah ISO menjadi tanggal & jam lokal di zona tertentu, untuk input form. */
export function isoToLocalParts(iso: string, zone: string): { date: string; time: string } {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return { date: '', time: '' };
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${hour}:${get('minute')}` };
}

/** Gabungkan tanggal & jam lokal menjadi ISO dengan offset zona, misal "2027-03-20T08:00:00+07:00". */
export function localPartsToIso(date: string, time: string, zone: string): string {
  if (!date) return '';
  return `${date}T${time || '00:00'}:00${tzInfo(zone).offset}`;
}

/** Tanggal pernikahan (acara pertama), "Sabtu, 20 Maret 2027". */
export const weddingDateLong = formatDateLong(weddingStart);

/** Tahun pernikahan, "2027". */
export const weddingYear = new Date(weddingStart).getFullYear();

/** Nama tampilan tamu lengkap dengan sapaan. */
export function displayGuestName(name: string, salutation?: string): string {
  const s = salutation?.trim();
  if (!s) return name;
  return name.toLowerCase().startsWith(s.toLowerCase()) ? name : `${s} ${name}`;
}

/** Normalisasi nomor HP Indonesia ke format 62xxxxxxxx untuk wa.me. */
export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  return digits;
}

/** Ubah nama menjadi kode URL, misal "Budi Santoso & Keluarga" → "budi-santoso-keluarga". */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Link undangan personal untuk seorang tamu. */
export function buildInviteUrl(code: string): string {
  const base = window.location.origin + window.location.pathname;
  return `${base}?to=${encodeURIComponent(code)}`;
}

/** Isi template WhatsApp dari config untuk seorang tamu. */
export function buildWhatsAppMessage(guest: { name: string; salutation?: string; code: string }): string {
  const sapaan = guest.salutation?.trim() || 'Bapak/Ibu/Saudara/i';
  const values: Record<string, string> = {
    sapaan,
    nama: guest.name,
    link: buildInviteUrl(guest.code),
    pasangan: coupleNames,
    tanggal: weddingDateLong,
    kota: weddingConfig.city,
  };
  return weddingConfig.whatsappTemplate.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);
}

export function buildWhatsAppLink(guest: { name: string; salutation?: string; code: string; phone?: string }): string {
  const text = encodeURIComponent(buildWhatsAppMessage(guest));
  const phone = normalizePhone(guest.phone);
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}
