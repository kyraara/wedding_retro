import React, { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Wish } from '../../types/wedding';
import { store } from '../../lib/store';
import { formatDateTimeLocal } from '../../lib/wedding';
import { ConfirmButton, iconBtn } from './ui';

type Filter = 'semua' | 'tampil' | 'disembunyikan';

interface WishesTabProps {
  wishes: Wish[];
  reload: () => Promise<void>;
  toast: (msg: string) => void;
}

export const WishesTab: React.FC<WishesTabProps> = ({ wishes, reload, toast }) => {
  const [filter, setFilter] = useState<Filter>('semua');
  const hiddenCount = wishes.filter((w) => w.isHidden).length;

  const filtered = wishes.filter((w) =>
    filter === 'tampil' ? !w.isHidden : filter === 'disembunyikan' ? w.isHidden : true
  );

  const toggleHidden = async (w: Wish) => {
    await store.updateWish(w.id, { isHidden: !w.isHidden });
    await reload();
    toast(w.isHidden ? 'Ucapan ditampilkan kembali' : 'Ucapan disembunyikan dari undangan');
  };

  const remove = async (id: string) => {
    await store.deleteWish(id);
    await reload();
    toast('Ucapan dihapus');
  };

  const filters: Array<{ id: Filter; label: string }> = [
    { id: 'semua', label: `Semua (${wishes.length})` },
    { id: 'tampil', label: `Tampil (${wishes.length - hiddenCount})` },
    { id: 'disembunyikan', label: `Disembunyikan (${hiddenCount})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
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

      {filtered.length === 0 && (
        <p className="p-6 text-center border-2 border-dashed border-[#171412] font-['Courier_Prime'] text-sm text-[#4A413A]">
          Tidak ada ucapan.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((w) => (
          <article
            key={w.id}
            className={`border-2 border-[#171412] p-4 shadow-[3px_3px_0px_#171412] ${
              w.isHidden ? 'bg-[#CDBE9F]/50 opacity-75' : 'bg-[#EFE5D0]'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <span className="font-['Courier_Prime'] font-bold text-sm text-[#171412] block">{w.name}</span>
                <span className="font-['Courier_Prime'] text-[11px] text-[#4A413A] uppercase">
                  {w.relationship || 'Tamu'} · {formatDateTimeLocal(w.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleHidden(w)}
                  className={iconBtn}
                  title={w.isHidden ? 'Tampilkan' : 'Sembunyikan'}
                  aria-label={w.isHidden ? `Tampilkan ucapan dari ${w.name}` : `Sembunyikan ucapan dari ${w.name}`}
                >
                  {w.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <ConfirmButton onConfirm={() => remove(w.id)} title="Hapus ucapan" confirmLabel="Hapus?">
                  <Trash2 className="w-3.5 h-3.5 text-[#B4392B]" />
                </ConfirmButton>
              </div>
            </div>
            {w.isHidden && (
              <span className="inline-block mb-2 px-2 py-0.5 bg-[#171412] text-[#F6EFE1] font-['Courier_Prime'] text-[10px] uppercase">
                Disembunyikan
              </span>
            )}
            <p className="font-['Work_Sans'] text-sm text-[#171412] leading-relaxed break-words">{w.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
};
