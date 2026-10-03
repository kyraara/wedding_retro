# Setup Undangan untuk Client Baru

Waktu: ±15 menit. Tidak perlu mengubah kode sama sekali.
Setiap client mendapat **project Supabase sendiri** dan **deploy sendiri**, jadi data antar client terpisah total.

---

## 1. Buat project Supabase (gratis)

1. Buka <https://supabase.com>, login, lalu klik **New project**.
2. Isi nama (misal `undangan-raka-laras`), buat password database (simpan saja, jarang dipakai), dan pilih region **Southeast Asia (Singapore)**.
3. Tunggu ±2 menit sampai project siap.

## 2. Jalankan skema database

1. Di dashboard Supabase, buka **SQL Editor** lalu **New query**.
2. Salin seluruh isi file [`supabase/schema.sql`](../supabase/schema.sql), tempel, lalu klik **Run**.
3. Pastikan muncul "Success. No rows returned".

File ini membuat tabel, aturan keamanan, fungsi untuk tamu, dan bucket penyimpanan foto/video.

> Setiap kali `schema.sql` diperbarui (misal perbaikan keamanan), jalankan ulang dengan cara yang sama. Data yang sudah ada tidak terhapus.

## 3. Buat akun admin & matikan pendaftaran

1. Buka **Authentication → Users → Add user → Create new user**.
2. Isi email dan password admin, lalu centang **Auto Confirm User**. Akun ini yang dipakai untuk login di `/#/admin`. Boleh dibuat dua akun, misal untuk kamu dan untuk client.
3. Buka **Authentication → Sign In / Providers**, lalu **matikan "Allow new users to sign up"**.
   > ⚠️ Langkah ini wajib. Kalau pendaftaran dibiarkan terbuka, orang lain bisa membuat akun dan mendapat akses admin.

## 4. Ambil kunci API

Buka **Project Settings → API**, lalu catat:
- **Project URL**, contoh `https://abcdxyz.supabase.co`
- **anon public key**, kunci panjang yang diawali `eyJ...`

> Kunci `anon` aman dipasang di website. **Jangan pernah** memakai kunci `service_role`.

## 5. Deploy ke Vercel

1. Pastikan kode ada di GitHub (cukup satu repo untuk semua client).
2. Di <https://vercel.com>, pilih **Add New → Project**, lalu import repo tersebut.
3. Di **Environment Variables**, isi:

   | Nama | Nilai |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Project URL dari langkah 4 |
   | `VITE_SUPABASE_ANON_KEY` | anon public key dari langkah 4 |
   | `VITE_SITE_URL` | Domain undangan, misal `https://raka-laras.vercel.app` (bisa diisi setelah deploy pertama) |

4. Klik **Deploy**. Framework (Vite) terdeteksi otomatis.

Untuk client berikutnya, ulangi langkah 1–5 dengan **project Vercel baru** dari repo yang sama, dengan env berbeda.

> **Netlify:** caranya sama. Pilih Add new site → Import from Git. Build command `npm run build`, publish directory `dist`, lalu isi environment variables yang sama.

> **cPanel (shared hosting):**
> 1. Isi ketiga variabel di atas ke file `.env` di komputer, lalu jalankan `npm run build`.
> 2. Upload **seluruh isi** folder `dist/` ke `public_html` (atau folder subdomain), **termasuk file tersembunyi `.htaccess`**. Di File Manager, aktifkan *Settings → Show Hidden Files* untuk memastikan file itu terupload.
> 3. `.htaccess` memasang header keamanan (CSP, anti-iframe, dll.) dan cache aset. Jika setelah upload muncul *500 Internal Server Error*, minta hosting mengaktifkan `mod_headers`.
> 4. Aktifkan SSL (cPanel → *SSL/TLS Status* / AutoSSL). Kamera scanner check-in hanya berjalan lewat `https://`.
> 5. Setiap mengganti `.env` atau kode, ulangi build lalu upload ulang isi `dist/`.

## 6. Isi konten undangan

1. Buka `https://domain-undangan/#/admin` lalu login dengan akun dari langkah 3.
2. Di tab **Konten**, isi setiap bagian:
   - **Mempelai**: nama, foto, orang tua
   - **Acara & Tanggal**: zona waktu, tanggal & jam, lokasi, batas RSVP
   - **Poster & Umum**: foto poster (gambar preview WhatsApp ikut dibuat otomatis)
   - **Kisah, Galeri Foto, Video, Amplop Digital, Musik, Kredit Penutup**
   - **Pengaturan**: section yang ditampilkan dan template pesan WhatsApp
3. Klik **Simpan**. Perubahan langsung terlihat oleh semua tamu.

Sebelum diisi, undangan menampilkan template demo (Dimas & Laras), jadi pastikan semua bagian sudah diganti sebelum link disebar.

## 7. Masukkan tamu & kirim undangan

Di tab **Tamu**, tambah tamu satu per satu, atau unduh **Template CSV**, isi di Excel, lalu import. Kirim undangan lewat tombol WhatsApp di tiap baris.

## 8. Redeploy untuk preview link

Judul dan gambar yang muncul saat link dibagikan di WhatsApp diambil saat **build**. Setelah nama, tanggal, atau poster final diisi di admin, buka Vercel → **Deployments → ⋯ → Redeploy** satu kali. Hal lain (teks, foto, RSVP) tidak perlu redeploy.

---

## Setelah acara selesai

- Bagian "Terima Kasih" + galeri hari H otomatis muncul. Isi fotonya di **Konten → Setelah Acara**.
- Rekap tamu, RSVP, dan check-in bisa diekspor ke CSV dari panel admin.

## Batas paket gratis Supabase (cukup untuk undangan)

- Database 500 MB, Storage 1 GB, ukuran file maks 50 MB per upload.
- Project gratis yang **tidak dipakai 7 hari** akan di-*pause*. Buka dashboard Supabase lalu klik **Restore** untuk mengaktifkan lagi. Untuk undangan yang aktif, buka admin sesekali atau upgrade bila perlu.

## Masalah umum

| Gejala | Solusi |
| --- | --- |
| Halaman "Undangan gagal dimuat" | Cek `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` di Vercel, lalu redeploy. Cek juga apakah project Supabase sedang di-pause. |
| Login admin "Email atau password salah" | Pastikan user dibuat dengan **Auto Confirm User**. |
| Upload foto gagal | Pastikan `schema.sql` sudah dijalankan (bucket `media` ada). |
| Masih tampil mode demo (PIN) | Env Supabase belum terbaca. Pastikan namanya diawali `VITE_` lalu redeploy. |
