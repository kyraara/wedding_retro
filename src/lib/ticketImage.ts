import { weddingConfig } from '../content/wedding.config';
import { RSVP } from '../types/wedding';
import { coupleNames, formatDateLong, formatTime, mainEvent, tzLabel } from './wedding';

const W = 1080;
const H = 1920;
const MARGIN = 80;
const INNER_LEFT = MARGIN + 60;
const INNER_WIDTH = W - MARGIN * 2 - 120;

const FONT_LOADS = [
  '900 110px Anton',
  'bold 36px "Courier Prime"',
  '36px "Courier Prime"',
  'italic 54px "DM Serif Display"',
];

/** Pecah teks menjadi beberapa baris agar muat di lebar tertentu. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Tulis teks dengan ukuran font yang mengecil otomatis sampai muat dalam `maxLines` baris.
 * Mengembalikan posisi y setelah baris terakhir.
 */
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  opts: { x: number; y: number; maxWidth: number; maxLines: number; font: (size: number) => string; size: number; minSize: number }
): number {
  let size = opts.size;
  let lines: string[] = [];
  do {
    ctx.font = opts.font(size);
    lines = wrapLines(ctx, text, opts.maxWidth);
    if (lines.length <= opts.maxLines && lines.every((l) => ctx.measureText(l).width <= opts.maxWidth)) break;
    size -= 2;
  } while (size > opts.minSize);

  if (lines.length > opts.maxLines) {
    lines = lines.slice(0, opts.maxLines);
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\S*$/, '') + '…';
  }

  const lineHeight = size * 1.2;
  lines.forEach((l, i) => ctx.fillText(l, opts.x, opts.y + i * lineHeight));
  return opts.y + (lines.length - 1) * lineHeight;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Render tiket premiere 1080x1920 (siap untuk story / wallpaper) sebagai PNG Blob. */
export async function renderTicketImage(rsvp: RSVP, qrDataUrl: string): Promise<Blob> {
  // Pastikan web font sudah dimuat agar tidak jatuh ke font default.
  try {
    await Promise.all(FONT_LOADS.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  } catch {
    // lanjut dengan font yang tersedia
  }

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas tidak didukung');

  const tWidth = W - MARGIN * 2;
  const tHeight = H - MARGIN * 2;

  // Latar & badan tiket
  ctx.fillStyle = '#EFE5D0';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#E3D5B8';
  ctx.fillRect(MARGIN, MARGIN, tWidth, tHeight);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#171412';
  ctx.strokeRect(MARGIN, MARGIN, tWidth, tHeight);

  // Pita atas
  ctx.fillStyle = '#B4392B';
  ctx.fillRect(MARGIN, MARGIN, tWidth, 120);
  ctx.fillStyle = '#F6EFE1';
  ctx.font = 'bold 36px "Courier Prime", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ OFFICIAL CINEMA ADMISSION PASS ★', W / 2, MARGIN + 74);

  // Judul
  ctx.fillStyle = '#171412';
  ctx.font = '900 110px Anton, sans-serif';
  ctx.fillText('THE PREMIERE', W / 2, 360);

  ctx.fillStyle = '#A87A1F';
  drawFittedText(ctx, weddingConfig.tagline, {
    x: W / 2, y: 440, maxWidth: INNER_WIDTH, maxLines: 1, size: 52, minSize: 30,
    font: (s) => `italic ${s}px "DM Serif Display", serif`,
  });

  ctx.fillStyle = '#171412';
  drawFittedText(ctx, coupleNames.toUpperCase(), {
    x: W / 2, y: 580, maxWidth: INNER_WIDTH, maxLines: 1, size: 96, minSize: 56,
    font: (s) => `900 ${s}px Anton, sans-serif`,
  });

  // Garis perforasi
  ctx.setLineDash([16, 12]);
  ctx.strokeStyle = '#8C8274';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(MARGIN, 700);
  ctx.lineTo(W - MARGIN, 700);
  ctx.stroke();
  ctx.setLineDash([]);

  // Detail tiket
  ctx.textAlign = 'left';
  ctx.fillStyle = '#6B6156';
  ctx.font = 'bold 30px "Courier Prime", monospace';
  ctx.fillText('PENONTON (GUEST NAME):', INNER_LEFT, 780);

  ctx.fillStyle = '#171412';
  const nameBottom = drawFittedText(ctx, rsvp.name, {
    x: INNER_LEFT, y: 850, maxWidth: INNER_WIDTH, maxLines: 2, size: 54, minSize: 34,
    font: (s) => `italic ${s}px "DM Serif Display", serif`,
  });

  let y = Math.max(960, nameBottom + 90);
  ctx.fillStyle = '#6B6156';
  ctx.font = 'bold 28px "Courier Prime", monospace';
  ctx.fillText('TANGGAL (DATE):', INNER_LEFT, y);
  ctx.fillText('JUMLAH KURSI:', 580, y);

  y += 60;
  ctx.fillStyle = '#171412';
  drawFittedText(ctx, formatDateLong(mainEvent.dateISO).toUpperCase(), {
    x: INNER_LEFT, y, maxWidth: 580 - INNER_LEFT - 30, maxLines: 1, size: 34, minSize: 22,
    font: (s) => `bold ${s}px "Courier Prime", monospace`,
  });
  ctx.font = '30px "Courier Prime", monospace';
  ctx.fillText(`PUKUL ${formatTime(mainEvent.dateISO)} ${tzLabel}`, INNER_LEFT, y + 44);
  ctx.font = 'bold 40px "Courier Prime", monospace';
  ctx.fillText(`ADMIT ${rsvp.pax}`, 580, y);

  y += 140;
  ctx.fillStyle = '#6B6156';
  ctx.font = 'bold 28px "Courier Prime", monospace';
  ctx.fillText('LOKASI (VENUE):', INNER_LEFT, y);

  ctx.fillStyle = '#171412';
  const venueBottom = drawFittedText(ctx, mainEvent.venue.toUpperCase(), {
    x: INNER_LEFT, y: y + 60, maxWidth: INNER_WIDTH, maxLines: 2, size: 36, minSize: 26,
    font: (s) => `bold ${s}px "Courier Prime", monospace`,
  });
  const cityY = venueBottom + 48;
  ctx.font = '30px "Courier Prime", monospace';
  ctx.fillText(`${weddingConfig.city.toUpperCase()}, ${weddingConfig.region.toUpperCase()}`, INNER_LEFT, cityY);

  // QR code: posisi menyesuaikan panjang konten di atasnya
  const QR_SIZE = 280;
  const qrY = Math.min(1420, Math.max(1340, cityY + 60));
  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, W / 2 - QR_SIZE / 2, qrY, QR_SIZE, QR_SIZE);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#B4392B';
  ctx.font = 'bold 36px "Courier Prime", monospace';
  ctx.fillText(`TICKET NO: ${rsvp.ticketCode}`, W / 2, qrY + QR_SIZE + 60);

  ctx.fillStyle = '#6B6156';
  ctx.font = '24px "Courier Prime", monospace';
  ctx.fillText('HARAP TUNJUKKAN KODE QR INI DI MEJA REGISTRASI', W / 2, qrY + QR_SIZE + 105);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat gambar'))), 'image/png')
  );
}
