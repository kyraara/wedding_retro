import React from 'react';
import { weddingConfig } from '../content/wedding.config';
import { displayGuestName, weddingDateLong, weddingYear } from '../lib/wedding';
import { EventPhase } from '../lib/eventPhase';
import { ActiveGuest } from '../types/wedding';
import { revealDelay } from '../lib/motion';

interface NowShowingHeroProps {
  guest: ActiveGuest;
  phase: EventPhase;
}

const HEADLINES: Record<EventPhase, string> = {
  before: 'NOW SHOWING',
  live: 'NOW PLAYING',
  after: "THAT'S A WRAP",
};

export const NowShowingHero: React.FC<NowShowingHeroProps> = ({ guest, phase }) => {
  return (
    <section className="relative px-4 sm:px-6 pt-8 pb-16 max-w-4xl mx-auto">
      {/* Top Poster Marquee Ribbon */}
      <div className="hero-reveal flex items-center justify-between border-b-2 border-[#171412] pb-3 mb-6" style={revealDelay(0)}>
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#B4392B] font-bold">
          WORLD PREMIERE · {weddingYear}
        </span>
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#6B6156]">
          ROLL NO. 01 / SCENE 01
        </span>
      </div>

      {/* Main Poster Card Container */}
      <div className="border-2 border-[#171412] bg-[#E3D5B8] p-4 sm:p-8 shadow-[6px_6px_0px_#171412] relative overflow-hidden">
        {/* Subtle decorative poster corner pins */}
        <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#171412]" />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#171412]" />
        <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#171412]" />
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#171412]" />

        {/* Headliner */}
        <div className="hero-reveal text-center mb-6" style={revealDelay(150)}>
          <p className="font-['Courier_Prime'] text-xs sm:text-sm tracking-[0.2em] uppercase text-[#4A413A] mb-2 font-bold">
            {weddingConfig.presentedBy}
          </p>
          <h2 className="font-['Anton'] text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-[#B4392B] leading-none">
            {HEADLINES[phase]}
          </h2>
          <div className="w-20 h-[3px] bg-[#171412] mx-auto mt-3 mb-2" />
          <p className="font-['Courier_Prime'] text-xs uppercase tracking-[0.16em] text-[#6B6156]">
            {weddingConfig.tagline}
          </p>
        </div>

        {/* Poster Grid: Photo & Bold Typography */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-6">
          {/* Couple Image (4:5) */}
          <div className="hero-reveal md:col-span-6 relative" style={revealDelay(320)}>
            <div className="relative border-2 border-[#171412] bg-[#171412] overflow-hidden aspect-[4/5] shadow-[4px_4px_0px_#171412]">
              <img
                src={weddingConfig.posterImage}
                alt={`${weddingConfig.couple.groom.callname} & ${weddingConfig.couple.bride.callname}`}
                className="w-full h-full object-cover film-photo"
                loading="eager"
              />
              {/* Retro Film Edge Timestamp */}
              <div className="absolute bottom-2 right-2 bg-[#171412]/80 px-2 py-0.5 text-[10px] font-['Courier_Prime'] text-[#D7A13E] tracking-widest uppercase">
                {weddingConfig.filmEdgeText}
              </div>
            </div>

            {/* Vintage Slanted "PREMIERE" Stamp */}
            <div className="absolute -bottom-4 -left-3 rotate-[-12deg] z-10 border-2 border-[#B4392B] bg-[#EFE5D0] px-3 py-1 text-[#B4392B] font-['Courier_Prime'] text-xs font-bold tracking-widest uppercase shadow-[2px_2px_0px_#171412]">
              ★ PREMIERE EXCLUSIVE ★
            </div>
          </div>

          {/* Typography Lockup */}
          <div
            className="hero-reveal md:col-span-6 flex flex-col justify-center text-center md:text-left pt-4 md:pt-0"
            style={revealDelay(480)}
          >
            <p className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#6B6156] mb-1">
              THE CELEBRATION OF LOVE
            </p>

            <div className="space-y-0 leading-none mb-4">
              <h1 className="font-['Anton'] text-5xl sm:text-6xl md:text-7xl uppercase text-[#171412] tracking-normal">
                {weddingConfig.couple.groom.callname}
              </h1>
              <div className="flex items-center justify-center md:justify-start gap-3 my-1">
                <div className="h-[2px] w-8 bg-[#D7A13E]" />
                <span className="font-['DM_Serif_Display'] italic text-4xl sm:text-5xl text-[#D7A13E]">
                  &
                </span>
                <div className="h-[2px] w-8 bg-[#D7A13E]" />
              </div>
              <h1 className="font-['Anton'] text-5xl sm:text-6xl md:text-7xl uppercase text-[#171412] tracking-normal">
                {weddingConfig.couple.bride.callname}
              </h1>
            </div>

            {/* Guest Invitation Box */}
            <div className="mt-4 p-4 border border-[#CDBE9F] bg-[#EFE5D0] text-center md:text-left">
              <p className="font-['Courier_Prime'] text-[11px] uppercase tracking-wider text-[#6B6156] mb-1">
                KEPADA YTH. PENONTON / TAMU UNDANGAN:
              </p>
              <p
                className={`font-['DM_Serif_Display'] italic text-lg sm:text-xl text-[#171412] transition-opacity duration-500 ${
                  guest.isPending ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {displayGuestName(guest.name, guest.salutation)}
              </p>
              <p className="font-['Work_Sans'] text-xs text-[#4A413A] mt-1">
                {phase === 'after'
                  ? 'Terima kasih atas kehadiran dan doa restu Anda pada pemutaran perdana ikatan suci kami.'
                  : 'Merupakan suatu kehormatan dan kebahagiaan bagi kami atas kehadiran doa restu Anda pada pemutaran perdana ikatan suci kami.'}
              </p>
            </div>
          </div>
        </div>

        {/* Poster Billing Block (Authentic Movie Credits Block) */}
        <div className="hero-reveal border-t-2 border-[#171412] pt-4 mt-6 text-center" style={revealDelay(640)}>
          <div className="max-w-2xl mx-auto space-y-1">
            <p className="font-['Courier_Prime'] text-[11px] sm:text-[11px] uppercase tracking-wider text-[#4A413A] leading-relaxed">
              DIRECTED BY DESTINY · PRODUCED BY <span className="font-bold text-[#171412]">{weddingConfig.producedBy.toUpperCase()}</span> · STARRING <span className="font-bold text-[#171412]">{weddingConfig.couple.groom.fullname.toUpperCase()}</span> AND <span className="font-bold text-[#171412]">{weddingConfig.couple.bride.fullname.toUpperCase()}</span>
            </p>
            <p className="font-['Courier_Prime'] text-[11px] uppercase tracking-widest text-[#6B6156]">
              RELEASE DATE: {weddingDateLong.toUpperCase()} · LOCATION: {weddingConfig.city.toUpperCase()}, {weddingConfig.region.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
