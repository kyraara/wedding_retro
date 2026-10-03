import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Save, Undo2 } from 'lucide-react';
import type { WeddingContent } from '../../../content/types';
import { cloneActiveContent, resetContent, saveContent } from '../../../lib/content';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { ConfirmButton, btnPrimary, btnSecondary, panelCls } from '../ui';
import {
  CoupleSection,
  CreditsSection,
  DressCodeSection,
  EnvelopeSection,
  EventsSection,
  GallerySection,
  GeneralSection,
  MusicSection,
  PostEventSection,
  SectionProps,
  SettingsSection,
  StorySection,
  VideoSection,
} from './sections';

const SECTIONS: Array<{ id: string; label: string; component: React.FC<SectionProps> }> = [
  { id: 'mempelai', label: 'Mempelai', component: CoupleSection },
  { id: 'acara', label: 'Acara & Tanggal', component: EventsSection },
  { id: 'umum', label: 'Poster & Umum', component: GeneralSection },
  { id: 'kisah', label: 'Kisah', component: StorySection },
  { id: 'galeri', label: 'Galeri Foto', component: GallerySection },
  { id: 'video', label: 'Video', component: VideoSection },
  { id: 'amplop', label: 'Amplop Digital', component: EnvelopeSection },
  { id: 'dresscode', label: 'Dress Code', component: DressCodeSection },
  { id: 'musik', label: 'Musik', component: MusicSection },
  { id: 'kredit', label: 'Kredit Penutup', component: CreditsSection },
  { id: 'pasca', label: 'Setelah Acara', component: PostEventSection },
  { id: 'pengaturan', label: 'Pengaturan', component: SettingsSection },
];

/** Cek isian wajib sebelum disimpan. */
function validate(c: WeddingContent): string | null {
  if (!c.couple.groom.callname.trim() || !c.couple.bride.callname.trim()) {
    return 'Nama panggilan kedua mempelai wajib diisi (bagian Mempelai).';
  }
  if (c.events.length === 0) return 'Minimal harus ada satu acara (bagian Acara & Tanggal).';
  for (const e of c.events) {
    const label = e.title || 'tanpa judul';
    if (!e.title.trim()) return 'Setiap acara harus punya judul.';
    if (!e.dateISO || !e.endISO) return `Tanggal & jam acara "${label}" belum lengkap.`;
    if (new Date(e.endISO) <= new Date(e.dateISO)) return `Jam selesai acara "${label}" harus setelah jam mulai.`;
    if (!e.venue.trim()) return `Nama tempat acara "${label}" wajib diisi.`;
  }
  return null;
}

function readSectionFromHash(): string {
  const id = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('s');
  return SECTIONS.some((s) => s.id === id) ? id! : SECTIONS[0].id;
}

interface ContentTabProps {
  toast: (msg: string) => void;
  onDirtyChange: (dirty: boolean) => void;
  onResetData: () => Promise<void>;
}

export const ContentTab: React.FC<ContentTabProps> = ({ toast, onDirtyChange, onResetData }) => {
  const [original, setOriginal] = useState(() => JSON.stringify(cloneActiveContent()));
  const [draft, setDraft] = useState<WeddingContent>(() => cloneActiveContent());
  const [section, setSection] = useState(readSectionFromHash);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dirty = useMemo(() => JSON.stringify(draft) !== original, [draft, original]);

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  // Peringatkan sebelum menutup halaman jika ada perubahan belum disimpan.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const update = (fn: (d: WeddingContent) => void) =>
    setDraft((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const goSection = (id: string) => {
    setSection(id);
    history.replaceState(null, '', `#/admin?tab=konten&s=${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    const problem = validate(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await saveContent(draft);
      setOriginal(JSON.stringify(draft));
      toast('Konten tersimpan. Memuat ulang…');
      // Muat ulang agar seluruh tampilan (termasuk tanggal turunan) memakai konten baru.
      setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan konten.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetContent = async () => {
    try {
      await resetContent();
      toast('Konten dikembalikan ke template awal. Memuat ulang…');
      setTimeout(() => window.location.reload(), 700);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mereset konten.');
    }
  };

  const Active = SECTIONS.find((s) => s.id === section)!.component;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[13rem_1fr] gap-6 pb-24">
      {/* Navigasi bagian */}
      <nav aria-label="Bagian konten" className="lg:sticky lg:top-24 self-start">
        <ul className="flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <button
                onClick={() => goSection(s.id)}
                aria-current={section === s.id ? 'page' : undefined}
                className={`w-full text-left px-3 py-2 border-2 border-[#171412] font-['Courier_Prime'] text-xs uppercase tracking-wider font-bold cursor-pointer whitespace-nowrap ${
                  section === s.id ? 'bg-[#171412] text-[#F6EFE1]' : 'bg-[#EFE5D0] text-[#171412] hover:bg-[#E3D5B8]'
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-6">
        <div className={panelCls}>
          <Active draft={draft} update={update} />
        </div>

        {section === 'pengaturan' && (
          <div className="border-2 border-[#B4392B] bg-[#EFE5D0] p-4 sm:p-5 space-y-4">
            <h3 className="font-['Anton'] text-xl uppercase text-[#B4392B]">Zona berbahaya</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="font-['Work_Sans'] text-sm text-[#4A413A]">
                Kembalikan semua konten (teks, foto, tanggal) ke template demo awal.
              </p>
              <ConfirmButton
                onConfirm={handleResetContent}
                confirmLabel="Klik lagi untuk reset konten"
                className={btnSecondary}
              >
                Reset konten
              </ConfirmButton>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="font-['Work_Sans'] text-sm text-[#4A413A]">
                {isSupabaseConfigured
                  ? 'Hapus SEMUA data tamu, RSVP, check-in, dan ucapan. Gunakan saat memulai client baru. Tidak bisa dibatalkan.'
                  : 'Kembalikan data tamu, RSVP, dan ucapan ke data contoh demo.'}
              </p>
              <ConfirmButton
                onConfirm={onResetData}
                confirmLabel={isSupabaseConfigured ? 'Klik lagi untuk HAPUS semua' : 'Klik lagi untuk reset data'}
                className={btnSecondary}
              >
                {isSupabaseConfigured ? 'Hapus semua data' : 'Reset data demo'}
              </ConfirmButton>
            </div>
          </div>
        )}
      </div>

      {/* Bar simpan */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t-2 border-[#171412] bg-[#E3D5B8]/95 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <span
            className={`font-['Courier_Prime'] text-xs uppercase tracking-wider font-bold ${dirty ? 'text-[#B4392B]' : 'text-[#3C6966]'}`}
            aria-live="polite"
          >
            {dirty ? '● Ada perubahan belum disimpan' : '✓ Semua perubahan tersimpan'}
          </span>
          {error && (
            <span role="alert" className="font-['Courier_Prime'] text-xs text-[#B4392B] font-bold basis-full sm:basis-auto">
              {error}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <a href={window.location.pathname} target="_blank" rel="noreferrer" className={btnSecondary}>
              <ExternalLink className="w-3.5 h-3.5" /> Lihat undangan
            </a>
            {dirty && (
              <button
                onClick={() => {
                  setDraft(JSON.parse(original));
                  setError('');
                }}
                className={btnSecondary}
              >
                <Undo2 className="w-3.5 h-3.5" /> Batalkan
              </button>
            )}
            <button onClick={handleSave} disabled={!dirty || saving} className={btnPrimary}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
