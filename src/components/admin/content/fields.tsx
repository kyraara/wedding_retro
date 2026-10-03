import React, { useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { canUploadLargeMedia, MAX_AUDIO_MB, MAX_VIDEO_MB, uploadImage, uploadMediaFile } from '../../../lib/media';
import { VideoPlayer, toEmbedUrl } from '../../ui/VideoPlayer';
import { btnSecondary, iconBtn, inputCls, labelCls } from '../ui';

const hintCls = "block font-['Work_Sans'] text-[11px] text-[#6B6156] mt-1 leading-snug";

export const Field: React.FC<{ label: string; hint?: string; htmlFor?: string; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  htmlFor,
  children,
  className = '',
}) => (
  <div className={className}>
    <label htmlFor={htmlFor} className={labelCls}>
      {label}
    </label>
    {children}
    {hint && <span className={hintCls}>{hint}</span>}
  </div>
);

export const TextInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
  className?: string;
  required?: boolean;
}> = ({ label, value, onChange, placeholder, hint, multiline, rows = 3, type = 'text', className, required }) => {
  const id = useId();
  return (
    <Field label={required ? `${label} *` : label} hint={hint} htmlFor={id} className={className}>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
      )}
    </Field>
  );
};

/** Daftar teks satu baris per item (misal daftar nama di kredit penutup). */
export const LinesInput: React.FC<{ label: string; value: string[]; onChange: (v: string[]) => void; hint?: string }> = ({
  label,
  value,
  onChange,
  hint,
}) => {
  const id = useId();
  return (
    <Field label={label} hint={hint ?? 'Satu nama per baris.'} htmlFor={id}>
      <textarea
        id={id}
        rows={Math.max(3, value.length + 1)}
        value={value.join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n'))}
        onBlur={() => onChange(value.map((v) => v.trim()).filter(Boolean))}
        className={inputCls}
      />
    </Field>
  );
};

export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }> = ({
  label,
  checked,
  onChange,
  hint,
}) => (
  <label className="flex items-start gap-3 cursor-pointer py-1">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
    <span
      aria-hidden="true"
      className="mt-0.5 relative w-10 h-6 shrink-0 border-2 border-[#171412] bg-[#EFE5D0] transition-colors peer-checked:bg-[#3C6966] peer-focus-visible:ring-2 peer-focus-visible:ring-[#B4392B] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-[#171412] after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-[#F6EFE1]"
    />
    <span>
      <span className="font-['Courier_Prime'] text-xs uppercase tracking-wider font-bold text-[#171412]">{label}</span>
      {hint && <span className={hintCls}>{hint}</span>}
    </span>
  </label>
);

function useUpload() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload gagal');
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

/** Foto: pratinjau, unggah (otomatis dikompres), tempel URL, atau hapus. */
export const ImageInput: React.FC<{
  label: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  /** Dipanggil dengan file asli setelah upload berhasil (misal untuk membuat og:image). */
  onFileUploaded?: (file: File) => Promise<void> | void;
  aspect?: string;
}> = ({ label, value, onChange, hint, onFileUploaded, aspect = 'aspect-[4/3]' }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showUrl, setShowUrl] = useState(false);
  const { busy, error, run } = useUpload();

  const handleFile = (file: File) =>
    run(async () => {
      onChange(await uploadImage(file));
      await onFileUploaded?.(file);
    });

  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-3 items-start">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={`relative w-28 sm:w-32 shrink-0 ${aspect} border-2 border-dashed border-[#171412] bg-[#EFE5D0] overflow-hidden cursor-pointer group`}
          aria-label={value ? `Ganti ${label}` : `Unggah ${label}`}
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center text-[#6B6156]">
              <ImagePlus className="w-6 h-6" />
              <span className="font-['Courier_Prime'] text-[10px] uppercase mt-1">Unggah</span>
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-[#171412]/60">
              <Loader2 className="w-6 h-6 text-[#F6EFE1] animate-spin" />
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={btnSecondary}>
              <Upload className="w-3.5 h-3.5" /> {value ? 'Ganti' : 'Unggah'}
            </button>
            <button
              type="button"
              onClick={() => setShowUrl((v) => !v)}
              className={iconBtn}
              title="Tempel URL gambar"
              aria-label="Tempel URL gambar"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className={iconBtn}
                title="Hapus gambar"
                aria-label={`Hapus ${label}`}
              >
                <X className="w-3.5 h-3.5 text-[#B4392B]" />
              </button>
            )}
          </div>
          {showUrl && (
            <input
              type="url"
              value={value.startsWith('data:') ? '' : value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              aria-label={`URL ${label}`}
              className={inputCls}
            />
          )}
          {error && <p role="alert" className="font-['Courier_Prime'] text-[11px] text-[#B4392B] font-bold">{error}</p>}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </Field>
  );
};

