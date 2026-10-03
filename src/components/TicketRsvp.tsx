import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { weddingConfig } from '../content/wedding.config';
import { ActiveGuest, Attendance, RSVP } from '../types/wedding';
import { getMyTicketCode, setMyTicketCode, store } from '../lib/store';
import { EventPhase, isRsvpOpen } from '../lib/eventPhase';
import { downloadBlob, copyText } from '../lib/files';
import { buildTicketQrPayload, generateTicketCode } from '../lib/ticket';
import { renderTicketImage } from '../lib/ticketImage';
import { coupleNames, formatDateShort, formatTime, mainEvent, tzLabel, weddingDateLong } from '../lib/wedding';

interface TicketRsvpProps {
  guest: ActiveGuest;
  phase: EventPhase;
}

const ATTENDANCE_OPTIONS: Array<{ value: Attendance; label: string }> = [
  { value: 'hadir', label: '✓ HADIR' },
  { value: 'tidak_hadir', label: '✕ TIDAK HADIR' },
  { value: 'ragu', label: '? MASIH RAGU' },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Pesan penolakan dari server (lihat submit_rsvp di supabase/schema.sql) yang aman ditampilkan ke tamu. */
const SERVER_MESSAGES = ['Batas waktu konfirmasi kehadiran sudah lewat'];

export const TicketRsvp: React.FC<TicketRsvpProps> = ({ guest, phase }) => {
  const maxPax = Math.max(1, guest.maxPax);
  const rsvpOpen = isRsvpOpen(phase);

  const [name, setName] = useState(guest.name);
  const [attendance, setAttendance] = useState<Attendance>('hadir');
  const [pax, setPax] = useState<number>(1);
  const [note, setNote] = useState('');
  const [currentRsvp, setCurrentRsvp] = useState<RSVP | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  // Tamu terdaftar (link personal): kode tiket = kode tamu. Selain itu: kode tiket acak yang pernah dibuat di perangkat ini.
  const knownTicketCode = guest.isRegistered ? guest.code.toUpperCase() : getMyTicketCode();

  // Muat RSVP yang sudah ada (hanya milik tamu ini)
  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);
    if (guest.isPending) return;
    const load = knownTicketCode ? store.getRsvpByTicket(knownTicketCode) : Promise.resolve(undefined);
    load.then((existing) => {
      if (cancelled) return;
      setCurrentRsvp(existing ?? null);
      if (existing) {
        setName(existing.name);
        setAttendance(existing.attendance);
        setPax(clamp(existing.pax || 1, 1, maxPax));
        setNote(existing.note || '');
      } else {
        setName(guest.isRegistered ? guest.name : '');
        setPax((p) => clamp(p, 1, maxPax));
      }
      setIsLoaded(true);
    }).catch((err) => {
      console.error('Gagal memuat RSVP', err);
      if (!cancelled) setIsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [knownTicketCode, guest.name, guest.isRegistered, guest.isPending, maxPax]);

  // Buat QR saat tiket "hadir" tersedia
  useEffect(() => {
    if (!currentRsvp || currentRsvp.attendance !== 'hadir') return;
    QRCode.toDataURL(buildTicketQrPayload(currentRsvp), {
      width: 320,
      margin: 1,
      color: { dark: '#171412', light: '#E3D5B8' },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('Gagal membuat QR', err));
  }, [currentRsvp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rsvpOpen) return;
    setError('');
    setIsSaving(true);

    const ticketCode = currentRsvp?.ticketCode ?? knownTicketCode ?? generateTicketCode();
    const now = new Date().toISOString();
    const newRsvp: RSVP = {
      ...currentRsvp,
      id: currentRsvp?.id || 'rsvp-' + Date.now(),
      guestCode: guest.isRegistered ? guest.code : currentRsvp?.guestCode,
      ticketCode,
      name: name.trim().slice(0, 80),
      attendance,
      pax: attendance === 'hadir' ? clamp(pax, 1, maxPax) : 0,
      note: note.trim().slice(0, 500),
      createdAt: currentRsvp?.createdAt || now,
      updatedAt: now,
    };

    try {
      const saved = await store.saveRsvp(newRsvp);
      if (!guest.isRegistered) setMyTicketCode(saved.ticketCode);
      setCurrentRsvp(saved);
      setPax(clamp(saved.pax || 1, 1, maxPax));
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? SERVER_MESSAGES.find((m) => err.message.includes(m)) : undefined;
      setError(message ? `${message}.` : 'Konfirmasi gagal disimpan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!currentRsvp) return;
    const shareText = `Tiket Premiere Pernikahan ${coupleNames} untuk ${currentRsvp.name}. Saksikan pemutaran perdana ikatan suci kami pada ${weddingDateLong} di ${weddingConfig.city}!`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Tiket Premiere ${coupleNames}`, text: shareText, url });
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
      }
    }
    if (await copyText(`${shareText}\n${url}`)) {
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  const handleDownloadTicket = async () => {
    if (!currentRsvp || !qrDataUrl) return;
    setIsDownloading(true);
    try {
      const blob = await renderTicketImage(currentRsvp, qrDataUrl);
      downloadBlob(blob, `tiket-premiere-${currentRsvp.ticketCode}.png`);
    } catch (err) {
      console.error(err);
      setError('Gagal membuat gambar tiket.');
    } finally {
      setIsDownloading(false);
    }
  };

  const showForm = rsvpOpen && isLoaded && (!currentRsvp || isEditing);
  const showClosed = !rsvpOpen && isLoaded && !currentRsvp;

  return (
    <section id="rsvp-section" className="px-4 sm:px-6 py-16 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-10">
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#B4392B] block mb-2 font-bold">
          BOX OFFICE & RESERVATION
        </span>
        <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#171412]">
          {currentRsvp && !isEditing ? 'TIKET ANDA' : 'PESAN TIKET ANDA'}
        </h2>
        <div className="w-16 h-[2px] bg-[#171412] mx-auto mt-3" />
        {rsvpOpen && (
          <p className="font-['Work_Sans'] text-xs sm:text-sm text-[#4A413A] max-w-md mx-auto mt-3 leading-relaxed">
            Konfirmasi kehadiran Anda sebelum tanggal <strong>{formatDateShort(weddingConfig.rsvp.deadlineISO)}</strong>{' '}
            untuk mencetak tiket premiere digital resmi.
          </p>
        )}
      </div>

      {!isLoaded && <div className="max-w-2xl mx-auto h-64 bg-[#E3D5B8] border-2 border-[#171412] animate-pulse" />}

      {/* Box office tutup */}
      {showClosed && (
        <div className="max-w-xl mx-auto border-2 border-[#171412] bg-[#E3D5B8] p-8 shadow-[6px_6px_0px_#171412] text-center">
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#B4392B] font-bold">
            BOX OFFICE CLOSED
          </span>
          <h3 className="font-['Anton'] text-3xl uppercase text-[#171412] my-2">KONFIRMASI TELAH DITUTUP</h3>
          <p className="font-['Work_Sans'] text-sm text-[#4A413A] leading-relaxed">
            {phase === 'before'
              ? 'Batas waktu konfirmasi kehadiran telah lewat. Silakan hubungi keluarga mempelai jika ingin mengonfirmasi kehadiran.'
              : 'Terima kasih atas perhatian Anda. Doa restu Anda tetap dapat disampaikan melalui kolom ulasan di bawah.'}
          </p>
        </div>
      )}

      {/* Case 1: Form */}
      {showForm && (
        <div className="border-2 border-[#171412] bg-[#E3D5B8] p-6 sm:p-10 shadow-[6px_6px_0px_#171412] max-w-2xl mx-auto relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="rsvp-name"
                className="block font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold mb-2"
              >
                NAMA LENGKAP PENONTON / TAMU *
              </label>
              <input
                id="rsvp-name"
                type="text"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Rian & Pasangan"
                className="w-full px-4 py-3 border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] font-['Work_Sans'] text-sm focus:outline-none focus:border-[#B4392B] shadow-[2px_2px_0px_#171412]"
              />
            </div>

            {/* Status kehadiran: radio group aksesibel */}
            <fieldset>
              <legend className="block font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold mb-2">
                STATUS KEHADIRAN *
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ATTENDANCE_OPTIONS.map((opt) => (
                  <label key={opt.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="attendance"
                      value={opt.value}
                      checked={attendance === opt.value}
                      onChange={() => setAttendance(opt.value)}
                      className="peer sr-only"
                    />
                    <span className="block text-center py-3 px-2 text-xs font-['Courier_Prime'] uppercase tracking-wider font-bold border-2 border-[#171412] transition-all shadow-[2px_2px_0px_#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#CDBE9F] peer-checked:bg-[#171412] peer-checked:text-[#F6EFE1] peer-focus-visible:ring-2 peer-focus-visible:ring-[#B4392B] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#E3D5B8]">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {attendance === 'hadir' && (
              <div>
                <span
                  id="pax-label"
                  className="block font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold mb-2"
                >
                  JUMLAH KURSI (MAKSIMAL {maxPax} ORANG)
                </span>
                <div className="flex items-center gap-4" role="group" aria-labelledby="pax-label">
                  <button
                    type="button"
                    onClick={() => setPax((p) => clamp(p - 1, 1, maxPax))}
                    disabled={pax <= 1}
                    aria-label="Kurangi kursi"
                    className="w-11 h-11 border-2 border-[#171412] bg-[#EFE5D0] font-['Anton'] text-xl text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    -
                  </button>
                  <span
                    className="font-['Anton'] text-3xl text-[#171412] w-12 text-center tabular-nums"
                    aria-live="polite"
                  >
                    {pax}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPax((p) => clamp(p + 1, 1, maxPax))}
                    disabled={pax >= maxPax}
                    aria-label="Tambah kursi"
                    className="w-11 h-11 border-2 border-[#171412] bg-[#EFE5D0] font-['Anton'] text-xl text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <span className="font-['Courier_Prime'] text-xs text-[#6B6156] ml-2">{pax} Kursi Tamu</span>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="rsvp-note"
                className="block font-['Courier_Prime'] text-xs uppercase tracking-wider text-[#171412] font-bold mb-2"
              >
                CATATAN UNTUK MEMPELAI (OPSIONAL)
              </label>
              <textarea
                id="rsvp-note"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Misal: akan datang sedikit terlambat, atau pesan singkat untuk mempelai..."
                className="w-full px-4 py-3 border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] font-['Work_Sans'] text-sm focus:outline-none focus:border-[#B4392B] shadow-[2px_2px_0px_#171412]"
              />
            </div>

            {error && (
              <p role="alert" className="font-['Courier_Prime'] text-xs text-[#B4392B] font-bold">
                {error}
              </p>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-4 px-6 font-['Anton'] text-xl uppercase tracking-wider bg-[#B4392B] text-[#F6EFE1] border-2 border-[#171412] hover:bg-[#171412] transition-colors shadow-[4px_4px_0px_#171412] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span aria-hidden="true">🎟️</span>
                {isSaving ? 'MENYIMPAN...' : attendance === 'hadir' ? 'CETAK TIKET PREMIERE' : 'KIRIM KONFIRMASI'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 px-6 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#CDBE9F] shadow-[2px_2px_0px_#171412] cursor-pointer"
                >
                  BATAL
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Case 2: Tiket premiere (hadir) */}
      {currentRsvp && !isEditing && currentRsvp.attendance === 'hadir' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
          <div className="border-2 border-[#171412] bg-[#E3D5B8] shadow-[8px_8px_0px_#171412] relative overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-4 bg-[#B4392B] border-b-2 md:border-b-0 md:border-r-2 border-[#171412] py-2 md:py-0 flex items-center justify-center">
              <span className="font-['Courier_Prime'] text-[10px] uppercase tracking-widest text-[#F6EFE1] font-bold md:-rotate-90 whitespace-nowrap">
                PREMIERE ADMISSION
              </span>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#171412]/20 pb-2 mb-4">
                  <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#B4392B] font-bold">
                    GRAND PREMIERE SCREENING
                  </span>
                  <span className="font-['Anton'] text-xl sm:text-2xl text-[#171412]">ADMIT {currentRsvp.pax}</span>
                </div>

                <p className="font-['Courier_Prime'] text-[11px] uppercase tracking-widest text-[#6B6156]">
                  FEATURE PRESENTATION:
                </p>
                <h3 className="font-['Anton'] text-3xl sm:text-4xl uppercase text-[#171412] tracking-wide my-1">
                  {coupleNames}
                </h3>
                <p className="font-['DM_Serif_Display'] italic text-sm sm:text-base text-[#A87A1F] mb-4">
                  {weddingConfig.tagline}
                </p>

                <div className="p-3 bg-[#EFE5D0] border border-[#171412] mb-4">
                  <span className="font-['Courier_Prime'] text-[10px] uppercase tracking-widest text-[#6B6156] block">
                    NAMA PENONTON:
                  </span>
                  <span className="font-['DM_Serif_Display'] italic text-lg sm:text-xl text-[#171412] block break-words">
                    {currentRsvp.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-['Courier_Prime']">
                  <div>
                    <span className="text-[#6B6156] block">TANGGAL:</span>
                    <span className="font-bold text-[#171412]">{formatDateShort(mainEvent.dateISO).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6156] block">WAKTU:</span>
                    <span className="font-bold text-[#171412]">
                      {formatTime(mainEvent.dateISO)} {tzLabel}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#6B6156] block">LOKASI:</span>
                    <span className="font-bold text-[#171412]">{mainEvent.venue}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#171412]/20 flex items-center justify-between gap-2">
                <span className="font-['Courier_Prime'] text-[11px] text-[#6B6156] uppercase tracking-widest break-all">
                  TICKET ID: {currentRsvp.ticketCode}
                </span>
                {currentRsvp.checkedInAt ? (
                  <div className="rotate-[-8deg] border-2 border-[#3C6966] text-[#3C6966] px-3 py-0.5 font-['Courier_Prime'] text-[11px] font-bold tracking-widest uppercase shrink-0">
                    ✓ CHECKED-IN
                  </div>
                ) : (
                  <div className="rotate-[-8deg] border-2 border-[#B4392B] text-[#B4392B] px-3 py-0.5 font-['Courier_Prime'] text-[11px] font-bold tracking-widest uppercase shrink-0">
                    ★ VERIFIED PASS ★
                  </div>
                )}
              </div>
            </div>

            {/* Sobekan tiket */}
            <div className="relative border-t-2 md:border-t-0 md:border-l-2 border-dashed border-[#171412] bg-[#E3D5B8] p-6 flex flex-col items-center justify-center text-center md:w-56 shrink-0">
              <div className="hidden md:block absolute -top-3 left-[-13px] w-6 h-6 rounded-full bg-[#EFE5D0] border-2 border-[#171412]" />
              <div className="hidden md:block absolute -bottom-3 left-[-13px] w-6 h-6 rounded-full bg-[#EFE5D0] border-2 border-[#171412]" />

              <span className="font-['Courier_Prime'] text-[11px] uppercase tracking-widest text-[#6B6156] mb-2 font-bold">
                TICKET STUB
              </span>

              {qrDataUrl ? (
                <div className="p-2 bg-white border border-[#171412] shadow-[2px_2px_0px_#171412] mb-3">
                  <img
                    src={qrDataUrl}
                    alt={`Kode QR tiket ${currentRsvp.ticketCode}`}
                    className="w-32 h-32 object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-[#CDBE9F] animate-pulse mb-3" />
              )}

              <span className="font-['Courier_Prime'] font-bold text-xs text-[#171412] tracking-widest break-all">
                {currentRsvp.ticketCode}
              </span>
              <span className="font-['Courier_Prime'] text-[10px] text-[#6B6156] mt-1">SCAN FOR CHECK-IN</span>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-center font-['Courier_Prime'] text-xs text-[#B4392B] font-bold">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDownloadTicket}
              disabled={isDownloading || !qrDataUrl}
              className="py-3 px-6 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#B4392B] text-[#F6EFE1] hover:bg-[#171412] transition-colors shadow-[3px_3px_0px_#171412] cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              <span aria-hidden="true">{isDownloading ? '⏳' : '📥'}</span>
              {isDownloading ? 'MEMPROSES GAMBAR...' : 'SIMPAN TIKET (PNG)'}
            </button>

            <button
              onClick={handleShare}
              className="py-3 px-6 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[3px_3px_0px_#171412] cursor-pointer flex items-center gap-2"
            >
              <span aria-hidden="true">{shareSuccess ? '✓' : '📤'}</span>
              {shareSuccess ? 'LINK TERSALIN!' : 'BAGIKAN TIKET'}
            </button>

            {rsvpOpen && (
              <button
                onClick={() => setIsEditing(true)}
                className="py-3 px-4 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#4A413A] hover:text-[#171412] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer"
              >
                ✎ UBAH KONFIRMASI
              </button>
            )}
          </div>
        </div>
      )}

      {/* Case 3: Tidak hadir / ragu */}
      {currentRsvp && !isEditing && currentRsvp.attendance !== 'hadir' && (
        <div className="max-w-xl mx-auto border-2 border-[#171412] bg-[#E3D5B8] p-8 shadow-[6px_6px_0px_#171412] text-center">
          <div className="w-12 h-[2px] bg-[#B4392B] mx-auto mb-4" />
          <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#B4392B] font-bold">
            INTERMISSION
          </span>
          <h3 className="font-['Anton'] text-3xl uppercase text-[#171412] my-2">TERIMA KASIH ATAS KONFIRMASINYA</h3>
          <p className="font-['Work_Sans'] text-sm text-[#4A413A] leading-relaxed my-4">
            {currentRsvp.attendance === 'ragu' ? (
              <>
                Terima kasih, <strong>{currentRsvp.name}</strong>. Kami menunggu kabar baik dari Anda. Silakan perbarui
                konfirmasi kapan saja sebelum batas waktu.
              </>
            ) : (
              <>
                Terima kasih banyak, <strong>{currentRsvp.name}</strong>. Doa tulus Anda dari kejauhan sudah menjadi
                hadiah yang sangat berharga bagi kami berdua. Semoga kita dapat berjumpa di lain kesempatan.
              </>
            )}
          </p>
          {rsvpOpen && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 py-2.5 px-6 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer"
            >
              UBAH KONFIRMASI KEHADIRAN
            </button>
          )}
        </div>
      )}
    </section>
  );
};
