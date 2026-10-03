import React from 'react';
import { weddingConfig } from '../content/wedding.config';
import { VideoPlayer } from './ui/VideoPlayer';

/** Video prewedding / trailer, dibingkai seperti layar bioskop. */
export const TrailerSection: React.FC = () => {
  const { title, caption, videoUrl } = weddingConfig.trailer;
  if (!videoUrl.trim()) return null;

  return (
    <section className="bg-[#171412] text-[#F6EFE1] py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#D7A13E] block mb-2 font-bold">
            COMING ATTRACTIONS · NOW PLAYING
          </span>
          <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#F6EFE1]">{title}</h2>
          <div className="w-16 h-[2px] bg-[#B4392B] mx-auto mt-3" />
          {caption && (
            <p className="font-['Work_Sans'] text-sm text-[#CDBE9F] max-w-xl mx-auto mt-4 leading-relaxed">{caption}</p>
          )}
        </div>

        {/* Layar bioskop */}
        <div className="relative border-4 border-[#F6EFE1]/80 shadow-[0_0_60px_rgba(215,161,62,0.15)]">
          <VideoPlayer url={videoUrl} title={title} />
        </div>
        <div className="flex items-center justify-between mt-3 font-['Courier_Prime'] text-[11px] uppercase tracking-widest text-[#A89E8F]">
          <span>{weddingConfig.filmEdgeText}</span>
          <span>REEL 01 · 24 FPS</span>
        </div>
      </div>
    </section>
  );
};
