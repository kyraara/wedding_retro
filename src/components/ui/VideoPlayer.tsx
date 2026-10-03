import React from 'react';

/** Ubah link YouTube/Vimeo biasa menjadi URL embed. Mengembalikan null untuk file video langsung. */
export function toEmbedUrl(url: string): string | null {
  const u = url.trim();
  const yt =
    u.match(/youtu\.be\/([\w-]{11})/) ||
    u.match(/youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`;
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

interface VideoPlayerProps {
  url: string;
  title: string;
  className?: string;
}

/** Pemutar video: embed untuk YouTube/Vimeo, tag <video> untuk file yang diunggah. */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, className = '' }) => {
  const embed = toEmbedUrl(url);
  return (
    <div className={`aspect-video bg-[#171412] ${className}`}>
      {embed ? (
        <iframe
          src={embed}
          title={title}
          className="w-full h-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={url} title={title} className="w-full h-full" controls preload="metadata" playsInline />
      )}
    </div>
  );
};
