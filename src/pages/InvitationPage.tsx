import React, { useEffect, useRef, useState } from 'react';
import { weddingConfig } from '../content/wedding.config';
import { FilmOverlay } from '../components/FilmOverlay';
import { FilmLeader } from '../components/FilmLeader';
import { NowShowingHero } from '../components/NowShowingHero';
import { SynopsisQuote } from '../components/SynopsisQuote';
import { CastSection } from '../components/CastSection';
import { ShowtimesSection } from '../components/ShowtimesSection';
import { BehindTheScenes } from '../components/BehindTheScenes';
import { CelluloidStrip } from '../components/CelluloidStrip';
import { TrailerSection } from '../components/TrailerSection';
import { PostEventGallery } from '../components/PostEventGallery';
import { DigitalEnvelope } from '../components/DigitalEnvelope';
import { TicketRsvp } from '../components/TicketRsvp';
import { GuestReviews } from '../components/GuestReviews';
import { ClosingCredits } from '../components/ClosingCredits';
import { FloatingControls } from '../components/FloatingControls';
import { store } from '../lib/store';
import { coupleNames } from '../lib/wedding';
import { useEventPhase } from '../lib/eventPhase';
import { INTRO_EXIT_MS } from '../lib/motion';
import { ActiveGuest } from '../types/wedding';

const INTRO_SEEN_KEY = 'premiere_intro_seen';
const DEFAULT_GUEST_NAME = 'Tamu Undangan Yang Terhormat';

function readGuestCode(): string {
  const params = new URLSearchParams(window.location.search);
  return (params.get('to') || params.get('u') || params.get('guest') || '').trim();
}

/**
 * Tamu umum sampai kode di URL terbukti ada di daftar tamu. Kode yang tidak terdaftar tidak dipakai
 * sama sekali: namanya tidak ditampilkan (cegah teks palsu lewat URL) dan tidak dijadikan kode tiket
 * (cegah banyak orang dengan link yang sama saling menimpa RSVP).
 */
const PUBLIC_GUEST: ActiveGuest = { code: '', name: DEFAULT_GUEST_NAME, maxPax: 2, isRegistered: false };

export const InvitationPage: React.FC = () => {
  const [guest, setGuest] = useState<ActiveGuest>(() => ({ ...PUBLIC_GUEST, isPending: !!readGuestCode() }));
  // playing: intro menutupi layar · exiting: intro memudar & konten masuk · done: intro dilepas
  const [introPhase, setIntroPhase] = useState<'playing' | 'exiting' | 'done'>(() => {
    try {
      return sessionStorage.getItem(INTRO_SEEN_KEY) === 'true' ? 'done' : 'playing';
    } catch {
      return 'playing';
    }
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [filmEffectsEnabled, setFilmEffectsEnabled] = useState(true);
  const phase = useEventPhase();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { sections } = weddingConfig;

  useEffect(() => {
    document.title = `The Premiere · ${coupleNames}`;
    // Muat poster lebih awal selama intro agar tidak "muncul belakangan" saat halaman masuk.
    if (weddingConfig.posterImage) new Image().src = weddingConfig.posterImage;
  }, []);

  // Kunci scroll halaman di balik intro, dan mulai dari atas saat intro selesai.
  useEffect(() => {
    if (introPhase !== 'playing') return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'instant' });
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [introPhase]);

  // Cocokkan kode di URL dengan daftar tamu & catat bahwa undangan dibuka.
  useEffect(() => {
    const code = readGuestCode();
    if (!code) return;
    let cancelled = false;

    store
      .getGuestByCode(code)
      .then((matched) => {
        if (cancelled) return;
        if (!matched) {
          setGuest(PUBLIC_GUEST);
          return;
        }
        setGuest({
          code: matched.code,
          name: matched.name,
          salutation: matched.salutation,
          maxPax: matched.maxPax || 1,
          isRegistered: true,
        });

        // `nt=1` dipakai admin saat pratinjau agar tidak terhitung sebagai "dibuka".
        const noTrack = new URLSearchParams(window.location.search).get('nt') === '1';
        const trackKey = `premiere_opened_${matched.code.toLowerCase()}`;
        try {
          if (!noTrack && !sessionStorage.getItem(trackKey)) {
            sessionStorage.setItem(trackKey, '1');
            store.trackOpen(matched.code).catch(() => {});
          }
        } catch {
          // abaikan
        }
      })
      .catch((err) => {
        console.error('Gagal mencocokkan kode tamu', err);
        if (!cancelled) setGuest(PUBLIC_GUEST);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const playAudio = () => {
    audioRef.current
      ?.play()
      .then(() => setIsPlayingAudio(true))
      .catch((err) => console.warn('Audio diblokir oleh browser:', err));
  };

  // Dipanggil dalam klik tamu: "buka kunci" elemen audio agar musik boleh diputar setelah video pembuka.
  const primeAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const unlock = audio.play();
    audio.pause();
    unlock?.catch(() => {});
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      playAudio();
    }
  };

  const handleReplayIntro = () => {
    try {
      sessionStorage.removeItem(INTRO_SEEN_KEY);
    } catch {
      // abaikan
    }
    setIntroPhase('playing');
  };

  return (
    <div className="min-h-screen bg-[#EFE5D0] text-[#171412] relative overflow-x-hidden selection:bg-[#B4392B] selection:text-[#F6EFE1]">
      {weddingConfig.audio.src && <audio ref={audioRef} src={weddingConfig.audio.src} loop preload="none" />}

      {/* Efek film 35mm (grain & vignette) */}
      <FilmOverlay enabled={filmEffectsEnabled} />

      {/* Intro film leader & title card */}
      {introPhase !== 'done' && (
        <FilmLeader
          guest={guest}
          onExit={() => setIntroPhase('exiting')}
          onComplete={() => setIntroPhase('done')}
          onStartAudio={playAudio}
          onPrimeAudio={primeAudio}
        />
      )}

      <main
        className={`relative z-10 transition-opacity ease-out ${
          introPhase === 'playing' ? 'opacity-0' : 'opacity-100 stage-enter'
        }`}
        style={{ transitionDuration: `${INTRO_EXIT_MS}ms` }}
        aria-hidden={introPhase === 'playing'}
      >
        <NowShowingHero guest={guest} phase={phase} />
        <SynopsisQuote />
        <CastSection />
        <ShowtimesSection phase={phase} />
        {phase === 'after' && <PostEventGallery />}
        {sections.story && weddingConfig.scenes.length > 0 && <BehindTheScenes />}
        {sections.trailer && <TrailerSection />}
        {sections.gallery && weddingConfig.stills.length > 0 && <CelluloidStrip />}
        {sections.envelope && <DigitalEnvelope />}
        {sections.rsvp && <TicketRsvp guest={guest} phase={phase} />}
        {sections.wishes && <GuestReviews initialGuestName={guest.code ? guest.name : ''} />}
        <ClosingCredits guest={guest} onReplay={handleReplayIntro} />
      </main>

      <FloatingControls
        isPlayingAudio={isPlayingAudio}
        onToggleAudio={toggleAudio}
        filmEffectsEnabled={filmEffectsEnabled}
        onToggleFilmEffects={() => setFilmEffectsEnabled((prev) => !prev)}
        onReplayIntro={handleReplayIntro}
      />
    </div>
  );
};
