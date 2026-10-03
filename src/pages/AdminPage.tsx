import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, LogOut, RefreshCw, RotateCcw } from 'lucide-react';
import { store } from '../lib/store';
import { coupleNames } from '../lib/wedding';
import { authMode, signInWithPassword, signInWithPin, signOut, useAdminAuth } from '../lib/auth';
import { Guest, RSVP, Wish } from '../types/wedding';
import { GuestsTab } from '../components/admin/GuestsTab';
import { RsvpTab } from '../components/admin/RsvpTab';
import { WishesTab } from '../components/admin/WishesTab';
import { CheckInTab } from '../components/admin/CheckInTab';
import { ContentTab } from '../components/admin/content/ContentTab';
import { ConfirmButton, StatCard, btnPrimary, inputCls, useToast } from '../components/admin/ui';

type TabId = 'konten' | 'tamu' | 'rsvp' | 'ucapan' | 'checkin';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'konten', label: 'Konten' },
  { id: 'tamu', label: 'Tamu' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'ucapan', label: 'Ucapan' },
  { id: 'checkin', label: 'Check-in' },
];

export interface AdminData {
  guests: Guest[];
  rsvps: RSVP[];
  wishes: Wish[];
}

function readTabFromHash(): TabId {
  const tab = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('tab');
  return TABS.some((t) => t.id === tab) ? (tab as TabId) : 'tamu';
}

