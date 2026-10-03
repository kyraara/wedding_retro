/**
 * Data contoh untuk demo ke client. Dimuat otomatis saat penyimpanan masih kosong
 * dan saat tombol "Reset Data Demo" ditekan di panel admin.
 */
import { Guest, RSVP, Wish } from '../types/wedding';

type SeedGuest = Omit<Guest, 'id' | 'createdAt' | 'openCount'> & { openCount?: number };

const seedGuests: SeedGuest[] = [
  { code: 'andi-wijaya', name: 'Andi Wijaya & Partner', salutation: 'Saudara', groupName: 'Sahabat Kuliah', phone: '6281234567890', maxPax: 2, openCount: 3, sentAt: '2026-09-10T09:00:00+07:00', openedAt: '2026-09-10T10:12:00+07:00' },
  { code: 'sarah-nadia', name: 'Sarah Nadia', salutation: 'Saudari', groupName: 'Keluarga', phone: '6289876543210', maxPax: 1, openCount: 1, sentAt: '2026-09-10T09:05:00+07:00', openedAt: '2026-09-11T19:40:00+07:00' },
  { code: 'budi-santoso', name: 'Budi Santoso, S.Kom & Keluarga', salutation: 'Bapak', groupName: 'Rekan Kerja', phone: '6285551234567', maxPax: 3, openCount: 2, sentAt: '2026-09-10T09:10:00+07:00', openedAt: '2026-09-12T08:02:00+07:00' },
  { code: 'hendra-dewi', name: 'Hendra & Dewi', salutation: 'Om & Tante', groupName: 'Keluarga Besar', phone: '6281377712345', maxPax: 2, openCount: 4, sentAt: '2026-09-11T08:00:00+07:00', openedAt: '2026-09-11T08:30:00+07:00' },
  { code: 'rian-maya', name: 'Rian & Maya', salutation: 'Saudara', groupName: 'Sahabat Kuliah', phone: '6281298765432', maxPax: 2, openCount: 2, sentAt: '2026-09-11T08:05:00+07:00', openedAt: '2026-09-11T12:15:00+07:00' },
  { code: 'denny-prasetya', name: 'Denny Prasetya', salutation: 'Saudara', groupName: 'Komunitas Film 35mm', phone: '6287812341234', maxPax: 1, openCount: 1, sentAt: '2026-09-12T10:00:00+07:00', openedAt: '2026-09-12T21:48:00+07:00' },
  { code: 'siti-rahma', name: 'Siti Rahmawati, M.Pd', salutation: 'Ibu', groupName: 'Guru & Dosen', phone: '6281199887766', maxPax: 2, openCount: 1, sentAt: '2026-09-12T10:05:00+07:00', openedAt: '2026-09-13T06:20:00+07:00' },
  { code: 'agus-kurniawan', name: 'Agus Kurniawan & Istri', salutation: 'Bapak', groupName: 'Tetangga', phone: '6282233445566', maxPax: 2, openCount: 1, sentAt: '2026-09-13T16:00:00+07:00', openedAt: '2026-09-14T17:05:00+07:00' },
  { code: 'nadia-putri', name: 'Nadia Putri', salutation: 'Saudari', groupName: 'Sahabat SMA', phone: '6281312312312', maxPax: 2, openCount: 2, sentAt: '2026-09-13T16:05:00+07:00', openedAt: '2026-09-13T20:44:00+07:00' },
  { code: 'yusuf-hamdani', name: 'H. Yusuf Hamdani & Keluarga', salutation: 'Bapak', groupName: 'Keluarga Besar', phone: '6281277788899', maxPax: 4, openCount: 1, sentAt: '2026-09-14T09:00:00+07:00', openedAt: '2026-09-15T07:30:00+07:00' },
  { code: 'tim-kreatif', name: 'Tim Kreatif Studio Lensa', salutation: 'Rekan-rekan', groupName: 'Rekan Kerja', phone: '', maxPax: 5, openCount: 3, sentAt: '2026-09-14T09:05:00+07:00', openedAt: '2026-09-14T11:11:00+07:00' },
  { code: 'fajar-ramadhan', name: 'Fajar Ramadhan', salutation: 'Saudara', groupName: 'Sahabat SMA', phone: '6285712345678', maxPax: 2, openCount: 0, sentAt: '2026-09-15T13:00:00+07:00' },
  { code: 'lina-marlina', name: 'Lina Marlina', salutation: 'Ibu', groupName: 'Rekan Kerja', phone: '6281345678901', maxPax: 1, openCount: 0, sentAt: '2026-09-15T13:05:00+07:00' },
  { code: 'bayu-anggara', name: 'Bayu Anggara & Partner', salutation: 'Saudara', groupName: 'Komunitas Film 35mm', phone: '6287788990011', maxPax: 2, openCount: 0 },
  { code: 'keluarga-wirawan', name: 'Keluarga Besar Wirawan', salutation: 'Bapak/Ibu', groupName: 'Keluarga Besar', phone: '6281166554433', maxPax: 5, openCount: 0 },
];

export const DEMO_GUESTS: Guest[] = seedGuests.map((g, i) => ({
  ...g,
  id: `g-${i + 1}`,
  openCount: g.openCount ?? 0,
  createdAt: `2026-09-0${1 + (i % 9)}T10:00:00+07:00`,
}));

