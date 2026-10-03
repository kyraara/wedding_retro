import { useEffect, useState } from 'react';
import { weddingConfig } from '../content/wedding.config';
import { weddingEnd, weddingStart } from './wedding';

/**
 * before: sebelum acara pertama dimulai
 * live:   di antara mulai acara pertama dan selesai acara terakhir
 * after:  setelah semua acara selesai
 */
export type EventPhase = 'before' | 'live' | 'after';

const PHASES: EventPhase[] = ['before', 'live', 'after'];

/** Override fase lewat `?preview=before|live|after` (hanya jika demoMode aktif). */
export function getPreviewPhase(): EventPhase | null {
  if (!weddingConfig.demoMode) return null;
  const value = new URLSearchParams(window.location.search).get('preview');
  return PHASES.includes(value as EventPhase) ? (value as EventPhase) : null;
}

export function computePhase(now = Date.now()): EventPhase {
  if (now < weddingStart) return 'before';
  if (now <= weddingEnd) return 'live';
  return 'after';
}

export function useEventPhase(): EventPhase {
  const [phase, setPhase] = useState<EventPhase>(() => getPreviewPhase() ?? computePhase());

  useEffect(() => {
    if (getPreviewPhase()) return;
    const id = setInterval(() => setPhase(computePhase()), 30_000);
    return () => clearInterval(id);
  }, []);

  return phase;
}

/** Konfirmasi kehadiran masih dibuka? */
export function isRsvpOpen(phase: EventPhase, now = Date.now()): boolean {
  if (phase !== 'before') return false;
  // Saat preview "before", selalu buka agar demo tetap bisa dicoba.
  if (getPreviewPhase() === 'before') return true;
  return now <= new Date(weddingConfig.rsvp.deadlineISO).getTime();
}
