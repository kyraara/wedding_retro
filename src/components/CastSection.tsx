import React from 'react';
import { weddingConfig } from '../content/wedding.config';

export const CastSection: React.FC = () => {
  const { groom, bride } = weddingConfig.couple;

  return (
    <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#6B6156] block mb-2 font-bold">
          CASTING CALL · MEET THE PROTAGONISTS
        </span>
        <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#171412]">
          PEMERAN UTAMA
        </h2>
        <div className="w-16 h-[2px] bg-[#B4392B] mx-auto mt-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Groom Card */}
        <div className="border-2 border-[#171412] bg-[#E3D5B8] p-5 shadow-[5px_5px_0px_#171412] flex flex-col group">
          <div className="relative border border-[#171412] overflow-hidden aspect-[3/4] mb-5 bg-[#171412]">
            <img
              src={groom.photo}
              alt={groom.fullname}
              className="w-full h-full object-cover film-photo transition-all duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Film Frame Number Badge */}
            <div className="absolute top-2 left-2 bg-[#171412]/85 text-[#D7A13E] font-['Courier_Prime'] text-[11px] px-2 py-0.5 tracking-widest uppercase">
              FRAME 01A · GROOM
            </div>
            <div className="absolute bottom-2 right-2 bg-[#171412]/85 text-[#F6EFE1] font-['Courier_Prime'] text-[10px] px-2 py-0.5">
              35MM KODA-WARM
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <span className="font-['Courier_Prime'] text-[11px] uppercase tracking-widest text-[#B4392B] font-bold">
              PEMERAN PRIA
            </span>
            <h3 className="font-['Anton'] text-3xl sm:text-4xl uppercase text-[#171412] tracking-wide mt-1">
              {groom.callname}
            </h3>
            <p className="font-['DM_Serif_Display'] italic text-lg text-[#4A413A] mb-3">
              {groom.fullname}
            </p>

            <p className="font-['Work_Sans'] text-xs sm:text-sm text-[#4A413A] leading-relaxed mb-4">
              {groom.bio}
            </p>

            <div className="mt-auto pt-4 border-t border-[#CDBE9F]">
              <p className="font-['Courier_Prime'] text-[11px] uppercase text-[#6B6156] tracking-wider mb-1">
                PUTRA TERCINTA DARI:
              </p>
              <p className="font-['Work_Sans'] font-medium text-xs text-[#171412]">
                {groom.parents}
              </p>
              {groom.instagram && (
              <a
                href={`https://instagram.com/${groom.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block font-['Courier_Prime'] text-xs text-[#3C6966] hover:text-[#B4392B] font-bold mt-3 transition-colors"
              >
                ↗ {groom.instagram}
              </a>
              )}
            </div>
          </div>
        </div>

        {/* Bride Card */}
        <div className="border-2 border-[#171412] bg-[#E3D5B8] p-5 shadow-[5px_5px_0px_#171412] flex flex-col group">
          <div className="relative border border-[#171412] overflow-hidden aspect-[3/4] mb-5 bg-[#171412]">
            <img
              src={bride.photo}
              alt={bride.fullname}
              className="w-full h-full object-cover film-photo transition-all duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Film Frame Number Badge */}
            <div className="absolute top-2 left-2 bg-[#171412]/85 text-[#D7A13E] font-['Courier_Prime'] text-[11px] px-2 py-0.5 tracking-widest uppercase">
              FRAME 02A · BRIDE
            </div>
            <div className="absolute bottom-2 right-2 bg-[#171412]/85 text-[#F6EFE1] font-['Courier_Prime'] text-[10px] px-2 py-0.5">
              35MM KODA-WARM
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <span className="font-['Courier_Prime'] text-[11px] uppercase tracking-widest text-[#B4392B] font-bold">
              PEMERAN WANITA
            </span>
            <h3 className="font-['Anton'] text-3xl sm:text-4xl uppercase text-[#171412] tracking-wide mt-1">
              {bride.callname}
            </h3>
            <p className="font-['DM_Serif_Display'] italic text-lg text-[#4A413A] mb-3">
              {bride.fullname}
            </p>

            <p className="font-['Work_Sans'] text-xs sm:text-sm text-[#4A413A] leading-relaxed mb-4">
              {bride.bio}
            </p>

            <div className="mt-auto pt-4 border-t border-[#CDBE9F]">
              <p className="font-['Courier_Prime'] text-[11px] uppercase text-[#6B6156] tracking-wider mb-1">
                PUTRI TERCINTA DARI:
              </p>
              <p className="font-['Work_Sans'] font-medium text-xs text-[#171412]">
                {bride.parents}
              </p>
              {bride.instagram && (
              <a
                href={`https://instagram.com/${bride.instagram.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block font-['Courier_Prime'] text-xs text-[#3C6966] hover:text-[#B4392B] font-bold mt-3 transition-colors"
              >
                ↗ {bride.instagram}
              </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
