/**
 * Konversi foto sumber (JPG/PNG) di `assets-original/` menjadi WebP ringan di
 * `src/assets/images/`, plus membuat `public/og-image.jpg` (1200x630) dari poster.
 *
 * Cara pakai untuk client baru:
 *   1. Taruh foto asli di folder `assets-original/` (nama file bebas).
 *   2. Jalankan `npm run optimize-images`.
 *   3. Import file .webp hasilnya di `src/content/wedding.config.ts`.
 */
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'assets-original');
const outDir = path.join(root, 'src', 'assets', 'images');
const publicDir = path.join(root, 'public');

const MAX_WIDTH = 1400;
const QUALITY = 78;
// File yang dipakai sebagai gambar preview link (WhatsApp, Facebook, dll.)
const OG_SOURCE_MATCH = 'poster';

await mkdir(outDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const files = (await readdir(srcDir)).filter((f) => /\.(jpe?g|png)$/i.test(f));
if (files.length === 0) {
  console.log('Tidak ada gambar di assets-original/.');
  process.exit(0);
}

for (const file of files) {
  const input = path.join(srcDir, file);
  const name = path.parse(file).name.replace(/_\d{10,}$/, '');
  const output = path.join(outDir, `${name}.webp`);

  const info = await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(output);
  console.log(`✓ ${file} → src/assets/images/${name}.webp (${Math.round(info.size / 1024)} KB)`);

  if (name.includes(OG_SOURCE_MATCH)) {
    const og = await sharp(input)
      .resize(1200, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(publicDir, 'og-image.jpg'));
    console.log(`✓ ${file} → public/og-image.jpg (${Math.round(og.size / 1024)} KB)`);
  }
}
