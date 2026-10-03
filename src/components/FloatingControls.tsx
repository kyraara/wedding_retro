import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, Disc, RotateCcw } from 'lucide-react';

interface FloatingControlsProps {
  isPlayingAudio: boolean;
  onToggleAudio: () => void;
  filmEffectsEnabled: boolean;
  onToggleFilmEffects: () => void;
  onReplayIntro?: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  isPlayingAudio,
  onToggleAudio,
  filmEffectsEnabled,
  onToggleFilmEffects,
  onReplayIntro,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
      {/* Expanded quick menu */}
      {isOpen && (
        <div className="border-2 border-[#171412] bg-[#E3D5B8] p-2 shadow-[4px_4px_0px_#171412] flex flex-col gap-1.5 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Audio toggle button */}
          <button
            onClick={onToggleAudio}
            className="flex items-center gap-2 px-3 py-2 text-xs font-['Courier_Prime'] uppercase tracking-wider text-[#171412] hover:bg-[#EFE5D0] border border-transparent hover:border-[#171412] transition-colors cursor-pointer w-full text-left"
          >
            {isPlayingAudio ? (
              <>
                <Volume2 className="w-4 h-4 text-[#B4392B]" />
                <span>Hentikan Musik</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-[#8C8274]" />
                <span>Nyalakan Musik</span>
              </>
            )}
          </button>

          {/* Film Grain & Flicker toggle */}
          <button
            onClick={onToggleFilmEffects}
            className="flex items-center gap-2 px-3 py-2 text-xs font-['Courier_Prime'] uppercase tracking-wider text-[#171412] hover:bg-[#EFE5D0] border border-transparent hover:border-[#171412] transition-colors cursor-pointer w-full text-left"
          >
            <Sparkles
              className={`w-4 h-4 ${
                filmEffectsEnabled ? 'text-[#D7A13E]' : 'text-[#8C8274]'
              }`}
            />
            <span>
              Efek Film: {filmEffectsEnabled ? 'Aktif' : 'Mati'}
            </span>
          </button>

          {/* Replay intro button */}
          {onReplayIntro && (
            <button
              onClick={() => {
                setIsOpen(false);
                onReplayIntro();
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs font-['Courier_Prime'] uppercase tracking-wider text-[#171412] hover:bg-[#EFE5D0] border border-transparent hover:border-[#171412] transition-colors cursor-pointer w-full text-left"
            >
              <RotateCcw className="w-4 h-4 text-[#B4392B]" />
              <span>Putar Intro Film</span>
            </button>
          )}

        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-12 h-12 rounded-full border-2 border-[#171412] bg-[#171412] text-[#F6EFE1] hover:bg-[#B4392B] flex items-center justify-center shadow-[3px_3px_0px_#171412] transition-all hover:scale-105 active:scale-95 cursor-pointer relative"
        aria-label="Pengaturan Audio & Efek Film"
      >
        <Disc
          className={`w-6 h-6 transition-transform duration-1000 ${
            isPlayingAudio ? 'animate-spin' : ''
          }`}
          style={{ animationDuration: '4s' }}
        />
        {isPlayingAudio && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#B4392B] border-2 border-[#EFE5D0]" />
        )}
      </button>
    </div>
  );
};