/** Video atau musik: tempel link (YouTube/Vimeo/URL file) atau unggah file. */
export const MediaInput: React.FC<{
  label: string;
  kind: 'video' | 'audio';
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  /** Hanya file video langsung (tolak link YouTube/Vimeo). */
  fileOnly?: boolean;
  maxMb?: number;
}> = ({ label, kind, value, onChange, hint, fileOnly, maxMb: maxMbProp }) => {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, error, run } = useUpload();
  const maxMb = maxMbProp ?? (kind === 'video' ? MAX_VIDEO_MB : MAX_AUDIO_MB);
  const embedRejected = fileOnly && !!value.trim() && toEmbedUrl(value) !== null;

  const uploadHint = canUploadLargeMedia
    ? `Unggah file (maks ${maxMb} MB) atau tempel link.`
    : 'Mode demo lokal: tempel link saja (upload file butuh Supabase).';

  return (
    <Field label={label} hint={hint ? `${hint} ${uploadHint}` : uploadHint} htmlFor={id}>
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={kind === 'audio' ? 'https://.../lagu.mp3' : fileOnly ? 'https://.../video.mp4' : 'https://youtube.com/watch?v=...'}
          className={inputCls}
        />
        {canUploadLargeMedia && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={btnSecondary}
            aria-label={`Unggah ${kind === 'video' ? 'video' : 'musik'}`}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          </button>
        )}
        {value && (
          <button type="button" onClick={() => onChange('')} className={`${iconBtn} h-auto`} aria-label={`Hapus ${label}`}>
            <X className="w-3.5 h-3.5 text-[#B4392B]" />
          </button>
        )}
      </div>
      {busy && <p className="font-['Courier_Prime'] text-[11px] text-[#3C6966] mt-1">Mengunggah… jangan tutup halaman.</p>}
      {error && <p role="alert" className="font-['Courier_Prime'] text-[11px] text-[#B4392B] font-bold mt-1">{error}</p>}
      {embedRejected && (
        <p role="alert" className="font-['Courier_Prime'] text-[11px] text-[#B4392B] font-bold mt-1">
          Link YouTube/Vimeo tidak bisa dipakai di sini. Unggah file MP4 atau tempel link langsung ke file .mp4.
        </p>
      )}
      {value.trim() && !busy && !embedRejected && (
        <div className="mt-2 max-w-sm border-2 border-[#171412]">
          {kind === 'video' ? (
            <VideoPlayer url={value} title={label} />
          ) : (
            <audio src={value} controls preload="none" className="w-full block" />
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={kind === 'video' ? 'video/*' : 'audio/*'}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) run(async () => onChange(await uploadMediaFile(file, kind, maxMbProp)));
          e.target.value = '';
        }}
      />
    </Field>
  );
};

/** Daftar item yang bisa ditambah, dihapus, dan diurutkan. */
export function ListEditor<T>({
  items,
  onChange,
  create,
  renderItem,
  itemTitle,
  addLabel,
  min = 0,
  extraActions,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  renderItem: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  itemTitle: (item: T, index: number) => string;
  addLabel: string;
  min?: number;
  extraActions?: React.ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={(item as { id?: string }).id ?? i} className="border-2 border-[#171412] bg-[#EFE5D0] p-4">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#171412]/20">
            <span className="font-['Courier_Prime'] text-xs uppercase tracking-wider font-bold text-[#B4392B] truncate">
              {itemTitle(item, i)}
            </span>
            <div className="flex gap-1 shrink-0">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className={iconBtn} aria-label="Naikkan">
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === items.length - 1}
                className={iconBtn}
                aria-label="Turunkan"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                disabled={items.length <= min}
                className={iconBtn}
                aria-label="Hapus"
                title={items.length <= min ? `Minimal ${min} item` : 'Hapus'}
              >
                <Trash2 className="w-3.5 h-3.5 text-[#B4392B]" />
              </button>
            </div>
          </div>
          {renderItem(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))), i)}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange([...items, create()])} className={btnSecondary}>
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
        {extraActions}
      </div>
    </div>
  );
}

/** Unggah banyak foto sekaligus. */
export const BulkImageUpload: React.FC<{ onUploaded: (urls: string[]) => void }> = ({ onUploaded }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const handleFiles = async (files: File[]) => {
    setError('');
    setProgress({ done: 0, total: files.length });
    const urls: string[] = [];
    for (const file of files) {
      try {
        urls.push(await uploadImage(file));
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : 'gagal'}`);
      }
      setProgress({ done: urls.length, total: files.length });
    }
    setProgress(null);
    if (urls.length) onUploaded(urls);
  };

  return (
    <>
      <button type="button" onClick={() => fileRef.current?.click()} disabled={!!progress} className={btnSecondary}>
        {progress ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {progress.done}/{progress.total}
          </>
        ) : (
          <>
            <ImagePlus className="w-3.5 h-3.5" /> Unggah banyak foto
          </>
        )}
      </button>
      {error && <span role="alert" className="font-['Courier_Prime'] text-[11px] text-[#B4392B] font-bold self-center">{error}</span>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) handleFiles(files);
          e.target.value = '';
        }}
      />
    </>
  );
};

/** Daftar warna (palet dress code). */
export const ColorListInput: React.FC<{ label: string; value: string[]; onChange: (v: string[]) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <Field label={label} hint="Klik kotak untuk memilih warna.">
    <div className="flex flex-wrap items-center gap-2">
      {value.map((color, i) => (
        <span key={i} className="relative inline-flex">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(value.map((c, j) => (j === i ? e.target.value : c)))}
            className="w-10 h-10 border-2 border-[#171412] cursor-pointer bg-transparent p-0"
            aria-label={`Warna ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#171412] text-[#F6EFE1] text-[10px] leading-none cursor-pointer"
            aria-label={`Hapus warna ${i + 1}`}
          >
            ✕
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, '#8C8274'])}
        className={`${iconBtn} w-10 h-10`}
        aria-label="Tambah warna"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  </Field>
);
