import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

interface MetaContent {
  couple?: { groom?: { callname?: string }; bride?: { callname?: string } };
  events?: Array<{ dateISO?: string }>;
  city?: string;
  timeZone?: string;
  ogImage?: string;
  posterImage?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Ambil konten dari Supabase (tabel site_content bisa dibaca publik). */
async function fetchContent(url: string, key: string): Promise<MetaContent | null> {
  try {
    const base = url.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '');
    const res = await fetch(`${base}/rest/v1/site_content?id=eq.1&select=data`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ data: MetaContent }>;
    return rows[0]?.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Isi judul & meta preview link (WhatsApp, Facebook, Telegram) di index.html dari konten undangan.
 * Crawler tidak menjalankan JavaScript, jadi meta harus sudah ada di HTML saat build.
 * Setelah mengganti nama/tanggal/poster di admin, lakukan redeploy agar preview ikut berubah.
 */
function invitationMeta(env: Record<string, string>): Plugin {
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');
  let cache: { at: number; html: Record<string, string> } | null = null;

  const buildValues = async () => {
    if (cache && Date.now() - cache.at < 60_000) return cache.html;
    const content =
      env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
        ? await fetchContent(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
        : null;

    const groom = content?.couple?.groom?.callname || 'Dimas';
    const bride = content?.couple?.bride?.callname || 'Laras';
    const couple = `${groom} & ${bride}`;
    const startIso = content?.events?.map((e) => e.dateISO).filter(Boolean).sort()[0] || '2027-03-20T08:00:00+07:00';
    const date = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: content?.timeZone || 'Asia/Jakarta',
    }).format(new Date(startIso));
    const city = content?.city || 'Palembang';
    const remoteImage = [content?.ogImage, content?.posterImage].find((u) => u && /^https?:\/\//.test(u));

    const values = {
      TITLE: `The Premiere · ${couple}`,
      DESCRIPTION: `Undangan pernikahan ${couple} · ${date} · ${city}. Buka undangan untuk melihat jadwal tayang dan mencetak tiket premiere Anda.`,
      OG_DESCRIPTION: `${date} · ${city}. Anda diundang ke pemutaran perdana kisah cinta kami.`,
      OG_IMAGE: remoteImage || `${siteUrl}/og-image.jpg`,
      SITE_URL: siteUrl,
    };
    const html = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, escapeHtml(v)]));
    cache = { at: Date.now(), html };
    return html;
  };

  return {
    name: 'invitation-meta',
    transformIndexHtml: {
      order: 'pre',
      handler: async (html) => {
        const values = await buildValues();
        return html.replace(/%(TITLE|DESCRIPTION|OG_DESCRIPTION|OG_IMAGE|SITE_URL)%/g, (_, k: string) => values[k] ?? '');
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      tailwindcss(),
      invitationMeta(env),
      // `npm run dev:https` → HTTPS dengan sertifikat lokal, agar kamera scanner check-in bisa dipakai dari HP.
      mode === 'https' && basicSsl(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // Set DISABLE_HMR=true untuk mematikan hot reload & file watching.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
