import { MEDIA_BUCKET, supabase } from './supabase';

/** Upload video/musik hanya tersedia dengan Supabase (terlalu besar untuk browser). */
export const canUploadLargeMedia = supabase !== null;

export const MAX_VIDEO_MB = 50;
/** Video pembuka diputar di awal, jadi harus ringan untuk data seluler. */
export const MAX_INTRO_VIDEO_MB = 20;
export const MAX_AUDIO_MB = 15;

const MAX_IMAGE_SIDE = 1600;

function randomId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Kecilkan & kompres gambar di browser. WebP jika didukung, selain itu JPEG. */
async function compressImage(
  file: Blob,
  opts: { maxSide?: number; width?: number; height?: number; quality?: number; type?: string } = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  let sx = 0;
  let sy = 0;
  let sw = width;
  let sh = height;

  if (opts.width && opts.height) {
    // Crop "cover" ke ukuran tetap (untuk gambar preview link).
    const scale = Math.max(opts.width / width, opts.height / height);
    sw = opts.width / scale;
    sh = opts.height / scale;
    sx = (width - sw) / 2;
    sy = (height - sh) / 2;
    width = opts.width;
    height = opts.height;
  } else {
    const max = opts.maxSide ?? MAX_IMAGE_SIDE;
    const scale = Math.min(1, max / Math.max(width, height));
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  bitmap.close();

  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  const preferred = opts.type ?? 'image/webp';
  const blob = await toBlob(preferred, opts.quality ?? 0.82);
  if (blob && blob.type === preferred) return blob;
  return (await toBlob('image/jpeg', 0.85))!;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function uploadToStorage(blob: Blob, folder: string, ext: string): Promise<string> {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi');
  const path = `${folder}/${randomId()}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

const extOf = (blob: Blob) => (blob.type === 'image/webp' ? 'webp' : 'jpg');

/**
 * Kompres lalu unggah foto. Mengembalikan URL publik (Supabase) atau data URL (mode demo lokal).
 */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('File harus berupa gambar');
  const blob = await compressImage(file);
  if (!supabase) return blobToDataUrl(blob);
  return uploadToStorage(blob, 'images', extOf(blob));
}

/** Buat gambar preview link 1200x630 (JPEG, paling kompatibel dengan WhatsApp) dari poster. */
export async function uploadOgImage(file: File): Promise<string> {
  const blob = await compressImage(file, { width: 1200, height: 630, type: 'image/jpeg', quality: 0.82 });
  if (!supabase) return '';
  return uploadToStorage(blob, 'og', 'jpg');
}

/** Unggah video atau musik apa adanya (dengan batas ukuran). */
export async function uploadMediaFile(file: File, kind: 'video' | 'audio', maxMbOverride?: number): Promise<string> {
  if (!supabase) throw new Error('Upload video/musik butuh Supabase. Gunakan link sebagai gantinya.');
  if (!file.type.startsWith(`${kind}/`)) {
    throw new Error(kind === 'video' ? 'File harus berupa video (MP4/WebM)' : 'File harus berupa audio (MP3/M4A)');
  }
  const maxMb = maxMbOverride ?? (kind === 'video' ? MAX_VIDEO_MB : MAX_AUDIO_MB);
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`Ukuran maksimal ${maxMb} MB. Kompres dulu atau gunakan link YouTube.`);
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || (kind === 'video' ? 'mp4' : 'mp3');
  return uploadToStorage(file, kind === 'video' ? 'videos' : 'audio', ext);
}
