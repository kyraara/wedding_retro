import React, { useMemo, useRef, useState } from 'react';
import { Copy, Download, ExternalLink, FileUp, Link2, Pencil, Plus, RefreshCw, Send, ShieldAlert, Trash2, X } from 'lucide-react';
import { Guest, RSVP } from '../../types/wedding';
import { store } from '../../lib/store';
import { copyText, downloadCsv, parseCsv } from '../../lib/files';
import { GUEST_CODE_SUFFIX_LENGTH, isWeakGuestCode, randomToken } from '../../lib/ticket';
import {
  buildInviteUrl,
  buildWhatsAppLink,
  buildWhatsAppMessage,
  coupleNames,
  displayGuestName,
  formatDateTimeLocal,
  slugify,
} from '../../lib/wedding';
import type { AdminData } from '../../pages/AdminPage';
import {
  ATTENDANCE_LABEL,
  ConfirmButton,
  RsvpBadge,
  btnPrimary,
  btnSecondary,
  iconBtn,
  inputCls,
  labelCls,
  panelCls,
} from './ui';

const SALUTATIONS = ['Bapak', 'Ibu', 'Bapak/Ibu', 'Saudara', 'Saudari', 'Saudara/i', 'Om & Tante', 'Rekan-rekan'];

type StatusFilter = 'semua' | 'belum_dikirim' | 'belum_dibuka' | 'belum_konfirmasi' | 'hadir' | 'tidak_hadir' | 'ragu';

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'semua', label: 'Semua' },
  { id: 'belum_dikirim', label: 'Belum dikirim' },
  { id: 'belum_dibuka', label: 'Belum dibuka' },
  { id: 'belum_konfirmasi', label: 'Belum konfirmasi' },
  { id: 'hadir', label: 'Hadir' },
  { id: 'tidak_hadir', label: 'Tidak hadir' },
  { id: 'ragu', label: 'Ragu' },
];

interface FormState {
  id?: string;
  name: string;
  salutation: string;
  groupName: string;
  phone: string;
  maxPax: number;
}

const EMPTY_FORM: FormState = { name: '', salutation: '', groupName: '', phone: '', maxPax: 2 };

/**
 * Buat kode link dari nama + akhiran acak, misal "budi-santoso-k7m2x9qa".
 * Akhiran acak mencegah orang menebak link (dan RSVP) tamu lain.
 */
function uniqueCode(name: string, taken: Set<string>): string {
  const base = (slugify(name) || 'tamu').slice(0, 40).replace(/-+$/, '');
  let code: string;
  do {
    code = `${base}-${randomToken(GUEST_CODE_SUFFIX_LENGTH)}`;
  } while (taken.has(code));
  taken.add(code);
  return code;
}

/** Petakan header CSV ke field tamu. */
const HEADER_ALIASES: Record<keyof Omit<FormState, 'id'>, string[]> = {
  name: ['nama', 'name', 'nama tamu', 'nama lengkap'],
  salutation: ['sapaan', 'salutation', 'panggilan'],
  groupName: ['kategori', 'grup', 'group', 'kelompok'],
  phone: ['telepon', 'no telepon', 'no hp', 'hp', 'wa', 'whatsapp', 'phone', 'nomor'],
  maxPax: ['maxpax', 'max pax', 'pax', 'kursi', 'jumlah kursi', 'maks kursi'],
};

interface GuestsTabProps {
  data: AdminData;
  reload: () => Promise<void>;
  toast: (msg: string) => void;
}

