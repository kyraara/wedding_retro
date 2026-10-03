# The Premiere · Undangan Pernikahan Retro Film

Undangan pernikahan digital bergaya film 35mm era 60–70-an: intro film leader, poster "Now Showing", trailer prewedding, pita seluloid, tiket premiere ber-QR, ucapan tamu, dan panel admin untuk **mengedit semua konten tanpa coding**, mengelola tamu, serta check-in QR di hari H.

## Menjalankan

```bash
npm install
npm run dev          # http://localhost:3000
npm run dev:https    # https://<ip-lokal>:3000 — agar kamera scanner bisa dipakai dari HP
npm run build        # hasil produksi di dist/
```

## Dua mode

| | Mode demo lokal | Mode Supabase (client sungguhan) |
| --- | --- | --- |
| Aktif jika | env Supabase kosong | `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` diisi |
| Data (konten, tamu, RSVP, ucapan) | Di browser, berisi data contoh | Di database, tersinkron untuk semua tamu |
| Login admin | PIN (`VITE_ADMIN_PIN`, default `2027`) | Email + password (Supabase Auth) |
| Upload foto | ✓ (disimpan di browser) | ✓ (Supabase Storage) |
| Upload video & musik | Link saja | ✓ (maks 50 MB / 15 MB) |

**Client baru → ikuti [docs/SETUP-CLIENT-BARU.md](docs/SETUP-CLIENT-BARU.md)** (±15 menit, tanpa coding).

## Panduan demo ke client

| Yang ingin ditunjukkan | Buka |
| --- | --- |
| Undangan personal tamu | `/?to=andi-wijaya` |
| Undangan tanpa nama | `/` |
| Tampilan saat acara berlangsung | `/?preview=live` |
| Tampilan setelah acara | `/?preview=after` |
| Panel admin (tersembunyi) | `/#/admin` |

Alur yang disarankan: buka link tamu → RSVP "Hadir" → simpan tiket PNG → buka `/#/admin` → **Konten** (ganti nama/foto/tanggal, lalu Simpan, dan tunjukkan undangan langsung berubah) → **Check-in** (scan QR tiket) → **Reset Demo** untuk mengembalikan semuanya.

## Panel admin

- **Konten**: mempelai, acara & tanggal (zona WIB/WITA/WIT), poster, kisah, galeri (unggah banyak sekaligus), trailer & video, amplop (rekening, gambar QRIS, alamat kado), dress code, musik, kredit, galeri pasca-acara, tampil/sembunyikan section, template WhatsApp. Foto dikompres otomatis sebelum diunggah.
- **Tamu**: tambah/edit dengan sapaan, import CSV/Excel, kirim WhatsApp, salin link/teks, status dikirim/dibuka, ekspor.
- **RSVP**: rekap per status, catatan, ekspor.
- **Ucapan**: sembunyikan/hapus.
- **Check-in**: scan QR dengan kamera atau cari manual, peringatan tiket ganda, progres kedatangan.

## Struktur penting

| File | Isi |
| --- | --- |
| `src/content/defaultContent.ts` | Template konten demo (titik awal client baru) |
| `src/content/types.ts` | Bentuk data konten |
| `src/lib/content.ts` | Muat/simpan konten (Supabase atau browser) |
| `src/lib/store/` | Data tamu/RSVP/ucapan: `supabaseStore.ts` & `localStore.ts` |
| `src/content/demoSeed.ts` | Data tamu contoh untuk mode demo |
| `supabase/schema.sql` | Skema database + aturan keamanan (RLS) |
| `scripts/optimize-images.mjs` | Konversi foto template ke WebP (khusus pengembang) |

## Keamanan (mode Supabase)

- Daftar tamu & RSVP **tidak bisa dibaca publik**. Tamu hanya mengakses datanya sendiri lewat fungsi RPC berdasarkan kode di link.
- Kode tamu diberi akhiran acak (`budi-santoso-x7k2`) sehingga link tamu lain tidak bisa ditebak.
- Jumlah kursi divalidasi di server sesuai batas tiap tamu.
- Hanya akun yang login (admin) yang bisa mengubah konten, data, dan file. **Matikan pendaftaran publik** di Supabase (lihat panduan setup).
