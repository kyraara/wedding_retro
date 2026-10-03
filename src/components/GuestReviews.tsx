import React, { useState, useEffect } from 'react';
import { Wish } from '../types/wedding';
import { store } from '../lib/store';
import { coupleNames } from '../lib/wedding';

const MAX_NAME = 60;
const MAX_MESSAGE = 500;
const PAGE_SIZE = 5;
const COOLDOWN_MS = 30_000;
const LAST_WISH_KEY = 'premiere_last_wish_at';

const RELATIONSHIPS = [
  { value: 'Sahabat', label: 'Sahabat' },
  { value: 'Keluarga', label: 'Keluarga Besar' },
  { value: 'Rekan Kerja', label: 'Rekan Kerja' },
  { value: 'Komunitas', label: 'Komunitas / Alumni' },
  { value: 'Tamu Terhormat', label: 'Tamu Terhormat' },
];

function getLastWishAt(): number {
  try {
    return Number(localStorage.getItem(LAST_WISH_KEY)) || 0;
  } catch {
    return 0;
  }
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Baru saja';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface GuestReviewsProps {
  initialGuestName?: string;
}

export const GuestReviews: React.FC<GuestReviewsProps> = ({ initialGuestName }) => {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [name, setName] = useState(initialGuestName || '');
  const [relationship, setRelationship] = useState('Sahabat');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    store.listWishes().then(setWishes);
  }, []);

  useEffect(() => {
    if (initialGuestName) setName((prev) => prev || initialGuestName);
  }, [initialGuestName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return;

    const wait = getLastWishAt() + COOLDOWN_MS - Date.now();
    if (wait > 0) {
      setError(`Mohon tunggu ${Math.ceil(wait / 1000)} detik sebelum mengirim ulasan berikutnya.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const added = await store.addWish({
        name: trimmedName.slice(0, MAX_NAME),
        relationship,
        message: trimmedMessage.slice(0, MAX_MESSAGE),
      });
      try {
        localStorage.setItem(LAST_WISH_KEY, String(Date.now()));
      } catch {
        // abaikan
      }
      setWishes((prev) => [added, ...prev]);
      setNewlyAddedId(added.id);
      setMessage('');
      setTimeout(() => setNewlyAddedId(null), 3000);
    } catch {
      setError('Ulasan gagal dikirim. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleWishes = wishes.slice(0, visibleCount);

  return (
    <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#6B6156] block mb-2 font-bold">
          CRITICS & AUDIENCE REVIEWS
        </span>
        <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#171412]">
          ULASAN PENONTON
        </h2>
        <div className="w-16 h-[2px] bg-[#B4392B] mx-auto mt-3" />
        <p className="font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#6B6156] mt-2">
          UNTUK KEDUA MEMPELAI DARI PARA PENONTON SETIA
        </p>
      </div>

      {/* Review Submission Form (styled like a typewriter letter) */}
      <div className="border-2 border-[#171412] bg-[#E3D5B8] p-6 sm:p-8 shadow-[5px_5px_0px_#171412] mb-12">
        <div className="flex items-center justify-between border-b border-[#171412]/20 pb-3 mb-6">
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#B4392B] font-bold">
            TULIS ULASAN / DOA RESTU
          </span>
          <span className="font-['Courier_Prime'] text-xs text-[#6B6156] hidden sm:inline">KOLOM KRITIK & TRIBUTE</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="wish-name"
                className="block font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold mb-1"
              >
                NAMA ANDA *
              </label>
              <input
                id="wish-name"
                type="text"
                required
                maxLength={MAX_NAME}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda / Pasangan"
                className="w-full px-3 py-2.5 border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] font-['Work_Sans'] text-sm focus:outline-none focus:border-[#B4392B]"
              />
            </div>

            <div>
              <label
                htmlFor="wish-relationship"
                className="block font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold mb-1"
              >
                HUBUNGAN / STATUS
              </label>
              <select
                id="wish-relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] font-['Work_Sans'] text-sm focus:outline-none focus:border-[#B4392B]"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="wish-message"
                className="block font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold"
              >
                PESAN / DOA RESTU *
              </label>
              <span className="font-['Courier_Prime'] text-[11px] text-[#6B6156] tabular-nums">
                {message.length}/{MAX_MESSAGE}
              </span>
            </div>
            <textarea
              id="wish-message"
              required
              rows={3}
              maxLength={MAX_MESSAGE}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Tuliskan doa restu, ucapan hangat, atau kesan Anda untuk ${coupleNames}...`}
              className="w-full px-3 py-2.5 border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] font-['Work_Sans'] text-sm focus:outline-none focus:border-[#B4392B]"
            />
          </div>

          {error && (
            <p role="alert" className="font-['Courier_Prime'] text-xs text-[#B4392B] font-bold">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto py-3 px-8 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#171412] text-[#F6EFE1] hover:bg-[#B4392B] transition-colors shadow-[3px_3px_0px_#171412] cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? 'MENGIRIMKAN...' : 'TERBITKAN ULASAN (KIRIM)'}
          </button>
        </form>
      </div>

      {/* Reviews List (Newspaper Review Clippings) */}
      <div className="space-y-6" aria-live="polite">
        <div className="flex items-center justify-between border-b-2 border-[#171412] pb-2 mb-6">
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#171412] font-bold">
            ARSIP ULASAN PENONTON ({wishes.length})
          </span>
          <span className="font-['Courier_Prime'] text-xs text-[#6B6156] hidden sm:inline">
            ★ PRESS & AUDIENCE REVIEWS ★
          </span>
        </div>

        {wishes.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#171412] p-8">
            <p className="font-['Courier_Prime'] text-sm text-[#6B6156]">
              Belum ada ulasan penonton. Jadilah yang pertama memberikan doa restu!
            </p>
          </div>
        ) : (
          visibleWishes.map((item) => (
            <article
              key={item.id}
              className={`p-6 border-2 border-[#171412] bg-[#EFE5D0] shadow-[4px_4px_0px_#171412] relative transition-all ${
                newlyAddedId === item.id ? 'ring-2 ring-[#B4392B] bg-[#E3D5B8]' : ''
              }`}
            >
              <div className="flex flex-wrap gap-2 items-center justify-between mb-3 border-b border-[#171412]/15 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-['Courier_Prime'] font-bold text-sm text-[#171412]">{item.name}</span>
                  {item.relationship && (
                    <span className="font-['Courier_Prime'] text-[11px] text-[#6B6156] uppercase tracking-wider border border-[#6B6156]/50 px-1.5">
                      {item.relationship}
                    </span>
                  )}
                </div>
                <span className="font-['Courier_Prime'] text-[11px] text-[#6B6156]">{formatDate(item.createdAt)}</span>
              </div>

              <div className="relative pl-6 my-2">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[-6px] font-['DM_Serif_Display'] text-4xl text-[#D7A13E] select-none"
                >
                  “
                </span>
                <p className="font-['DM_Serif_Display'] italic text-base sm:text-lg text-[#171412] leading-relaxed break-words">
                  {item.message}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] font-['Courier_Prime'] text-[#6B6156]">
                <span className="text-[#A87A1F]">★★★★★ (VERIFIED GUEST)</span>
                <span>TRIBUTE ARCHIVE</span>
              </div>
            </article>
          ))
        )}

        {wishes.length > visibleCount && (
          <div className="text-center pt-2">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="py-2.5 px-6 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer"
            >
              TAMPILKAN LEBIH BANYAK ({wishes.length - visibleCount} LAGI)
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
