import React, { useState, useEffect, useRef } from 'react';
import { weddingConfig } from '../content/wedding.config';
import { displayGuestName, weddingDateLong, weddingYear } from '../lib/wedding';
import { ActiveGuest } from '../types/wedding';
import { toEmbedUrl } from './ui/VideoPlayer';
import { INTRO_EXIT_MS, revealDelay } from '../lib/motion';

interface FilmLeaderProps {
  guest: ActiveGuest;
  /** Intro mulai memudar: halaman utama masuk bersamaan (crossfade). */
  onExit: () => void;
  /** Intro selesai memudar dan boleh dilepas. */
  onComplete: () => void;
  onStartAudio: () => void;
  /** Dipanggil saat tombol PUTAR ditekan agar musik boleh diputar nanti (aturan autoplay browser). */
  onPrimeAudio: () => void;
}

/** Video pembuka hanya mendukung file langsung (MP4/WebM), bukan YouTube/Vimeo. */
const introVideoUrl = (() => {
  const url = weddingConfig.intro.videoUrl.trim();
  return url && !toEmbedUrl(url) ? url : '';
})();

/** Batas tunggu video mulai diputar sebelum dilewati otomatis (koneksi lambat). */
const VIDEO_START_TIMEOUT_MS = 7000;

/** Lama memudar saat berpindah tahap (welcome -> countdown -> video -> title card). */
const STAGE_FADE_MS = 300;

/** Lama title card tampil sebelum otomatis masuk ke undangan. */
const TITLECARD_MS = 4500;
const TITLECARD_REDUCED_MS = 1500;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Stage = 'welcome' | 'countdown' | 'video' | 'titlecard' | 'exiting';

