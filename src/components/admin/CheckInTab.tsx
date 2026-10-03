import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff, Search, Undo2 } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';
import { RSVP } from '../../types/wedding';
import { store } from '../../lib/store';
import { parseTicketCode } from '../../lib/ticket';
import { formatDateTimeLocal } from '../../lib/wedding';
import type { AdminData } from '../../pages/AdminPage';
import { ATTENDANCE_LABEL, btnDark, btnPrimary, btnSecondary, inputCls, panelCls } from './ui';

const READER_ID = 'checkin-reader';

type ScanResult = { kind: 'found'; rsvp: RSVP } | { kind: 'not_found'; code: string };

function beep(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 1046 : 220;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // abaikan
  }
}

interface CheckInTabProps {
  data: AdminData;
  reload: () => Promise<void>;
}

export const CheckInTab: React.FC<CheckInTabProps> = ({ data, reload }) => {
  const { rsvps } = data;
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [pax, setPax] = useState(1);
  const [query, setQuery] = useState('');
  const [flash, setFlash] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const resultRef = useRef<ScanResult | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  resultRef.current = result;

  const hadir = rsvps.filter((r) => r.attendance === 'hadir');
  const expectedPax = hadir.reduce((s, r) => s + r.pax, 0);
  const checkedIn = rsvps
    .filter((r) => r.checkedInAt)
    .sort((a, b) => (b.checkedInAt ?? '').localeCompare(a.checkedInAt ?? ''));
  const arrivedPax = checkedIn.reduce((s, r) => s + (r.checkedInPax ?? r.pax), 0);
  const progress = expectedPax ? Math.min(100, Math.round((arrivedPax / expectedPax) * 100)) : 0;

  const lookup = useCallback(async (raw: string) => {
    const code = parseTicketCode(raw);
    if (!code) return false;
    setQuery('');
    let rsvp;
    try {
      rsvp = await store.getRsvpByTicket(code);
    } catch (err) {
      console.error(err);
      setFlash('⚠ Gagal memeriksa tiket. Periksa koneksi lalu coba lagi.');
      beep(false);
      return true;
    }
    if (rsvp) {
      setResult({ kind: 'found', rsvp });
      setPax(rsvp.checkedInPax ?? Math.max(1, rsvp.pax));
      beep(!rsvp.checkedInAt && rsvp.attendance === 'hadir');
    } else {
      setResult({ kind: 'not_found', code });
      beep(false);
    }
    return true;
  }, []);

  // --- Kamera ---
  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      // sudah berhenti
    }
  }, []);

  const startScanner = async () => {
    setCameraError('');
    if (!window.isSecureContext) {
      setCameraError(
        'Kamera hanya bisa dipakai lewat HTTPS atau localhost. Untuk demo dari HP, jalankan "npm run dev:https" lalu buka alamat https:// di HP.'
      );
      return;
    }
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(READER_ID, { verbose: false });
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => {
          const size = Math.floor(Math.min(w, h) * 0.7);
          return { width: size, height: size };
        } },
        (text) => {
          // Abaikan saat hasil sebelumnya masih ditampilkan / QR yang sama discan berulang
          const now = Date.now();
          if (resultRef.current) return;
          if (lastScanRef.current.code === text && now - lastScanRef.current.at < 3000) return;
          lastScanRef.current = { code: text, at: now };
          lookup(text);
        },
        () => {}
      );
    } catch (err) {
      console.error(err);
      setCameraError('Kamera tidak dapat diakses. Pastikan izin kamera diberikan di browser.');
      await stopScanner();
    }
  };

  useEffect(() => () => void stopScanner(), [stopScanner]);

  // --- Input manual / cari nama ---
  const nameMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return rsvps
      .filter((r) => r.attendance === 'hadir' && (r.name.toLowerCase().includes(q) || r.ticketCode.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [query, rsvps]);

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const exact = rsvps.find((r) => r.ticketCode.toLowerCase() === query.trim().toLowerCase());
    if (exact || nameMatches.length === 0) await lookup(query);
    else if (nameMatches.length === 1) await lookup(nameMatches[0].ticketCode);
  };

  // --- Aksi ---
  const doCheckIn = async (rsvp: RSVP) => {
    try {
      await store.checkIn(rsvp.ticketCode, pax);
    } catch (err) {
      console.error(err);
      setFlash(`⚠ Check-in ${rsvp.name} GAGAL disimpan. Periksa koneksi lalu coba lagi.`);
      return;
    }
    setFlash(`✓ ${rsvp.name} (${pax} orang) berhasil check-in`);
    setResult(null);
    setQuery('');
    reload().catch(console.error);
  };

  const doUndo = async (rsvp: RSVP) => {
    let updated: RSVP;
    try {
      updated = await store.undoCheckIn(rsvp.ticketCode);
    } catch (err) {
      console.error(err);
      setFlash(`⚠ Gagal membatalkan check-in ${rsvp.name}. Periksa koneksi lalu coba lagi.`);
      return;
    }
    setResult((cur) => (cur?.kind === 'found' && cur.rsvp.ticketCode === rsvp.ticketCode ? { kind: 'found', rsvp: updated } : cur));
    setFlash(`Check-in ${rsvp.name} dibatalkan`);
    reload().catch(console.error);
  };

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 3000);
    return () => clearTimeout(t);
  }, [flash]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-4">
        {/* Progres kedatangan */}
        <div className={panelCls}>
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="font-['Courier_Prime'] text-[11px] uppercase font-bold tracking-wider text-[#3C6966] block">
                Tamu datang
              </span>
              <span className="font-['Anton'] text-4xl leading-none tabular-nums">
                {arrivedPax}
                <span className="text-xl text-[#4A413A]"> / {expectedPax} orang</span>
              </span>
            </div>
            <span className="font-['Courier_Prime'] text-xs text-[#4A413A]">
              {checkedIn.length} dari {hadir.length} tiket
            </span>
          </div>
          <div
            className="h-3 border-2 border-[#171412] bg-[#EFE5D0]"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progres kedatangan tamu"
          >
            <div className="h-full bg-[#3C6966] transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Scanner */}
        <div className={panelCls}>
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#B4392B] font-bold">
              Scan QR tiket
            </span>
            {scanning ? (
              <button onClick={stopScanner} className={btnSecondary}>
                <CameraOff className="w-3.5 h-3.5" /> Hentikan kamera
              </button>
            ) : (
              <button onClick={startScanner} className={btnDark}>
                <Camera className="w-3.5 h-3.5" /> Mulai kamera
              </button>
            )}
          </div>

          <div
            id={READER_ID}
            className={`w-full overflow-hidden bg-[#171412] ${scanning ? 'min-h-64 border-2 border-[#171412]' : 'h-0'}`}
          />
          {!scanning && (
            <div className="border-2 border-dashed border-[#171412] p-6 text-center font-['Work_Sans'] text-sm text-[#4A413A]">
              Tekan <strong>Mulai kamera</strong> lalu arahkan ke QR code pada tiket tamu.
            </div>
          )}
          {cameraError && (
            <p role="alert" className="mt-2 font-['Courier_Prime'] text-xs text-[#B4392B] font-bold">
              {cameraError}
            </p>
          )}

          {/* Input manual */}
          <form onSubmit={submitManual} className="mt-4 relative">
            <label htmlFor="checkin-query" className="block font-['Courier_Prime'] text-[11px] uppercase font-bold mb-1">
              Atau ketik kode tiket / nama tamu
            </label>
            <div className="flex gap-2">
              <input
                id="checkin-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ANDI-WIJAYA atau Andi"
                className={inputCls}
                autoComplete="off"
              />
              <button type="submit" className={btnPrimary} aria-label="Cari tiket">
                <Search className="w-4 h-4" />
              </button>
            </div>
            {nameMatches.length > 0 && !result && (
              <ul className="mt-2 border-2 border-[#171412] bg-[#EFE5D0] divide-y divide-[#171412]/20">
                {nameMatches.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => lookup(r.ticketCode)}
                      className="w-full text-left px-3 py-2 hover:bg-[#E3D5B8] cursor-pointer flex items-center justify-between gap-2"
                    >
                      <span className="font-['Work_Sans'] text-sm font-semibold">{r.name}</span>
                      <span className="font-['Courier_Prime'] text-[11px] text-[#4A413A]">
                        {r.checkedInAt ? '✓ sudah datang' : `${r.pax} pax · ${r.ticketCode}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>

        {flash && (
          <div
            role="status"
            className={`border-2 border-[#171412] ${flash.startsWith('⚠') ? 'bg-[#B4392B]' : 'bg-[#3C6966]'} text-[#F6EFE1] p-3 font-['Courier_Prime'] text-sm font-bold`}
          >
            {flash}
          </div>
        )}

        {/* Hasil scan */}
        {result && (
          <div role="status" aria-live="assertive" className="border-2 border-[#171412] bg-[#EFE5D0] shadow-[6px_6px_0px_#171412]">
            {result.kind === 'not_found' ? (
              <div className="p-5 border-l-8 border-[#B4392B]">
                <span className="font-['Anton'] text-2xl uppercase text-[#B4392B]">Tiket tidak ditemukan</span>
                <p className="font-['Work_Sans'] text-sm text-[#4A413A] mt-1">
                  Kode <strong>{result.code}</strong> tidak ada di daftar RSVP. Cek nama tamu secara manual.
                </p>
                <button onClick={() => setResult(null)} className={`${btnSecondary} mt-4`}>
                  Scan lagi
                </button>
              </div>
            ) : (
              (() => {
                const r = result.rsvp;
                const already = !!r.checkedInAt;
                const notAttending = r.attendance !== 'hadir';
                const accent = already ? '#D7A13E' : notAttending ? '#B4392B' : '#3C6966';
                return (
                  <div className="p-5 border-l-8" style={{ borderColor: accent }}>
                    <span className="font-['Courier_Prime'] text-[11px] uppercase font-bold tracking-wider" style={{ color: accent }}>
                      {already
                        ? `⚠ Sudah check-in ${formatDateTimeLocal(r.checkedInAt)}`
                        : notAttending
                          ? `⚠ RSVP: ${ATTENDANCE_LABEL[r.attendance]}`
                          : '✓ Tiket valid'}
                    </span>
                    <h3 className="font-['Anton'] text-3xl uppercase text-[#171412] leading-tight mt-1">{r.name}</h3>
                    <p className="font-['Courier_Prime'] text-xs text-[#4A413A] mt-1">
                      {r.ticketCode} · konfirmasi {r.pax} kursi
                      {r.note ? ` · "${r.note}"` : ''}
                    </p>

                    {!already && (
                      <div className="flex items-center gap-3 mt-4">
                        <span className="font-['Courier_Prime'] text-[11px] uppercase font-bold">Jumlah datang:</span>
                        <button
                          onClick={() => setPax((p) => Math.max(1, p - 1))}
                          className="w-9 h-9 border-2 border-[#171412] bg-[#E3D5B8] font-['Anton'] text-lg cursor-pointer"
                          aria-label="Kurangi"
                        >
                          -
                        </button>
                        <span className="font-['Anton'] text-2xl w-8 text-center tabular-nums">{pax}</span>
                        <button
                          onClick={() => setPax((p) => Math.min(20, p + 1))}
                          className="w-9 h-9 border-2 border-[#171412] bg-[#E3D5B8] font-['Anton'] text-lg cursor-pointer"
                          aria-label="Tambah"
                        >
                          +
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-5">
                      {!already ? (
                        <button onClick={() => doCheckIn(r)} className={`${btnPrimary} py-3 px-5 text-sm`}>
                          {notAttending ? 'Tetap check-in' : 'Check-in sekarang'}
                        </button>
                      ) : (
                        <button onClick={() => doUndo(r)} className={btnSecondary}>
                          <Undo2 className="w-3.5 h-3.5" /> Batalkan check-in
                        </button>
                      )}
                      <button onClick={() => setResult(null)} className={btnSecondary}>
                        {already ? 'Scan lagi' : 'Batal'}
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* Riwayat check-in */}
      <div className="lg:col-span-2">
        <div className={panelCls}>
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold block mb-3">
            Kedatangan terbaru
          </span>
          {checkedIn.length === 0 ? (
            <p className="font-['Work_Sans'] text-sm text-[#4A413A]">Belum ada tamu yang check-in.</p>
          ) : (
            <ul className="divide-y divide-[#171412]/20 max-h-[32rem] overflow-y-auto">
              {checkedIn.map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-['Work_Sans'] text-sm font-semibold block truncate">{r.name}</span>
                    <span className="font-['Courier_Prime'] text-[11px] text-[#4A413A]">
                      {formatDateTimeLocal(r.checkedInAt)} · {r.checkedInPax ?? r.pax} orang
                    </span>
                  </div>
                  <button
                    onClick={() => doUndo(r)}
                    className="shrink-0 p-1.5 text-[#4A413A] hover:text-[#B4392B] cursor-pointer"
                    title="Batalkan check-in"
                    aria-label={`Batalkan check-in ${r.name}`}
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
