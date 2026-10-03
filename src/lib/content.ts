import { applyContent, mergeContent, weddingConfig } from '../content/wedding.config';
import { defaultContent } from '../content/defaultContent';
import type { WeddingContent } from '../content/types';
import { supabase } from './supabase';

const LOCAL_KEY = 'premiere_content';
const CONTENT_ROW_ID = 1;

async function fetchSavedContent(): Promise<unknown> {
  if (supabase) {
    const { data, error } = await supabase
      .from('site_content')
      .select('data')
      .eq('id', CONTENT_ROW_ID)
      .maybeSingle();
    if (error) throw error;
    return data?.data ?? null;
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Muat konten aktif. Dipanggil sekali sebelum aplikasi dirender. */
export async function loadContent(): Promise<void> {
  const saved = await fetchSavedContent();
  applyContent(saved ? mergeContent(defaultContent, saved) : defaultContent);
}

/** Simpan konten dari editor admin. */
export async function saveContent(content: WeddingContent): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('site_content')
      .upsert({ id: CONTENT_ROW_ID, data: content, updated_at: new Date().toISOString() });
    if (error) throw error;
  } else {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(content));
    } catch {
      throw new Error('Penyimpanan browser penuh. Kurangi jumlah/ukuran foto atau gunakan Supabase.');
    }
  }
  applyContent(content);
}

/** Kembalikan konten ke template awal. */
export async function resetContent(): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('site_content').delete().eq('id', CONTENT_ROW_ID);
    if (error) throw error;
  } else {
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      // abaikan
    }
  }
  applyContent(defaultContent);
}

/** Salinan konten aktif untuk diedit tanpa memengaruhi tampilan. */
export function cloneActiveContent(): WeddingContent {
  return structuredClone(weddingConfig);
}