export const FilmLeader: React.FC<FilmLeaderProps> = ({
  guest,
  onExit,
  onComplete,
  onStartAudio,
  onPrimeAudio,
}) => {
  // Stages: 'welcome' -> 'countdown' -> 'video' (opsional) -> 'titlecard' -> 'exiting'
  const [stage, setStageState] = useState<Stage>('welcome');
  /** true selama tahap saat ini sedang memudar keluar sebelum diganti tahap berikutnya. */
  const [leaving, setLeaving] = useState(false);
  const stageRef = useRef<Stage>('welcome');
  const timers = useRef<number[]>([]);
  const [count, setCount] = useState<number>(3);
  const [pulseNumber, setPulseNumber] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicStarted = useRef(false);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const setStage = (next: Stage) => {
    stageRef.current = next;
    setStageState(next);
  };

  /** Pindah tahap dengan memudarkan tahap sekarang lebih dulu. */
  const goTo = (next: Stage) => {
    if (stageRef.current === 'exiting') return;
    setLeaving(true);
    later(() => {
      if (stageRef.current === 'exiting') return;
      setStage(next);
      setLeaving(false);
    }, STAGE_FADE_MS);
  };

  /** Mulai memudarkan intro; halaman utama masuk bersamaan. */
  const exit = () => {
    if (stageRef.current === 'exiting') return;
    setStage('exiting');
    onExit();
    later(onComplete, INTRO_EXIT_MS);
  };

  const startMusic = () => {
    if (musicStarted.current) return;
    musicStarted.current = true;
    onStartAudio();
  };

  // Play vintage Academy Leader sync beep using Web Audio API
  const playLeaderBeep = (freq = 1000, duration = 0.05) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext not supported or restricted, silently continue
    }
  };

  const handleStart = () => {
    const video = videoRef.current;
    if (video) {
      // Mulai unduh video & "buka kunci" pemutaran bersuara selagi masih dalam klik tamu.
      // Browser (terutama Safari iOS) hanya mengizinkan video bersuara dari interaksi langsung.
      video.preload = 'auto';
      const unlock = video.play();
      video.pause();
      unlock?.catch(() => {});
      onPrimeAudio();
    } else {
      startMusic();
    }
    try {
      sessionStorage.setItem('premiere_intro_seen', 'true');
    } catch {
      // ignore
    }

    if (prefersReducedMotion()) {
      startMusic();
      setStage('titlecard');
      return;
    }

    setCount(3);
    goTo('countdown');
  };

  const handleSkip = () => {
    videoRef.current?.pause();
    startMusic();
    try {
      sessionStorage.setItem('premiere_intro_seen', 'true');
    } catch {
      // ignore
    }
    exit();
  };

  // Countdown: 3 -> 2 -> 1 -> video / titlecard (tiap 0.9 detik, beep di tiap angka)
  useEffect(() => {
    if (stage !== 'countdown') return;

    playLeaderBeep(1000, 0.06);
    setPulseNumber(true);
    const pulseTimer = setTimeout(() => setPulseNumber(false), 200);

    const timer = setTimeout(() => {
      if (count > 1) {
        setCount((prev) => prev - 1);
      } else {
        playLeaderBeep(1200, 0.08); // nada lebih tinggi saat film mulai
        goTo(introVideoUrl ? 'video' : 'titlecard');
      }
    }, 900);
    return () => {
      clearTimeout(timer);
      clearTimeout(pulseTimer);
    };
  }, [stage, count]);

  // Putar video pembuka; jika gagal / terlalu lama dimuat, lanjut ke title card.
  useEffect(() => {
    if (stage !== 'video') return;
    const video = videoRef.current;
    if (!video) {
      setStage('titlecard');
      return;
    }
    let started = false;
    const finish = () => {
      startMusic();
      if (stageRef.current === 'video') goTo('titlecard');
    };
    const onPlaying = () => {
      started = true;
    };
    const timeout = setTimeout(() => {
      if (!started) finish();
    }, VIDEO_START_TIMEOUT_MS);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);
    video.currentTime = 0;
    video.muted = false;
    video.play().catch(() => {
      // Browser menolak suara: putar tanpa suara dan tampilkan tombol nyalakan suara.
      video.muted = true;
      setVideoMuted(true);
      video.play().catch(finish);
    });

    return () => {
      clearTimeout(timeout);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('ended', finish);
      video.removeEventListener('error', finish);
    };
  }, [stage]);

  // Title card otomatis lanjut ke undangan
  useEffect(() => {
    if (stage !== 'titlecard') return;
    const timer = setTimeout(exit, prefersReducedMotion() ? TITLECARD_REDUCED_MS : TITLECARD_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  /** Isi tiap tahap memudar keluar sebelum diganti tahap berikutnya. */
  const stageFade = `transition-opacity duration-300 ease-out ${leaving ? 'opacity-0' : 'opacity-100'}`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#171412] text-[#F6EFE1] select-none overflow-hidden transition-opacity ease-out ${
        stage === 'exiting' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${INTRO_EXIT_MS}ms` }}
    >
      {/* Skip Button (always accessible) */}
      <button
        onClick={handleSkip}
        className="absolute bottom-6 right-6 z-50 px-4 py-2 text-xs font-['Courier_Prime'] uppercase tracking-widest text-[#CDBE9F] hover:text-[#F6EFE1] border border-[#CDBE9F]/40 hover:border-[#F6EFE1] transition-all bg-[#171412]/80 backdrop-blur-sm cursor-pointer shadow-[2px_2px_0px_#B4392B]"
        aria-label="Lewati intro dan langsung buka undangan"
      >
        Lewati Intro ›
      </button>

      {/* Video pembuka: selalu ada di DOM (tersembunyi) agar bisa dimuat lebih awal */}
      {introVideoUrl && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center bg-black px-3 sm:px-10 transition-opacity duration-500 ease-out ${
            stage === 'video' && !leaving ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={stage !== 'video'}
        >
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between font-['Courier_Prime'] text-[10px] sm:text-[11px] uppercase tracking-widest text-[#D7A13E] pb-2">
              <span>{weddingConfig.filmEdgeText}</span>
              <span className="text-[#F6EFE1]">● REEL 01 · NOW PLAYING</span>
            </div>
            <div className="relative border-2 border-[#F6EFE1]/60 bg-black shadow-[0_0_60px_rgba(215,161,62,0.15)]">
              <video
                ref={videoRef}
                src={introVideoUrl}
                preload="none"
                playsInline
                className="w-full max-h-[75vh] object-contain block"
                aria-label="Video pembuka undangan"
              />
              {stage === 'video' && videoMuted && (
                <button
                  onClick={() => {
                    const v = videoRef.current;
                    if (!v) return;
                    v.muted = false;
                    setVideoMuted(false);
                  }}
                  className="absolute top-3 left-3 px-3 py-2 bg-[#171412]/85 border border-[#F6EFE1]/50 text-[#F6EFE1] font-['Courier_Prime'] text-xs uppercase tracking-wider cursor-pointer hover:bg-[#B4392B]"
                >
                  🔊 Nyalakan suara
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stage 1: Welcome Screen & Play Button */}
      {stage === 'welcome' && (
        <div className={`flex flex-col items-center text-center px-6 max-w-lg w-full animate-in fade-in zoom-in-95 duration-700 ${stageFade}`}>
          {/* Top Film Reel Marker */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[2px] bg-[#B4392B]" />
            <span className="font-['Courier_Prime'] text-[10px] tracking-[0.3em] uppercase text-[#D7A13E] font-bold">
              35MM PRODUCTION ARCHIVE
            </span>
            <div className="w-8 h-[2px] bg-[#B4392B]" />
          </div>

          <p className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#8C8274] mb-3">
            SEBUAH UNDANGAN KHUSUS UNTUK
          </p>

          <h2
            className={`font-['DM_Serif_Display'] italic text-2xl sm:text-3xl md:text-4xl text-[#F6EFE1] mb-6 leading-snug px-4 transition-opacity duration-500 ${
              guest.isPending ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {displayGuestName(guest.name, guest.salutation)}
          </h2>

          <div className="inline-block px-3 py-1 border border-[#F6EFE1]/20 bg-[#171412] mb-8">
            <p className="font-['Courier_Prime'] text-[11px] text-[#CDBE9F] tracking-widest uppercase">
              PREMIERE {weddingYear} · ROLL NO. 01 · 24 FPS
            </p>
          </div>

          {/* Interactive Play Trigger Button */}
          <div className="relative group">
            {/* Soft Ambient Glow */}
            <div className="absolute -inset-2 rounded-full bg-[#B4392B]/20 blur-md group-hover:bg-[#B4392B]/40 transition-all duration-500" />

            <button
              onClick={handleStart}
              className="relative flex flex-col items-center justify-center w-28 h-28 rounded-full border-2 border-[#F6EFE1] bg-[#171412] text-[#F6EFE1] group-hover:bg-[#B4392B] group-hover:border-[#B4392B] group-hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(246,239,225,0.15)] cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#D7A13E]/60"
              aria-label="Putar Undangan Film"
            >
              <span className="text-2xl pl-1 text-[#F6EFE1] group-hover:scale-110 transition-transform">
                ▶
              </span>
              <span className="font-['Courier_Prime'] text-[11px] tracking-[0.2em] uppercase font-bold mt-1 text-[#F6EFE1]">
                PUTAR
              </span>
            </button>
          </div>

          <p className="mt-8 font-['Courier_Prime'] text-[11px] text-[#8C8274] tracking-wider">
            (Klik untuk memutar hitungan mundur & musik)
          </p>
        </div>
      )}

      {/* Stage 2: Authentic SMPTE / Academy Film Leader Countdown */}
      {stage === 'countdown' && (
        <div className={`relative flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 ${stageFade}`}>
          {/* Main Calibrated Countdown Dial */}
          <div className="relative flex items-center justify-center w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96">
            {/* Outer Ring with Ticks */}
            <div className="absolute inset-0 rounded-full border-2 border-[#F6EFE1]/40" />
            <div className="absolute inset-2 rounded-full border border-[#F6EFE1]/20" />

            {/* Inner Ring */}
            <div className="absolute inset-10 rounded-full border border-[#F6EFE1]/30" />

            {/* Crosshairs (+) */}
            <div className="absolute w-full h-[1px] bg-[#F6EFE1]/40" />
            <div className="absolute h-full w-[1px] bg-[#F6EFE1]/40" />

            {/* Corner Calibrations (Hour Ticks) */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-[#F6EFE1]/60" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-[#F6EFE1]/60" />
            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-3 h-1 bg-[#F6EFE1]/60" />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-1 bg-[#F6EFE1]/60" />

            {/* Clockwise Radar Needle Sweep */}
            <div className="absolute inset-0 rounded-full radar-sweep pointer-events-none opacity-50">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, rgba(246,239,225,0.4) 0deg, rgba(215,161,62,0.2) 60deg, transparent 90deg, transparent 360deg)',
                }}
              />
            </div>

            {/* Bold Animated Countdown Number */}
            <div
              className={`relative z-10 font-['Anton'] text-[130px] sm:text-[160px] text-[#F6EFE1] leading-none drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] transition-transform duration-200 select-none ${
                pulseNumber ? 'scale-110 text-[#D7A13E]' : 'scale-100 text-[#F6EFE1]'
              }`}
            >
              {count}
            </div>

            {/* Dial Labels */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 font-['Courier_Prime'] text-[9px] sm:text-[10px] tracking-widest text-[#D7A13E] uppercase font-bold">
              {weddingConfig.filmEdgeText}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 font-['Courier_Prime'] text-[9px] sm:text-[10px] tracking-widest text-[#8C8274] uppercase">
              SOUND SYNC · 24 FPS
            </div>
          </div>

          {/* Authentic Cinema Metadata Footers */}
          <div className="mt-8 flex items-center gap-6 font-['Courier_Prime'] text-[11px] text-[#8C8274] uppercase tracking-widest">
            <span>PICTURE START</span>
            <span className="text-[#D7A13E]">● HEAD LEADER</span>
            <span>FRAME 00{count * 24}</span>
          </div>
        </div>
      )}

      {/* Stage 3: Silent Film Era Title Card (Staggered Reveal) */}
      {stage === 'titlecard' && (
        <div className={`flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-xl w-full animate-in fade-in zoom-in-95 duration-700 ${stageFade}`}>
          {/* Vintage Ornate Double Border */}
          <div className="w-full p-8 sm:p-12 border-2 border-[#F6EFE1] relative bg-[#171412] shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            {/* Inner secondary hairline border */}
            <div className="absolute -inset-1.5 border border-[#F6EFE1]/40 pointer-events-none" />

            {/* Art-deco corner ornaments */}
            <div className="absolute top-2 left-2 font-['Courier_Prime'] text-xs text-[#D7A13E]">❖</div>
            <div className="absolute top-2 right-2 font-['Courier_Prime'] text-xs text-[#D7A13E]">❖</div>
            <div className="absolute bottom-2 left-2 font-['Courier_Prime'] text-xs text-[#D7A13E]">❖</div>
            <div className="absolute bottom-2 right-2 font-['Courier_Prime'] text-xs text-[#D7A13E]">❖</div>

            {/* Staggered Line 1: Presented by */}
            <p className="reveal font-['Courier_Prime'] text-xs sm:text-sm uppercase tracking-[0.2em] text-[#CDBE9F] mb-4" style={revealDelay(250)}>
              {weddingConfig.presentedBy}
            </p>

            {/* Staggered Line 2: Lead-in */}
            <p className="reveal font-['Courier_Prime'] text-[10px] sm:text-xs uppercase tracking-[0.3em] text-[#8C8274] mb-4" style={revealDelay(450)}>
              DENGAN PENUH SYUKUR MEMPERSEMBAHKAN
            </p>

            {/* Staggered Line 3: Big Couple Title */}
            <h1 className="reveal font-['DM_Serif_Display'] text-4xl sm:text-6xl text-[#F6EFE1] mb-4 tracking-tight leading-none" style={revealDelay(700)}>
              {weddingConfig.couple.groom.callname}
              <span className="font-['DM_Serif_Display'] italic text-[#D7A13E] mx-3 text-3xl sm:text-5xl">
                &
              </span>
              {weddingConfig.couple.bride.callname}
            </h1>

            {/* Center Line Divider */}
            <div className="reveal w-20 h-[2px] bg-[#B4392B] mx-auto my-4" style={revealDelay(950)} />

            {/* Tagline */}
            <p className="reveal font-['Courier_Prime'] text-xs sm:text-sm tracking-widest uppercase text-[#D7A13E]" style={revealDelay(1100)}>
              {weddingConfig.tagline}
            </p>
            <p className="reveal font-['Courier_Prime'] text-[11px] text-[#8C8274] mt-2 tracking-wider" style={revealDelay(1250)}>
              {weddingDateLong.toUpperCase()} · {weddingConfig.city.toUpperCase()}
            </p>

            {/* Interactive "Buka Undangan" Action */}
            <div className="reveal mt-8 pt-4 border-t border-[#F6EFE1]/15" style={revealDelay(1500)}>
              <button
                onClick={handleSkip}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-['Courier_Prime'] uppercase tracking-widest font-bold bg-[#B4392B] text-[#F6EFE1] hover:bg-[#D7A13E] hover:text-[#171412] transition-colors cursor-pointer border border-[#F6EFE1]/40"
              >
                <span>▶</span> MASUKI PEMUTARAN FILM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
