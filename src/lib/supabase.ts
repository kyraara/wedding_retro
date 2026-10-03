import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Toleran terhadap URL yang disalin lengkap dengan "/rest/v1/" atau garis miring di akhir. */
const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  .replace(/\/+$/, '')
  .replace(/\/rest\/v1$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/**
 * Klien Supabase, atau `null` jika env belum diisi.
 * Tanpa Supabase, aplikasi berjalan dalam mode demo lokal (data di browser).
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

export const isSupabaseConfigured = supabase !== null;

/** Nama bucket Supabase Storage untuk foto, video, dan musik. */
export const MEDIA_BUCKET = 'media';
