import React, { useEffect, useState } from 'react';
import { Attendance, RSVP } from '../../types/wedding';

const btnBase =
  "inline-flex items-center justify-center gap-1.5 px-3 py-2 font-['Courier_Prime'] text-xs uppercase tracking-wider font-bold border-2 border-[#171412] transition-colors cursor-pointer shadow-[2px_2px_0px_#171412] disabled:opacity-50 disabled:cursor-not-allowed";

export const btnPrimary = `${btnBase} bg-[#B4392B] text-[#F6EFE1] hover:bg-[#171412]`;
export const btnSecondary = `${btnBase} bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0]`;
export const btnDark = `${btnBase} bg-[#171412] text-[#F6EFE1] hover:bg-[#3C6966]`;
export const iconBtn =
  'inline-flex items-center justify-center w-8 h-8 border border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors cursor-pointer disabled:opacity-40';

export const inputCls =
  "w-full px-3 py-2 border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] text-sm font-['Work_Sans'] focus:outline-none focus:border-[#B4392B]";
export const labelCls = "block font-['Courier_Prime'] text-[11px] text-[#171412] uppercase mb-1 font-bold tracking-wider";
export const panelCls = 'border-2 border-[#171412] bg-[#E3D5B8] p-4 sm:p-5 shadow-[4px_4px_0px_#171412]';

export const ATTENDANCE_LABEL: Record<Attendance, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  ragu: 'Ragu',
};

export const StatCard: React.FC<{ label: string; value: React.ReactNode; hint?: string; color?: string }> = ({
  label,
  value,
  hint,
  color = '#171412',
}) => (
  <div className="p-3 border-2 border-[#171412] bg-[#E3D5B8]">
    <span className="font-['Courier_Prime'] text-[11px] uppercase block font-bold tracking-wider" style={{ color }}>
      {label}
    </span>
    <span className="font-['Anton'] text-3xl leading-none tabular-nums" style={{ color }}>
      {value}
    </span>
    {hint && <span className="block font-['Courier_Prime'] text-[11px] text-[#4A413A] mt-1">{hint}</span>}
  </div>
);

export const RsvpBadge: React.FC<{ rsvp?: RSVP }> = ({ rsvp }) => {
  if (!rsvp) {
    return <span className="font-['Courier_Prime'] text-[11px] text-[#4A413A] uppercase">Belum konfirmasi</span>;
  }
  const styles: Record<Attendance, string> = {
    hadir: 'bg-[#3C6966] text-[#F6EFE1]',
    tidak_hadir: 'bg-[#6B6156] text-[#F6EFE1]',
    ragu: 'bg-[#D7A13E] text-[#171412]',
  };
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span className={`px-2 py-0.5 font-['Courier_Prime'] text-[11px] font-bold uppercase ${styles[rsvp.attendance]}`}>
        {ATTENDANCE_LABEL[rsvp.attendance]}
        {rsvp.attendance === 'hadir' ? ` · ${rsvp.pax} pax` : ''}
      </span>
      {rsvp.checkedInAt && (
        <span className="px-2 py-0.5 font-['Courier_Prime'] text-[11px] font-bold uppercase bg-[#171412] text-[#D7A13E]">
          ✓ Datang
        </span>
      )}
    </span>
  );
};

/** Tombol dua langkah untuk aksi berbahaya (pengganti confirm()). */
export const ConfirmButton: React.FC<{
  onConfirm: () => void;
  children: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  title?: string;
}> = ({ onConfirm, children, confirmLabel = 'Yakin?', className = iconBtn, title }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      title={title}
      aria-label={armed ? `${title ?? ''} — klik lagi untuk konfirmasi` : title}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      className={
        armed
          ? "inline-flex items-center justify-center h-8 px-2 border border-[#B4392B] bg-[#B4392B] text-[#F6EFE1] font-['Courier_Prime'] text-[11px] font-bold uppercase cursor-pointer"
          : className
      }
    >
      {armed ? confirmLabel : children}
    </button>
  );
};

/** Notifikasi singkat di pojok layar. */
export function useToast(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(''), 2500);
    return () => clearTimeout(t);
  }, [msg]);

  const node = msg ? (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 px-4 py-3 border-2 border-[#171412] bg-[#171412] text-[#F6EFE1] font-['Courier_Prime'] text-xs uppercase tracking-wider shadow-[4px_4px_0px_#B4392B] animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {msg}
    </div>
  ) : null;

  return [node, setMsg];
}