const rsvp = (
  guestCode: string | undefined,
  ticketCode: string,
  name: string,
  attendance: RSVP['attendance'],
  pax: number,
  note: string,
  at: string
): RSVP => ({
  id: `rsvp-${ticketCode.toLowerCase()}`,
  guestCode,
  ticketCode,
  name,
  attendance,
  pax: attendance === 'hadir' ? pax : 0,
  note,
  createdAt: at,
  updatedAt: at,
});

export const DEMO_RSVPS: RSVP[] = [
  rsvp('andi-wijaya', 'ANDI-WIJAYA', 'Andi Wijaya & Partner', 'hadir', 2, 'Siap hadir bersama pasangan!', '2026-09-10T10:20:00+07:00'),
  rsvp('budi-santoso', 'BUDI-SANTOSO', 'Budi Santoso, S.Kom & Keluarga', 'hadir', 3, '', '2026-09-12T08:10:00+07:00'),
  rsvp('hendra-dewi', 'HENDRA-DEWI', 'Hendra & Dewi', 'hadir', 2, 'Insya Allah hadir di akad dan resepsi.', '2026-09-11T08:40:00+07:00'),
  rsvp('rian-maya', 'RIAN-MAYA', 'Rian & Maya', 'hadir', 2, '', '2026-09-11T12:20:00+07:00'),
  rsvp('denny-prasetya', 'DENNY-PRASETYA', 'Denny Prasetya', 'hadir', 1, 'Bawa kamera analog ya!', '2026-09-12T21:55:00+07:00'),
  rsvp('sarah-nadia', 'SARAH-NADIA', 'Sarah Nadia', 'tidak_hadir', 0, 'Mohon maaf sedang dinas luar kota. Doa terbaik!', '2026-09-11T19:45:00+07:00'),
  rsvp('siti-rahma', 'SITI-RAHMA', 'Siti Rahmawati, M.Pd', 'ragu', 0, 'Menunggu jadwal mengajar.', '2026-09-13T06:30:00+07:00'),
  rsvp('nadia-putri', 'NADIA-PUTRI', 'Nadia Putri', 'hadir', 1, '', '2026-09-13T20:50:00+07:00'),
  rsvp('tim-kreatif', 'TIM-KREATIF', 'Tim Kreatif Studio Lensa', 'hadir', 4, 'Kami datang ramai-ramai!', '2026-09-14T11:20:00+07:00'),
  rsvp('agus-kurniawan', 'AGUS-KURNIAWAN', 'Agus Kurniawan & Istri', 'tidak_hadir', 0, 'Ada acara keluarga di luar kota.', '2026-09-14T17:10:00+07:00'),
  rsvp(undefined, 'TKT-7QX2LM', 'Wulan Sari', 'hadir', 1, 'Tahu undangan dari grup alumni.', '2026-09-16T14:02:00+07:00'),
];

export const DEMO_WISHES: Wish[] = [
  {
    id: 'w-1',
    name: 'Rian & Maya',
    message: 'Selamat untuk Dimas dan Laras! Semoga cinta kalian abadi seperti film klasik yang tak pernah usang dimakan zaman. Bahagia selalu sampai kakek nenek!',
    relationship: 'Sahabat',
    createdAt: '2026-09-11T12:25:00+07:00',
  },
  {
    id: 'w-2',
    name: 'Om Hendra & Tante Dewi',
    message: "Barakallahu lakuma wa baraka alaikuma wa jama'a bainakuma fii khair. Turut berbahagia untuk kedua keluarga besar. Semoga acaranya lancar hingga hari H!",
    relationship: 'Keluarga',
    createdAt: '2026-09-11T08:45:00+07:00',
  },
  {
    id: 'w-3',
    name: 'Denny Prasetya',
    message: 'Konsep undangannya keren banget bro! Nggak sabar hadir di premiere pemutaran cinta kalian berdua. See you on the red carpet!',
    relationship: 'Komunitas',
    createdAt: '2026-09-12T22:00:00+07:00',
  },
  {
    id: 'w-4',
    name: 'Sarah Nadia',
    message: 'Maaf belum bisa hadir langsung, tapi doaku menyertai kalian. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.',
    relationship: 'Keluarga',
    createdAt: '2026-09-11T19:50:00+07:00',
  },
  {
    id: 'w-5',
    name: 'Tim Kreatif Studio Lensa',
    message: 'Dari satu rol film ke rol berikutnya, semoga setiap frame hidup kalian selalu penuh warna. Selamat menempuh hidup baru, Dimas & Laras!',
    relationship: 'Rekan Kerja',
    createdAt: '2026-09-14T11:25:00+07:00',
  },
  {
    id: 'w-6',
    name: 'Nadia Putri',
    message: 'Laras, akhirnya! Dari zaman SMA kita suka nonton film lawas bareng, sekarang kamu jadi pemeran utamanya. Love you, bestie!',
    relationship: 'Sahabat',
    createdAt: '2026-09-13T20:55:00+07:00',
  },
  {
    id: 'w-7',
    name: 'Ibu Siti Rahmawati',
    message: 'Selamat atas pernikahannya. Semoga Allah SWT melimpahkan keberkahan dan kebahagiaan untuk kalian berdua.',
    relationship: 'Tamu Terhormat',
    createdAt: '2026-09-13T06:35:00+07:00',
  },
  {
    id: 'w-8',
    name: 'Wulan Sari',
    message: 'Undangan paling unik yang pernah aku terima! Selamat ya kalian berdua, semoga langgeng.',
    relationship: 'Komunitas',
    createdAt: '2026-09-16T14:05:00+07:00',
  },
];
