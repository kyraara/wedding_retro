/** Unduh Blob sebagai file. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type Cell = string | number | boolean | null | undefined;

function escapeCsvCell(value: Cell): string {
  const s = value == null ? '' : String(value);
  return /[",;\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Buat & unduh CSV yang rapi dibuka di Excel (UTF-8 BOM). */
export function downloadCsv(filename: string, headers: string[], rows: Cell[][]): void {
  const content = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  downloadBlob(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' }), filename);
}

/**
 * Parser CSV sederhana: mendukung tanda kutip, baris baru di dalam kutip,
 * dan pemisah koma atau titik-koma (Excel berbahasa Indonesia).
 */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Salin teks ke clipboard, dengan fallback untuk konteks non-HTTPS. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    const ok = document.execCommand('copy');
    textArea.remove();
    return ok;
  } catch {
    return false;
  }
}
