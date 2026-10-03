import React from 'react';

interface FilmOverlayProps {
  enabled: boolean;
}

export const FilmOverlay: React.FC<FilmOverlayProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Subtle Vignette around the corners of the viewport */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 70%, rgba(23, 20, 18, 0.18) 100%)',
        }}
      />

      {/* 2. Static Micro Film Grain Overlay (Non-blinking, crisp, lightweight) */}
      <div className="absolute inset-0 film-grain-static opacity-30" />
    </div>
  );
};
