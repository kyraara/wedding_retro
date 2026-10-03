/**
 * Konten undangan yang sedang aktif.
 *
 * Nilainya diisi saat aplikasi dibuka (lihat `loadContent()` di `src/lib/content.ts`):
 * dari Supabase jika dikonfigurasi, atau dari browser (mode demo lokal), dengan
 * `defaultContent` sebagai cadangan. Edit konten lewat panel admin → tab Konten.
 */

import { defaultContent } from './defaultContent';
import type { WeddingContent } from './types';

export type { WeddingContent } from './types';

export const weddingConfig: WeddingContent = structuredClone(defaultContent);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Gabungkan konten tersimpan ke atas default: field baru yang belum ada di data lama
 * tetap terisi default, sedangkan array (galeri, acara, dll.) memakai versi tersimpan.
 */
export function mergeContent<T>(base: T, saved: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(saved)) {
    return (saved === undefined || saved === null ? base : saved) as T;
  }
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(saved)) {
    if (!(key in base)) continue; // abaikan field usang
    const baseValue = (base as Record<string, unknown>)[key];
    result[key] = isPlainObject(baseValue) ? mergeContent(baseValue, value) : (value ?? baseValue);
  }
  return result as T;
}

/** Ganti isi konten aktif (dipanggil sebelum aplikasi dirender). */
export function applyContent(content: WeddingContent): void {
  Object.assign(weddingConfig, structuredClone(content));
}
