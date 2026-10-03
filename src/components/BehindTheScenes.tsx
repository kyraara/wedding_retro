import React from 'react';
import { weddingConfig } from '../content/wedding.config';

export const BehindTheScenes: React.FC = () => {
  return (
    <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto">
      {/* Section Title */}
      <div className="text-center mb-14">
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#6B6156] block mb-2 font-bold">
          ARCHIVES & PRODUCTION LOGS
        </span>
        <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#171412]">
          BEHIND THE SCENES
        </h2>
        <div className="w-16 h-[2px] bg-[#B4392B] mx-auto mt-3" />
        <p className="font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#6B6156] mt-2">
          GULUNGAN KISAH PERJALANAN DUA HATI MENUJU PELAMINAN
        </p>
      </div>

      <div className="space-y-12">
        {weddingConfig.scenes.map((scene, idx) => {
          const isEven = idx % 2 === 1;

          return (
            <div
              key={scene.id}
              className="border-2 border-[#171412] bg-[#E3D5B8] shadow-[5px_5px_0px_#171412] overflow-hidden"
            >
              {/* Clapperboard Strip Header */}
              <div
                className="h-7 w-full border-b-2 border-[#171412]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #171412, #171412 14px, #EFE5D0 14px, #EFE5D0 28px)',
                }}
              />

              {/* Clapper metadata bar */}
              <div className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-[#171412]/30 bg-[#EFE5D0] font-['Courier_Prime'] text-xs uppercase tracking-wider font-bold">
                <span className="text-[#B4392B]">
                  SCENE {String(idx + 1).padStart(2, '0')} · TAKE {idx + 1}
                </span>
                <span className="text-[#171412]">ROLL YEAR: {scene.year}</span>
              </div>

              {/* Body Content */}
              <div
                className={`p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center ${
                  isEven ? 'md:grid-flow-dense' : ''
                }`}
              >
                {/* Photo Column */}
                {scene.image && (
                  <div
                    className={`md:col-span-5 ${
                      isEven ? 'md:col-start-8' : ''
                    }`}
                  >
                    <div className="border-2 border-[#171412] bg-[#171412] overflow-hidden aspect-[4/3] shadow-[3px_3px_0px_#171412]">
                      <img
                        src={scene.image}
                        alt={scene.title}
                        className="w-full h-full object-cover film-photo hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}

                {/* Text Column */}
                <div
                  className={`${
                    scene.image
                      ? isEven
                        ? 'md:col-span-7 md:col-start-1'
                        : 'md:col-span-7'
                      : 'md:col-span-12'
                  }`}
                >
                  <h3 className="font-['DM_Serif_Display'] italic text-2xl sm:text-3xl text-[#171412] mb-3 leading-snug">
                    {scene.title}
                  </h3>
                  <p className="font-['Work_Sans'] text-xs sm:text-sm text-[#4A413A] leading-relaxed">
                    {scene.story}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
