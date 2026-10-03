import React, { useState } from 'react';
import { weddingConfig } from '../content/wedding.config';
import { Modal } from './ui/Modal';
import { VideoPlayer } from './ui/VideoPlayer';

type GalleryItem = (typeof weddingConfig.postEvent.gallery)[number];

/** Galeri & video dokumentasi yang tampil setelah acara selesai. */
export const PostEventGallery: React.FC = () => {
  const { title, message, videoUrl, gallery } = weddingConfig.postEvent;
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  return (
    <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#B4392B] block mb-2 font-bold">
          AFTER PARTY · DOKUMENTASI HARI H
        </span>
        <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#171412]">{title}</h2>
        <div className="w-16 h-[2px] bg-[#171412] mx-auto mt-3" />
        <p className="font-['Work_Sans'] text-sm text-[#4A413A] max-w-xl mx-auto mt-4 leading-relaxed">{message}</p>
      </div>

      {videoUrl.trim() && (
        <VideoPlayer
          url={videoUrl}
          title={`Video dokumentasi ${title}`}
          className="border-2 border-[#171412] shadow-[6px_6px_0px_#171412] mb-10"
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {gallery.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className={`group relative border-2 border-[#171412] bg-[#171412] overflow-hidden shadow-[4px_4px_0px_#171412] cursor-pointer text-left ${
              idx === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'
            }`}
            aria-label={`Perbesar foto: ${item.caption}`}
          >
            <img
              src={item.image}
              alt={item.caption}
              loading="lazy"
              className="w-full h-full object-cover film-photo group-hover:scale-105"
            />
            <span className="absolute bottom-0 inset-x-0 bg-[#171412]/80 px-3 py-2 font-['Courier_Prime'] text-[11px] uppercase tracking-wider text-[#F6EFE1]">
              {item.caption}
            </span>
          </button>
        ))}
      </div>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        ariaLabel={selected?.caption}
        overlayClassName="bg-black/90 backdrop-blur-md"
        className="max-w-3xl w-full border-2 border-[#F6EFE1] bg-[#171412] p-4 shadow-[8px_8px_0px_#B4392B]"
      >
        {selected && (
          <>
            <button
              onClick={() => setSelected(null)}
              className="absolute top-2 right-3 text-[#F6EFE1] hover:text-[#B4392B] font-['Courier_Prime'] text-xl font-bold cursor-pointer"
              aria-label="Tutup foto"
            >
              ✕
            </button>
            <img src={selected.image} alt={selected.caption} className="w-full max-h-[75vh] object-contain mt-6" />
            <p className="font-['Work_Sans'] text-sm text-[#CDBE9F] mt-3">{selected.caption}</p>
          </>
        )}
      </Modal>
    </section>
  );
};
