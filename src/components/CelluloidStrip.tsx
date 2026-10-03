import React, { useEffect, useRef, useState } from 'react';
import { weddingConfig } from '../content/wedding.config';
import { Modal } from './ui/Modal';

const stills = weddingConfig.stills;

/** Nomor frame ala pita film: 12, 13, 14, ... */
const frameNo = (idx: number) => String(12 + idx);

/** Kecepatan gulir: berapa detik tiap frame melewati layar. */
const SECONDS_PER_FRAME = 5;
/** Minimal frame per set agar pita tetap memenuhi layar lebar walau fotonya sedikit. */
const MIN_FRAMES_PER_SET = 6;

/** Urutan indeks foto dalam satu set (diulang jika foto sedikit). */
const reelItems = Array.from(
  { length: Math.ceil(MIN_FRAMES_PER_SET / Math.max(1, stills.length)) * stills.length },
  (_, i) => i % stills.length
);

export const CelluloidStrip: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef<number>(undefined);
  const selectedStill = selectedIndex === null ? null : stills[selectedIndex];

  const step = (delta: number) =>
    setSelectedIndex((i) => (i === null ? i : (i + delta + stills.length) % stills.length));

  // Navigasi foto dengan tombol panah kiri/kanan saat lightbox terbuka
  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIndex]);

  return (
    <section className="bg-[#171412] text-[#F6EFE1] py-20 px-0 relative overflow-hidden select-none">
      {/* Film Strip Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-8">
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#D7A13E] block mb-2 font-bold">
          35MM CONTACT SHEET · CAMERA ARCHIVES
        </span>
        <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#F6EFE1]">
          PITA SELULOID
        </h2>
        <div className="w-16 h-[2px] bg-[#B4392B] mx-auto mt-3" />
      </div>

      {/* Pita film bergulir: dua salinan set foto berjalan terus tanpa ujung */}
      <div
        className={`reel-viewport relative border-y-2 border-[#F6EFE1]/20 bg-[#120F0E] my-4 shadow-inner ${
          paused ? 'is-paused' : ''
        }`}
        onTouchStart={() => {
          window.clearTimeout(resumeTimer.current);
          setPaused(true);
        }}
        onTouchEnd={() => {
          resumeTimer.current = window.setTimeout(() => setPaused(false), 2500);
        }}
      >
        {/* Bayangan tepi kiri/kanan ala jendela proyektor */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-24 z-10 bg-gradient-to-r from-[#120F0E] to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-24 z-10 bg-gradient-to-l from-[#120F0E] to-transparent" />

        <div className="reel-track flex w-max" style={{ animationDuration: `${reelItems.length * SECONDS_PER_FRAME}s` }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="reel-set flex" aria-hidden={copy === 1 ? true : undefined}>
              {reelItems.map((idx, pos) => {
                const still = stills[idx];
                return (
                  <button
                    type="button"
                    key={`${copy}-${pos}`}
                    onClick={() => setSelectedIndex(idx)}
                    tabIndex={copy === 1 || pos >= stills.length ? -1 : undefined}
                    aria-label={`Perbesar foto: ${still.title || `Frame ${frameNo(idx)}`}`}
                    className="group shrink-0 cursor-pointer px-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D7A13E]"
                  >
                    {/* Lubang sprocket atas */}
                    <div aria-hidden="true" className="reel-sprockets border-b border-[#F6EFE1]/10 -mx-3 mb-4" />

                    {/* Top Film Edge Meta */}
                    <div className="flex items-center justify-between font-['Courier_Prime'] text-[10px] text-[#D7A13E] uppercase tracking-widest px-1 pb-1">
                      <span>{weddingConfig.filmEdgeText}</span>
                      <span className="font-bold text-[#F6EFE1]">▸ {frameNo(idx)}</span>
                    </div>

                    {/* 4:3 Image Frame (lebar + padding = kelipatan 28px agar sprocket menyambung mulus) */}
                    <div className="w-64 sm:w-[312px] md:w-[368px] aspect-[4/3] border-2 border-[#F6EFE1]/40 bg-black overflow-hidden relative shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                      <img
                        src={still.image}
                        alt={copy === 1 ? '' : still.title}
                        className="w-full h-full object-cover film-photo group-hover:scale-105"
                        loading="lazy"
                        draggable={false}
                      />
                      <div className="absolute inset-0 bg-[#171412]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="px-3 py-1 font-['Courier_Prime'] text-xs uppercase bg-[#B4392B] text-[#F6EFE1] tracking-wider font-bold">
                          LIHAT FOTO
                        </span>
                      </div>
                    </div>

                    {/* Bottom Film Edge Meta */}
                    <div className="flex items-center justify-between font-['Courier_Prime'] text-[10px] text-[#8C8274] uppercase tracking-wider px-1 pt-1.5">
                      <span>SAFETY FILM · 400</span>
                      <span>{frameNo(idx)}A</span>
                    </div>

                    {/* Lubang sprocket bawah */}
                    <div aria-hidden="true" className="reel-sprockets border-t border-[#F6EFE1]/10 -mx-3 mt-4" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <Modal
        open={!!selectedStill}
        onClose={() => setSelectedIndex(null)}
        labelledBy="still-title"
        overlayClassName="bg-black/90 backdrop-blur-md"
        className="max-w-3xl w-full border-2 border-[#F6EFE1] bg-[#171412] p-4 sm:p-6 shadow-[8px_8px_0px_#B4392B] text-left text-[#F6EFE1]"
      >
        {selectedStill && (
          <>
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 text-[#F6EFE1] hover:text-[#B4392B] font-['Courier_Prime'] text-xl font-bold cursor-pointer"
              aria-label="Tutup foto"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="font-['Courier_Prime'] text-xs uppercase text-[#D7A13E] tracking-widest font-bold">
                FRAME {frameNo(selectedIndex!)}
              </span>
              <span className="text-[#A89E8F]">·</span>
              <span className="font-['Courier_Prime'] text-xs uppercase text-[#CDBE9F]">
                {selectedIndex! + 1} / {stills.length}
              </span>
            </div>

            <div className="relative border border-[#F6EFE1]/30 bg-black aspect-[4/3] overflow-hidden mb-4">
              <img src={selectedStill.image} alt={selectedStill.title} className="w-full h-full object-contain" />
              <button
                onClick={() => step(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#171412]/80 border border-[#F6EFE1]/40 text-[#F6EFE1] hover:bg-[#B4392B] font-['Anton'] text-xl cursor-pointer"
                aria-label="Foto sebelumnya"
              >
                ‹
              </button>
              <button
                onClick={() => step(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#171412]/80 border border-[#F6EFE1]/40 text-[#F6EFE1] hover:bg-[#B4392B] font-['Anton'] text-xl cursor-pointer"
                aria-label="Foto berikutnya"
              >
                ›
              </button>
            </div>

            <h3 id="still-title" className="font-['DM_Serif_Display'] italic text-2xl text-[#F6EFE1] mb-1">
              {selectedStill.title}
            </h3>
            <p className="font-['Work_Sans'] text-xs sm:text-sm text-[#CDBE9F]">{selectedStill.caption}</p>
          </>
        )}
      </Modal>
    </section>
  );
};