const LoginGate: React.FC = () => {
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (authMode === 'pin') {
      if (!signInWithPin(secret)) {
        setError('PIN salah.');
        setSecret('');
      }
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword(email.trim(), secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171412] px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-xs border-2 border-[#F6EFE1] bg-[#EFE5D0] p-6 shadow-[8px_8px_0px_#B4392B] text-center space-y-3"
      >
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#B4392B] font-bold">
          RESTRICTED AREA
        </span>
        <h1 className="font-['Anton'] text-3xl uppercase text-[#171412] -mt-1">STUDIO CONTROL ROOM</h1>

        {authMode === 'supabase' && (
          <>
            <label htmlFor="admin-email" className="sr-only">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email admin"
              className={inputCls}
            />
          </>
        )}

        <label htmlFor="admin-pin" className="sr-only">
          {authMode === 'pin' ? 'PIN Admin' : 'Password'}
        </label>
        <input
          id="admin-pin"
          type="password"
          inputMode={authMode === 'pin' ? 'numeric' : undefined}
          autoComplete={authMode === 'pin' ? 'off' : 'current-password'}
          autoFocus={authMode === 'pin'}
          required
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value);
            setError('');
          }}
          placeholder={authMode === 'pin' ? 'Masukkan PIN' : 'Password'}
          className={`${inputCls} ${authMode === 'pin' ? 'text-center tracking-[0.5em] text-lg' : ''}`}
        />
        {error && (
          <p role="alert" className="font-['Courier_Prime'] text-xs text-[#B4392B] font-bold">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full py-3`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'MASUK'}
        </button>
        {authMode === 'pin' && (
          <p className="font-['Courier_Prime'] text-[10px] text-[#6B6156] uppercase tracking-wider">Mode demo lokal</p>
        )}
      </form>
    </div>
  );
};

export const AdminPage: React.FC = () => {
  const { signedIn, email } = useAdminAuth();
  const [tab, setTab] = useState<TabId>(readTabFromHash);
  const [data, setData] = useState<AdminData>({ guests: [], rsvps: [], wishes: [] });
  const [loadError, setLoadError] = useState('');
  const [contentDirty, setContentDirty] = useState(false);
  const [toast, showToast] = useToast();

  const reload = useCallback(async () => {
    try {
      const [guests, rsvps, wishes] = await Promise.all([
        store.listGuests(),
        store.listRsvps(),
        store.listWishes({ includeHidden: true }),
      ]);
      setData({ guests, rsvps, wishes });
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Gagal memuat data');
    }
  }, []);

  useEffect(() => {
    document.title = `Admin · ${coupleNames}`;
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  useEffect(() => {
    if (signedIn) reload();
  }, [signedIn, reload]);

  const selectTab = (id: TabId) => {
    setTab(id);
    history.replaceState(null, '', `#/admin?tab=${id}`);
  };

  const resetData = async () => {
    try {
      await store.resetData();
      await reload();
      showToast(authMode === 'pin' ? 'Data demo dikembalikan ke awal' : 'Semua data tamu, RSVP, dan ucapan dihapus');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal mereset data');
    }
  };

  if (signedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#171412]">
        <Loader2 className="w-8 h-8 text-[#D7A13E] animate-spin" />
      </div>
    );
  }
  if (!signedIn) return <LoginGate />;

  const { guests, rsvps, wishes } = data;
  const hadir = rsvps.filter((r) => r.attendance === 'hadir');
  const hadirPax = hadir.reduce((sum, r) => sum + (r.pax || 0), 0);
  const checkedIn = rsvps.filter((r) => r.checkedInAt);
  const checkedInPax = checkedIn.reduce((sum, r) => sum + (r.checkedInPax ?? r.pax ?? 0), 0);
  const opened = guests.filter((g) => g.openCount > 0).length;
  const respondedCodes = new Set(rsvps.map((r) => r.guestCode?.toLowerCase()).filter(Boolean));
  const pending = guests.filter((g) => !respondedCodes.has(g.code.toLowerCase())).length;

  return (
    <div className="min-h-screen bg-[#EFE5D0] text-[#171412]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b-2 border-[#171412] bg-[#171412] text-[#F6EFE1]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={window.location.pathname}
              className="text-[#CDBE9F] hover:text-[#F6EFE1]"
              title="Kembali ke undangan"
              aria-label="Kembali ke undangan"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="min-w-0">
              <span className="font-['Anton'] text-xl uppercase tracking-wider text-[#D7A13E] block leading-none">
                STUDIO CONTROL ROOM
              </span>
              <span className="font-['Courier_Prime'] text-[11px] text-[#A89E8F] uppercase tracking-wider">
                {coupleNames} · {authMode === 'pin' ? 'Mode demo lokal' : email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authMode === 'pin' && (
              <ConfirmButton
                onConfirm={resetData}
                title="Reset data demo"
                confirmLabel="Reset semua data?"
                className="inline-flex items-center gap-1.5 h-8 px-2 border border-[#CDBE9F]/50 text-[#CDBE9F] hover:text-[#F6EFE1] hover:border-[#F6EFE1] font-['Courier_Prime'] text-[11px] uppercase cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
              </ConfirmButton>
            )}
            <button
              onClick={() => {
                reload();
                showToast('Data diperbarui');
              }}
              className="p-2 text-[#CDBE9F] hover:text-[#F6EFE1] cursor-pointer"
              title="Perbarui data"
              aria-label="Perbarui data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (contentDirty && !window.confirm('Ada perubahan konten yang belum disimpan. Tetap keluar?')) return;
                signOut();
              }}
              className="p-2 text-[#CDBE9F] hover:text-[#B4392B] cursor-pointer"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {loadError && (
          <div role="alert" className="border-2 border-[#B4392B] bg-[#EFE5D0] p-3 font-['Courier_Prime'] text-sm text-[#B4392B]">
            Gagal memuat data: {loadError}
          </div>
        )}

        {/* Ringkasan */}
        {tab !== 'konten' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Tamu" value={guests.length} hint={`${opened} sudah membuka`} />
            <StatCard label="Hadir" value={hadir.length} hint={`${hadirPax} kursi`} color="#3C6966" />
            <StatCard
              label="Tidak Hadir"
              value={rsvps.filter((r) => r.attendance === 'tidak_hadir').length}
              color="#6B6156"
            />
            <StatCard label="Ragu" value={rsvps.filter((r) => r.attendance === 'ragu').length} color="#A87A1F" />
            <StatCard label="Belum Konfirmasi" value={pending} hint="dari daftar tamu" color="#B4392B" />
            <StatCard label="Check-in" value={checkedIn.length} hint={`${checkedInPax} / ${hadirPax} orang`} />
          </div>
        )}

        {/* Tabs */}
        <div role="tablist" aria-label="Menu admin" className="flex flex-wrap gap-2 border-b-2 border-[#171412]">
          {TABS.map((t) => {
            const count =
              t.id === 'tamu' ? guests.length : t.id === 'rsvp' ? rsvps.length : t.id === 'ucapan' ? wishes.length : null;
            return (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                onClick={() => selectTab(t.id)}
                className={`px-4 py-2 -mb-[2px] border-2 border-b-0 border-[#171412] font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold cursor-pointer transition-colors ${
                  tab === t.id ? 'bg-[#171412] text-[#F6EFE1]' : 'bg-[#E3D5B8] text-[#171412] hover:bg-[#CDBE9F]'
                }`}
              >
                {t.label}
                {count !== null && <span className="ml-1.5 opacity-70">({count})</span>}
                {t.id === 'konten' && contentDirty && <span className="ml-1.5 text-[#B4392B]" aria-label="belum disimpan">●</span>}
              </button>
            );
          })}
        </div>

        {/* Konten tetap ter-mount agar draf tidak hilang saat pindah tab */}
        <div role="tabpanel" id="panel-konten" aria-labelledby="tab-konten" hidden={tab !== 'konten'}>
          <ContentTab toast={showToast} onDirtyChange={setContentDirty} onResetData={resetData} />
        </div>

        {tab !== 'konten' && (
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
            {tab === 'tamu' && <GuestsTab data={data} reload={reload} toast={showToast} />}
            {tab === 'rsvp' && <RsvpTab data={data} />}
            {tab === 'ucapan' && <WishesTab wishes={wishes} reload={reload} toast={showToast} />}
            {tab === 'checkin' && <CheckInTab data={data} reload={reload} />}
          </div>
        )}
      </main>

      {toast}
    </div>
  );
};
