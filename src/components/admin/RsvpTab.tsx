import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Attendance } from '../../types/wedding';
import { downloadCsv } from '../../lib/files';
import { coupleNames, formatDateTimeLocal, slugify } from '../../lib/wedding';
import type { AdminData } from '../../pages/AdminPage';
import { ATTENDANCE_LABEL, RsvpBadge, btnSecondary, inputCls } from './ui';

type Filter = 'semua' | Attendance;

export const RsvpTab: React.FC<{ data: AdminData }> = ({ data }) => {
  const { rsvps, guests } = data;
  const [filter, setFilter] = useState<Filter>('semua');
  const [search, setSearch] = useState('');

  const guestByCode = useMemo(() => new Map(guests.map((g) => [g.code.toLowerCase(), g])), [guests]);

  const sorted = [...rsvps].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const filtered = sorted.filter((r) => {
    if (filter !== 'semua' && r.attendance !== filter) return false;
    const q = search.trim().toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.ticketCode.toLowerCase().includes(q);
  });

  const countOf = (a: Attendance) => rsvps.filter((r) => r.attendance === a).length;

  const exportRsvps = () =>
    downloadCsv(
      `rekap-rsvp-${slugify(coupleNames)}-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Nama', 'Status', 'Pax', 'Catatan', 'Kode Tiket', 'Kategori Tamu', 'Terakhir Diperbarui', 'Check-in', 'Pax Datang'],
      sorted.map((r) => {
        const g = r.guestCode ? guestByCode.get(r.guestCode.toLowerCase()) : undefined;
        return [
          r.name,
          ATTENDANCE_LABEL[r.attendance],
          r.pax,
          r.note ?? '',
          r.ticketCode,
          g?.groupName ?? (r.guestCode ? '' : 'Tanpa link personal'),
          formatDateTimeLocal(r.updatedAt),
          r.checkedInAt ? formatDateTimeLocal(r.checkedInAt) : '',
          r.checkedInPax ?? '',
        ];
      })
    );

  const filters: Array<{ id: Filter; label: string }> = [
    { id: 'semua', label: `Semua (${rsvps.length})` },
    { id: 'hadir', label: `Hadir (${countOf('hadir')})` },
    { id: 'tidak_hadir', label: `Tidak hadir (${countOf('tidak_hadir')})` },
    { id: 'ragu', label: `Ragu (${countOf('ragu')})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <input
          type="search"
          aria-label="Cari RSVP"
          placeholder="Cari nama atau kode tiket..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} lg:w-72`}
        />
        <div className="flex flex-wrap gap-1.5 flex-1">
          {filters.map((f) => (
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
        <button onClick={exportRsvps} className={btnSecondary}>
          <Download className="w-3.5 h-3.5" /> Ekspor CSV
        </button>
      </div>

      <div className="border-2 border-[#171412] bg-[#EFE5D0] overflow-x-auto shadow-[4px_4px_0px_#171412]">
        <table className="w-full min-w-[760px] text-left border-collapse text-xs font-['Work_Sans']">
          <thead>
            <tr className="bg-[#171412] text-[#F6EFE1] font-['Courier_Prime'] uppercase tracking-wider text-[11px]">
              <th className="p-3">Nama</th>
              <th className="p-3">Status</th>
              <th className="p-3">Catatan</th>
              <th className="p-3">Tiket</th>
              <th className="p-3">Diperbarui</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171412]/20">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center font-['Courier_Prime'] text-[#4A413A]">
                  Belum ada konfirmasi.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const g = r.guestCode ? guestByCode.get(r.guestCode.toLowerCase()) : undefined;
              return (
                <tr key={r.id} className="align-top hover:bg-[#E3D5B8]/60">
                  <td className="p-3">
                    <span className="font-semibold text-[#171412] block">{r.name}</span>
                    <span className="font-['Courier_Prime'] text-[11px] text-[#4A413A]">
                      {g ? g.groupName || 'Tamu terdaftar' : 'Tanpa link personal'}
                    </span>
                  </td>
                  <td className="p-3">
                    <RsvpBadge rsvp={r} />
                  </td>
                  <td className="p-3 text-[#4A413A] max-w-xs">{r.note || '—'}</td>
                  <td className="p-3 font-['Courier_Prime'] text-[#171412]">{r.ticketCode}</td>
                  <td className="p-3 font-['Courier_Prime'] text-[11px] text-[#4A413A]">
                    {formatDateTimeLocal(r.updatedAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