export const GuestsTab: React.FC<GuestsTabProps> = ({ data, reload, toast }) => {
  const { guests, rsvps } = data;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('semua');
  const [importResult, setImportResult] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const rsvpByCode = useMemo(() => {
    const map = new Map<string, RSVP>();
    for (const r of rsvps) if (r.guestCode) map.set(r.guestCode.toLowerCase(), r);
    return map;
  }, [rsvps]);

  const weakGuests = useMemo(() => guests.filter((g) => isWeakGuestCode(g.code)), [guests]);
  const [regenerating, setRegenerating] = useState(false);

  const groups = useMemo(
    () => Array.from(new Set(guests.map((g) => g.groupName).filter(Boolean) as string[])).sort(),
    [guests]
  );

  const filtered = guests.filter((g) => {
    const q = search.trim().toLowerCase();
    if (q && ![g.name, g.code, g.groupName ?? '', g.phone ?? ''].some((v) => v.toLowerCase().includes(q))) return false;
    const rsvp = rsvpByCode.get(g.code.toLowerCase());
    switch (filter) {
      case 'belum_dikirim':
        return !g.sentAt;
      case 'belum_dibuka':
        return g.openCount === 0;
      case 'belum_konfirmasi':
        return !rsvp;
      case 'hadir':
      case 'tidak_hadir':
      case 'ragu':
        return rsvp?.attendance === filter;
      default:
        return true;
    }
  });

  // --- Tambah / edit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const existing = form.id ? guests.find((g) => g.id === form.id) : undefined;
    const taken = new Set(guests.filter((g) => g.id !== form.id).map((g) => g.code));
    const guest: Guest = {
      ...existing,
      id: existing?.id ?? 'g-' + Date.now(),
      // Kode tamu lama tidak diubah agar link yang sudah dikirim tetap berlaku.
      code: existing?.code ?? uniqueCode(name, taken),
      name,
      salutation: form.salutation.trim() || undefined,
      groupName: form.groupName.trim() || undefined,
      phone: form.phone.trim(),
      maxPax: Math.max(1, Math.min(20, Number(form.maxPax) || 1)),
      openCount: existing?.openCount ?? 0,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    await store.saveGuest(guest);
    await reload();
    setForm(EMPTY_FORM);
    toast(existing ? 'Data tamu diperbarui' : `Tamu ditambahkan: ?to=${guest.code}`);
  };

  const startEdit = (g: Guest) => {
    setForm({
      id: g.id,
      name: g.name,
      salutation: g.salutation ?? '',
      groupName: g.groupName ?? '',
      phone: g.phone ?? '',
      maxPax: g.maxPax,
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (id: string) => {
    await store.deleteGuest(id);
    await reload();
    toast('Tamu dihapus');
  };

  // --- Kode link lama ---
  const handleRegenerateCodes = async () => {
    setRegenerating(true);
    const taken = new Set(guests.map((g) => g.code));
    let done = 0;
    try {
      for (const g of weakGuests) {
        await store.changeGuestCode(g.id, uniqueCode(g.name, taken));
        done++;
      }
      toast(`${done} kode link dibuat ulang. Kirim ulang undangannya ke tamu.`);
    } catch (err) {
      console.error(err);
      toast(`Gagal setelah ${done} kode. Coba lagi untuk sisanya.`);
    } finally {
      await reload();
      setRegenerating(false);
    }
  };

  // --- Kirim & salin ---
  const handleSendWa = async (g: Guest) => {
    window.open(buildWhatsAppLink(g), '_blank', 'noopener');
    await store.markSent(g.id);
    await reload();
  };

  const handleCopyLink = async (g: Guest) => {
    if (await copyText(buildInviteUrl(g.code))) toast('Link undangan disalin');
  };

  const handleCopyMessage = async (g: Guest) => {
    if (await copyText(buildWhatsAppMessage(g))) {
      await store.markSent(g.id);
      await reload();
      toast('Pesan undangan disalin');
    }
  };

  // --- Import & ekspor ---
  const handleImport = async (file: File) => {
    const rows = parseCsv(await file.text());
    if (rows.length === 0) {
      setImportResult('File kosong atau tidak terbaca.');
      return;
    }

    const header = rows[0].map((h) => h.trim().toLowerCase());
    const hasHeader = header.some((h) => HEADER_ALIASES.name.includes(h));
    const colIndex = (field: keyof typeof HEADER_ALIASES, fallback: number) => {
      if (!hasHeader) return fallback;
      return header.findIndex((h) => HEADER_ALIASES[field].includes(h));
    };
    const idx = {
      name: colIndex('name', 0),
      salutation: colIndex('salutation', 1),
      groupName: colIndex('groupName', 2),
      phone: colIndex('phone', 3),
      maxPax: colIndex('maxPax', 4),
    };
    const cell = (row: string[], i: number) => (i >= 0 ? (row[i] ?? '').trim() : '');

    const existingNames = new Set(guests.map((g) => g.name.trim().toLowerCase()));
    const taken = new Set(guests.map((g) => g.code));
    const now = Date.now();
    const toAdd: Guest[] = [];
    let skipped = 0;

    (hasHeader ? rows.slice(1) : rows).forEach((row, i) => {
      const name = cell(row, idx.name);
      if (!name || existingNames.has(name.toLowerCase())) {
        skipped++;
        return;
      }
      existingNames.add(name.toLowerCase());
      toAdd.push({
        id: `g-${now}-${i}`,
        code: uniqueCode(name, taken),
        name,
        salutation: cell(row, idx.salutation) || undefined,
        groupName: cell(row, idx.groupName) || undefined,
        phone: cell(row, idx.phone),
        maxPax: Math.max(1, Math.min(20, parseInt(cell(row, idx.maxPax), 10) || 2)),
        openCount: 0,
        createdAt: new Date().toISOString(),
      });
    });

    if (toAdd.length) {
      await store.saveGuests(toAdd);
      await reload();
    }
    setImportResult(
      `${toAdd.length} tamu berhasil diimpor` + (skipped ? `, ${skipped} baris dilewati (kosong / nama sudah ada).` : '.')
    );
  };

  const downloadTemplate = () =>
    downloadCsv('template-import-tamu.csv', ['Nama', 'Sapaan', 'Kategori', 'Telepon', 'MaxPax'], [
      ['Budi Santoso & Keluarga', 'Bapak', 'Rekan Kerja', '081234567890', 3],
      ['Rina Amelia', 'Saudari', 'Sahabat', '085712345678', 2],
    ]);

  const exportGuests = () => {
    const slug = slugify(coupleNames);
    downloadCsv(
      `rekap-tamu-${slug}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Nama', 'Sapaan', 'Kategori', 'Telepon', 'Max Pax', 'Link Undangan', 'Dikirim', 'Dibuka (x)', 'Status RSVP', 'Pax Hadir', 'Check-in'],
      guests.map((g) => {
        const r = rsvpByCode.get(g.code.toLowerCase());
        return [
          g.name,
          g.salutation ?? '',
          g.groupName ?? '',
          g.phone ?? '',
          g.maxPax,
          buildInviteUrl(g.code),
          g.sentAt ? formatDateTimeLocal(g.sentAt) : '',
          g.openCount,
          r ? ATTENDANCE_LABEL[r.attendance] : 'Belum Konfirmasi',
          r?.pax ?? 0,
          r?.checkedInAt ? formatDateTimeLocal(r.checkedInAt) : '',
        ];
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Form tambah / edit */}
      <div ref={formRef} className={`${panelCls} scroll-mt-24`}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#B4392B] font-bold">
            {form.id ? '✎ Edit data tamu' : '+ Tambah tamu baru'}
          </span>
          {form.id && (
            <button
              onClick={() => setForm(EMPTY_FORM)}
              className="inline-flex items-center gap-1 font-['Courier_Prime'] text-[11px] uppercase text-[#4A413A] hover:text-[#B4392B] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Batal edit
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
            <label htmlFor="g-name" className={labelCls}>
              Nama tamu *
            </label>
            <input
              id="g-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Misal: Gunawan & Istri"
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="g-sal" className={labelCls}>
              Sapaan
            </label>
            <input
              id="g-sal"
              list="salutation-options"
              value={form.salutation}
              onChange={(e) => setForm({ ...form, salutation: e.target.value })}
              placeholder="Bapak"
              className={inputCls}
            />
            <datalist id="salutation-options">
              {SALUTATIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="g-group" className={labelCls}>
              Kategori
            </label>
            <input
              id="g-group"
              list="group-options"
              value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
              placeholder="Keluarga"
              className={inputCls}
            />
            <datalist id="group-options">
              {groups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="g-phone" className={labelCls}>
              No. WhatsApp
            </label>
            <input
              id="g-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="0812..."
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="g-pax" className={labelCls}>
              Kursi
            </label>
            <input
              id="g-pax"
              type="number"
              min={1}
              max={20}
              value={form.maxPax}
              onChange={(e) => setForm({ ...form, maxPax: Number(e.target.value) })}
              className={inputCls}
            />
          </div>
          <div className="sm:col-span-1">
            <button type="submit" className={`${btnPrimary} w-full`} aria-label={form.id ? 'Simpan perubahan' : 'Tambah tamu'}>
              {form.id ? 'Simpan' : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* Peringatan kode link lama */}
      {weakGuests.length > 0 && (
        <div role="alert" className={`${panelCls} border-[#B4392B] flex flex-col sm:flex-row sm:items-center gap-3`}>
          <ShieldAlert className="w-5 h-5 text-[#B4392B] shrink-0" />
          <div className="flex-1 font-['Work_Sans'] text-xs text-[#4A413A]">
            <span className="block font-['Courier_Prime'] uppercase tracking-wider text-[#B4392B] font-bold">
              {weakGuests.length} tamu memakai kode link lama yang mudah ditebak
            </span>
            Buat ulang agar RSVP tamu tidak bisa dilihat / diubah orang lain. Link & QR tiket lama tidak berlaku lagi,
            status "dikirim" di-reset, jadi undangan perlu dikirim ulang. RSVP yang sudah masuk tetap tersimpan.
          </div>
          {regenerating ? (
            <span className={`${btnSecondary} opacity-60`}>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memproses...
            </span>
          ) : (
            <ConfirmButton onConfirm={handleRegenerateCodes} className={btnPrimary} confirmLabel="Klik lagi untuk yakin">
              <RefreshCw className="w-3.5 h-3.5" /> Buat ulang kode
            </ConfirmButton>
          )}
        </div>
      )}

      {/* Import */}
      <div className={`${panelCls} flex flex-col sm:flex-row sm:items-center gap-3`}>
        <div className="flex-1">
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold block">
            Import tamu massal (CSV / Excel)
          </span>
          <span className="font-['Work_Sans'] text-xs text-[#4A413A]">
            Kolom: Nama, Sapaan, Kategori, Telepon, MaxPax. Simpan dari Excel sebagai CSV.
          </span>
          {importResult && (
            <span role="status" className="block font-['Courier_Prime'] text-xs text-[#3C6966] font-bold mt-1">
              {importResult}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className={btnSecondary}>
            <Download className="w-3.5 h-3.5" /> Template
          </button>
          <button onClick={() => fileRef.current?.click()} className={btnPrimary}>
            <FileUp className="w-3.5 h-3.5" /> Pilih file CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Filter & ekspor */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <input
          type="search"
          aria-label="Cari tamu"
          placeholder="Cari nama, kode, kategori, nomor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} lg:w-72`}
        />
        <div className="flex flex-wrap gap-1.5 flex-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`px-2.5 py-1 border border-[#171412] font-['Courier_Prime'] text-[11px] uppercase tracking-wider cursor-pointer ${
                filter === f.id ? 'bg-[#171412] text-[#F6EFE1]' : 'bg-[#EFE5D0] text-[#171412] hover:bg-[#E3D5B8]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={exportGuests} className={btnSecondary}>
          <Download className="w-3.5 h-3.5" /> Ekspor CSV
        </button>
      </div>

      {/* Tabel tamu */}
      <div className="border-2 border-[#171412] bg-[#EFE5D0] overflow-x-auto shadow-[4px_4px_0px_#171412]">
        <table className="w-full min-w-[860px] text-left border-collapse text-xs font-['Work_Sans']">
          <thead>
            <tr className="bg-[#171412] text-[#F6EFE1] font-['Courier_Prime'] uppercase tracking-wider text-[11px]">
              <th className="p-3">Nama tamu</th>
              <th className="p-3">Link</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Dikirim / Dibuka</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171412]/20">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center font-['Courier_Prime'] text-[#4A413A]">
                  Tidak ada tamu yang cocok.
                </td>
              </tr>
            )}
            {filtered.map((g) => {
              const rsvp = rsvpByCode.get(g.code.toLowerCase());
              return (
                <tr key={g.id} className="hover:bg-[#E3D5B8]/60 align-top">
                  <td className="p-3">
                    <span className="font-semibold text-[#171412] block">{displayGuestName(g.name, g.salutation)}</span>
                    <span className="text-[11px] text-[#4A413A] font-['Courier_Prime']">
                      {g.phone || 'tanpa nomor'} · maks {g.maxPax} kursi
                    </span>
                  </td>
                  <td className="p-3 font-['Courier_Prime'] text-[#4A413A]">
                    <button
                      onClick={() => handleCopyLink(g)}
                      className="inline-flex items-center gap-1 hover:text-[#B4392B] underline cursor-pointer"
                      title="Salin link undangan"
                    >
                      <Link2 className="w-3 h-3" />?to={g.code}
                    </button>
                  </td>
                  <td className="p-3 font-['Courier_Prime'] text-[11px] uppercase text-[#4A413A]">
                    {g.groupName || 'Umum'}
                  </td>
                  <td className="p-3 font-['Courier_Prime'] text-[11px] text-[#4A413A]">
                    <span className="block">{g.sentAt ? `✓ ${formatDateTimeLocal(g.sentAt)}` : '— belum dikirim'}</span>
                    <span className={`block ${g.openCount ? 'text-[#3C6966] font-bold' : ''}`}>
                      {g.openCount ? `👁 dibuka ${g.openCount}x` : 'belum dibuka'}
                    </span>
                  </td>
                  <td className="p-3">
                    <RsvpBadge rsvp={rsvp} />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleSendWa(g)}
                        className={`${iconBtn} hover:bg-[#3C6966]!`}
                        title="Kirim via WhatsApp"
                        aria-label={`Kirim undangan ke ${g.name} via WhatsApp`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyMessage(g)}
                        className={iconBtn}
                        title="Salin teks undangan"
                        aria-label={`Salin teks undangan untuk ${g.name}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`${buildInviteUrl(g.code)}&nt=1`}
                        target="_blank"
                        rel="noreferrer"
                        className={iconBtn}
                        title="Pratinjau undangan"
                        aria-label={`Pratinjau undangan ${g.name}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => startEdit(g)}
                        className={iconBtn}
                        title="Edit tamu"
                        aria-label={`Edit ${g.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <ConfirmButton onConfirm={() => handleDelete(g.id)} title="Hapus tamu" confirmLabel="Hapus?">
                        <Trash2 className="w-3.5 h-3.5 text-[#B4392B]" />
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="font-['Courier_Prime'] text-[11px] text-[#4A413A]">
        Menampilkan {filtered.length} dari {guests.length} tamu.
      </p>
    </div>
  );
};
