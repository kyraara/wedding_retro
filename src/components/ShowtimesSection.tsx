import React, { useState, useEffect } from 'react';
import { weddingConfig } from '../content/wedding.config';
import { EventPhase } from '../lib/eventPhase';
import { downloadBlob } from '../lib/files';
import {
  WeddingEvent,
  coupleNames,
  eventDateLabel,
  eventMapsUrl,
  eventTimeLabel,
  formatDateDots,
  toCalendarUtc,
  weddingStart,
} from '../lib/wedding';

const { groom, bride } = weddingConfig.couple;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const getGoogleCalendarUrl = (event: WeddingEvent) => {
  const title = encodeURIComponent(`The Premiere: ${event.title} - ${coupleNames}`);
  const details = encodeURIComponent(
    `Pernikahan ${groom.fullname} & ${bride.fullname}\nLokasi: ${event.venue}\n${event.address}`
  );
  const location = encodeURIComponent(`${event.venue}, ${event.address}`);
  const dates = `${toCalendarUtc(event.dateISO)}/${toCalendarUtc(event.endISO)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};

const escapeIcs = (text: string) => text.replace(/\\/g, '\\\\').replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

const downloadIcs = (event: WeddingEvent) => {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Premiere Wedding Invitation//ID',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}-${toCalendarUtc(event.dateISO)}@premiere-wedding`,
    `DTSTAMP:${toCalendarUtc(new Date().toISOString())}`,
    `SUMMARY:${escapeIcs(`Pernikahan ${coupleNames} - ${event.title}`)}`,
    `DESCRIPTION:${escapeIcs(`${event.subtitle}\n${event.venue}`)}`,
    `LOCATION:${escapeIcs(`${event.venue}, ${event.address}`)}`,
    `DTSTART:${toCalendarUtc(event.dateISO)}`,
    `DTEND:${toCalendarUtc(event.endISO)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const slug = coupleNames.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  downloadBlob(new Blob([icsContent], { type: 'text/calendar;charset=utf-8' }), `wedding-${slug}-${event.id}.ics`);
};

const CountdownBoard: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(weddingStart));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(weddingStart)), 1000);
    return () => clearInterval(interval);
  }, []);

  const units: Array<[number, string]> = [
    [timeLeft.days, 'HARI'],
    [timeLeft.hours, 'JAM'],
    [timeLeft.minutes, 'MENIT'],
    [timeLeft.seconds, 'DETIK'],
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center" role="timer" aria-live="off">
      {units.map(([value, label]) => (
        <div key={label} className="border border-[#F6EFE1]/20 bg-[#171412] p-2 sm:p-4 relative">
          <span className="block font-['Anton'] text-3xl sm:text-5xl md:text-6xl text-[#D7A13E] leading-none tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
          <span className="block font-['Courier_Prime'] text-[11px] sm:text-xs uppercase tracking-widest text-[#CDBE9F] mt-2 font-bold">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};

const BOARD_TITLES: Record<EventPhase, string> = {
  before: 'HITUNG MUNDUR PREMIERE',
  live: 'SEDANG TAYANG',
  after: 'PEMUTARAN TELAH USAI',
};

interface ShowtimesSectionProps {
  phase: EventPhase;
}

export const ShowtimesSection: React.FC<ShowtimesSectionProps> = ({ phase }) => {
  return (
    <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#B4392B] block mb-2 font-bold">
          SCHEDULE & SCREENINGS
        </span>
        <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#171412]">
          JADWAL TAYANG
        </h2>
        <div className="w-16 h-[2px] bg-[#171412] mx-auto mt-3" />
      </div>

      {/* Retro Marquee Board: countdown / sedang tayang / selesai */}
      <div className="border-2 border-[#171412] bg-[#171412] text-[#F6EFE1] p-6 mb-12 shadow-[6px_6px_0px_#171412]">
        <div className="flex items-center justify-between border-b border-[#F6EFE1]/20 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                phase === 'after' ? 'bg-[#8C8274]' : 'bg-[#B4392B] animate-pulse'
              }`}
            />
            <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#D7A13E] font-bold">
              {BOARD_TITLES[phase]}
            </span>
          </div>
          <span className="font-['Courier_Prime'] text-[11px] text-[#A89E8F] tracking-widest">
            {formatDateDots(weddingStart)}
          </span>
        </div>

        {phase === 'before' && <CountdownBoard />}

        {phase === 'live' && (
          <div className="text-center py-4">
            <p className="font-['Anton'] text-4xl sm:text-6xl uppercase tracking-wide text-[#D7A13E] leading-none">
              ● ON AIR
            </p>
            <p className="font-['Work_Sans'] text-sm text-[#CDBE9F] mt-4 max-w-md mx-auto leading-relaxed">
              Acara sedang berlangsung hari ini. Silakan menuju lokasi sesuai jadwal di bawah dan tunjukkan tiket
              premiere Anda di meja registrasi.
            </p>
          </div>
        )}

        {phase === 'after' && (
          <div className="text-center py-4">
            <p className="font-['Anton'] text-4xl sm:text-6xl uppercase tracking-wide text-[#F6EFE1] leading-none">
              THANK YOU
            </p>
            <p className="font-['Work_Sans'] text-sm text-[#CDBE9F] mt-4 max-w-md mx-auto leading-relaxed">
              Terima kasih telah menjadi bagian dari hari bahagia kami. Doa dan kehadiran Anda adalah hadiah terindah.
            </p>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-8">
        {weddingConfig.events.map((event, idx) => (
          <div
            key={event.id}
            className="border-2 border-[#171412] bg-[#E3D5B8] p-6 sm:p-8 shadow-[5px_5px_0px_#171412] relative"
          >
            {/* Corner Badge */}
            <div className="flex flex-wrap gap-2 items-center justify-between border-b border-[#171412]/20 pb-3 mb-6">
              <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#B4392B] font-bold">
                SHOWTIME 0{idx + 1} · {event.subtitle.toUpperCase()}
              </span>
              <span className="font-['Courier_Prime'] text-xs uppercase text-[#6B6156] tracking-wider">
                {eventDateLabel(event)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Big Red Time Column */}
              <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#171412]/20 pb-4 md:pb-0 md:pr-6">
                <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#6B6156] block mb-1">
                  WAKTU MULAI
                </span>
                <span className="font-['Anton'] text-3xl sm:text-4xl text-[#B4392B] block leading-none">
                  {eventTimeLabel(event)}
                </span>
                <span className="inline-block mt-2 font-['Courier_Prime'] text-[11px] tracking-wider bg-[#171412] text-[#F6EFE1] px-2 py-0.5 uppercase">
                  PINTU DIBUKA 15 MENIT SEBELUM
                </span>
              </div>

              {/* Venue & Details Column */}
              <div className="md:col-span-8 flex flex-col justify-between">
                <div>
                  <h3 className="font-['Anton'] text-2xl sm:text-3xl uppercase text-[#171412] tracking-wide mb-1">
                    {event.title}
                  </h3>
                  <p className="font-['DM_Serif_Display'] italic text-lg sm:text-xl text-[#3C6966] mb-3">
                    {event.venue}
                  </p>
                  <p className="font-['Work_Sans'] text-xs sm:text-sm text-[#4A413A] leading-relaxed mb-6">
                    {event.address}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={eventMapsUrl(event)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-['Courier_Prime'] uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412]"
                  >
                    <span aria-hidden="true">📍</span> BUKA PETA GOOGLE
                  </a>

                  {phase === 'before' && (
                    <>
                      <a
                        href={getGoogleCalendarUrl(event)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-['Courier_Prime'] uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412]"
                      >
                        <span aria-hidden="true">📅</span> GOOGLE CALENDAR
                      </a>

                      <button
                        onClick={() => downloadIcs(event)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-['Courier_Prime'] uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer"
                      >
                        <span aria-hidden="true">💾</span> SIMPAN .ICS
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Production Note / Dress Code Card */}
      {weddingConfig.sections.dressCode && (
      <div className="mt-12 border-2 border-dashed border-[#171412] bg-[#EFE5D0] p-6 relative">
        <div className="absolute -top-3.5 left-6 bg-[#171412] text-[#F6EFE1] font-['Courier_Prime'] text-[11px] px-3 py-1 uppercase tracking-widest font-bold">
          {weddingConfig.dressCode.title}
        </div>
        <p className="font-['Work_Sans'] text-xs sm:text-sm text-[#4A413A] leading-relaxed pt-2 mb-4">
          {weddingConfig.dressCode.description}
        </p>

        {/* Color Palette Swatches */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-['Courier_Prime'] text-[11px] uppercase tracking-wider text-[#6B6156] font-bold">
            PALET WARNA:
          </span>
          <div className="flex items-center gap-2">
            {weddingConfig.dressCode.palette.map((colorHex) => (
              <div
                key={colorHex}
                className="w-6 h-6 rounded-none border border-[#171412] shadow-[1px_1px_0px_#171412]"
                style={{ backgroundColor: colorHex }}
                title={colorHex}
              />
            ))}
          </div>
        </div>
      </div>
      )}
    </section>
  );
};
