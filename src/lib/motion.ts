import type { CSSProperties } from 'react';

/** Jeda animasi `.reveal` / `.hero-reveal` (lihat index.css), misal style={revealDelay(300)}. */
export const revealDelay = (ms: number): CSSProperties => ({ '--d': `${ms}ms` }) as CSSProperties;

/** Lama overlay intro memudar; konten utama masuk bersamaan. */
export const INTRO_EXIT_MS = 800;
