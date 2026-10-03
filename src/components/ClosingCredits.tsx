import React from 'react';
import { weddingConfig } from '../content/wedding.config';
import { coupleNames, displayGuestName, weddingYear } from '../lib/wedding';
import { ActiveGuest } from '../types/wedding';

interface ClosingCreditsProps {
  guest: ActiveGuest;
  onReplay?: () => void;
}

export const ClosingCredits: React.FC<ClosingCreditsProps> = ({ guest, onReplay }) => {
  const handleReplayClick = () => {
    if (onReplay) {
      onReplay();
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#171412] text-[#F6EFE1] py-24 px-4 sm:px-6 relative select-none">
      <div className="max-w-xl mx-auto text-center space-y-12">
        {/* Credits Header */}
        <div>
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.3em] text-[#D7A13E] block mb-2 font-bold">
            CLOSING CREDITS · GULUNGAN AKHIR
          </span>
          <div className="w-12 h-[2px] bg-[#B4392B] mx-auto mt-2" />
        </div>

        {/* Lead Roles */}
        <div className="space-y-2">
          <p className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#8C8274]">
            PEMERAN UTAMA (STARRING)
          </p>
          <h3 className="font-['DM_Serif_Display'] italic text-2xl sm:text-3xl text-[#F6EFE1]">
            {weddingConfig.couple.groom.fullname}
          </h3>
          <p className="font-['Courier_Prime'] text-sm text-[#D7A13E]">&</p>
          <h3 className="font-['DM_Serif_Display'] italic text-2xl sm:text-3xl text-[#F6EFE1]">
            {weddingConfig.couple.bride.fullname}
          </h3>
        </div>

        {/* Executive Producers */}
        <div className="space-y-3">
          <p className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#8C8274]">
            DIPRODUKSI OLEH (EXECUTIVE PRODUCERS)
          </p>
          {weddingConfig.credits.executiveProducers.map((producer, i) => (
            <p key={i} className="font-['DM_Serif_Display'] text-lg sm:text-xl text-[#F6EFE1]">
              {producer}
            </p>
          ))}
        </div>

        {/* Supporting Cast */}
        <div className="space-y-2">
          <p className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#8C8274]">
            PEMERAN PENDUKUNG (SUPPORTING CAST)
          </p>
          {weddingConfig.credits.supportingCast.map((cast, i) => (
            <p key={i} className="font-['Work_Sans'] text-sm text-[#CDBE9F]">
              {cast}
            </p>
          ))}
        </div>

        {/* Shooting Location & Soundtrack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#F6EFE1]/15">
          <div>
            <p className="font-['Courier_Prime'] text-[11px] uppercase tracking-wider text-[#8C8274] mb-1">
              LOKASI SYUTING
            </p>
            <p className="font-['Work_Sans'] text-xs font-semibold text-[#F6EFE1]">
              {weddingConfig.credits.shootingLocation}
            </p>
          </div>
          <div>
            <p className="font-['Courier_Prime'] text-[11px] uppercase tracking-wider text-[#8C8274] mb-1">
              SOUNDTRACK
            </p>
            <p className="font-['Work_Sans'] text-xs font-semibold text-[#F6EFE1]">
              {weddingConfig.credits.soundtrack}
            </p>
          </div>
        </div>

        {/* Special Thanks */}
        <div className="pt-6 border-t border-[#F6EFE1]/15 space-y-2">
          <p className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#8C8274]">
            PENGHORMATAN KHUSUS (SPECIAL THANKS)
          </p>
          <p className="font-['DM_Serif_Display'] italic text-2xl text-[#D7A13E]">
            {guest.code ? displayGuestName(guest.name, guest.salutation) : 'Anda, Sahabat & Tamu Undangan'}
          </p>
          <p className="font-['Work_Sans'] text-xs text-[#8C8274] max-w-md mx-auto leading-relaxed">
            {weddingConfig.credits.specialThanks}
          </p>
        </div>

        {/* The End Title Card */}
        <div className="pt-16 pb-8 border-t-2 border-[#F6EFE1]/30">
          <h2 className="font-['Anton'] text-6xl sm:text-8xl tracking-widest uppercase text-[#F6EFE1] leading-none mb-3">
            THE END
          </h2>
          <p className="font-['DM_Serif_Display'] italic text-xl sm:text-2xl text-[#D7A13E] mb-8">
            …and so it begins.
          </p>

          <button
            onClick={handleReplayClick}
            className="inline-flex items-center gap-2 px-6 py-3 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#F6EFE1] bg-transparent text-[#F6EFE1] hover:bg-[#B4392B] hover:border-[#B4392B] transition-colors cursor-pointer shadow-[3px_3px_0px_#B4392B]"
          >
            <span>↺</span> PUTAR ULANG FILM
          </button>
        </div>

        <div className="text-[10px] font-['Courier_Prime'] text-[#8C8274] tracking-widest uppercase">
          © {weddingYear} {coupleNames.toUpperCase()} · ALL RIGHTS RESERVED · 35MM CELLULOID ARCHIVE
        </div>
      </div>
    </section>
  );
};
