import React from 'react';
import { weddingConfig } from '../content/wedding.config';

export const SynopsisQuote: React.FC = () => {
  return (
    <section className="px-4 sm:px-6 py-12 max-w-3xl mx-auto text-center">
      {/* Decorative film reel strip divider */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="h-[1px] w-12 bg-[#CDBE9F]" />
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#B4392B] font-bold">
          SINOPSIS
        </span>
        <div className="h-[1px] w-12 bg-[#CDBE9F]" />
      </div>

      <div className="relative p-6 sm:p-8 border border-[#CDBE9F] bg-[#E3D5B8]/40">
        <span className="font-['DM_Serif_Display'] text-5xl text-[#D7A13E] leading-none select-none block -mb-4">
          “
        </span>
        <p className="font-['DM_Serif_Display'] italic text-lg sm:text-xl md:text-2xl text-[#171412] leading-relaxed my-2">
          {weddingConfig.synopsis.quote}
        </p>
        <span className="font-['DM_Serif_Display'] text-5xl text-[#D7A13E] leading-none select-none block -mt-4 text-right">
          ”
        </span>

        <p className="font-['Courier_Prime'] text-xs sm:text-sm tracking-widest uppercase text-[#6B6156] mt-3">
          — {weddingConfig.synopsis.source} —
        </p>
      </div>
    </section>
  );
};
