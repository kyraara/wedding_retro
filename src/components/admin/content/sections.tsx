import React from 'react';
import type { Person, SectionToggles, TimeZoneId, WeddingContent, WeddingEventItem } from '../../../content/types';
import { MAX_INTRO_VIDEO_MB, uploadOgImage } from '../../../lib/media';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { TIME_ZONES, isoToLocalParts, localPartsToIso } from '../../../lib/wedding';
import { inputCls } from '../ui';
import {
  BulkImageUpload,
  ColorListInput,
  Field,
  ImageInput,
  LinesInput,
  ListEditor,
  MediaInput,
  TextInput,
  Toggle,
} from './fields';

export type Update = (fn: (draft: WeddingContent) => void) => void;

export interface SectionProps {
  draft: WeddingContent;
  update: Update;
}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const grid2 = 'grid grid-cols-1 sm:grid-cols-2 gap-4';

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="font-['Anton'] text-xl uppercase tracking-wide text-[#171412] border-b-2 border-[#171412] pb-1 mb-4 mt-2">
    {children}
  </h3>
);

// ---------------------------------------------------------------- Mempelai

const PersonEditor: React.FC<{ person: Person; role: string; onChange: (p: Partial<Person>) => void }> = ({
  person,
  role,
  onChange,
}) => (
  <div className="space-y-4">
    <SubHeading>{role}</SubHeading>
    <ImageInput label="Foto" value={person.photo} onChange={(photo) => onChange({ photo })} aspect="aspect-[3/4]" />
    <div className={grid2}>
      <TextInput label="Nama panggilan" required value={person.callname} onChange={(callname) => onChange({ callname })} />
      <TextInput label="Nama lengkap & gelar" value={person.fullname} onChange={(fullname) => onChange({ fullname })} />
    </div>
    <TextInput label="Bio singkat" multiline value={person.bio} onChange={(bio) => onChange({ bio })} />
    <TextInput
      label="Nama orang tua"
      value={person.parents}
      onChange={(parents) => onChange({ parents })}
      placeholder="Bpk. ... & Ibu ..."
    />
    <TextInput
      label="Instagram"
      value={person.instagram}
      onChange={(instagram) => onChange({ instagram })}
      placeholder="@username (kosongkan jika tidak ada)"
    />
  </div>
);

export const CoupleSection: React.FC<SectionProps> = ({ draft, update }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <PersonEditor
      role="Mempelai Pria"
      person={draft.couple.groom}
      onChange={(p) => update((d) => Object.assign(d.couple.groom, p))}
    />
    <PersonEditor
      role="Mempelai Wanita"
      person={draft.couple.bride}
      onChange={(p) => update((d) => Object.assign(d.couple.bride, p))}
    />
  </div>
);

// ---------------------------------------------------------------- Acara

const EventTimes: React.FC<{
  event: WeddingEventItem;
  zone: string;
  onChange: (patch: Partial<WeddingEventItem>) => void;
}> = ({ event, zone, onChange }) => {
  const start = isoToLocalParts(event.dateISO, zone);
  const end = isoToLocalParts(event.endISO, zone);
  const setStart = (date: string, time: string) => {
    const patch: Partial<WeddingEventItem> = { dateISO: localPartsToIso(date, time, zone) };
    // Jam selesai mengikuti tanggal acara.
    if (end.time) patch.endISO = localPartsToIso(date, end.time, zone);
    onChange(patch);
  };
  const invalid = event.dateISO && event.endISO && new Date(event.endISO) <= new Date(event.dateISO);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Field label="Tanggal *">
        <input type="date" value={start.date} onChange={(e) => setStart(e.target.value, start.time)} className={inputCls} />
      </Field>
      <Field label="Jam mulai *">
        <input type="time" value={start.time} onChange={(e) => setStart(start.date, e.target.value)} className={inputCls} />
      </Field>
      <Field label="Jam selesai *">
        <input
          type="time"
          value={end.time}
          onChange={(e) => onChange({ endISO: localPartsToIso(start.date, e.target.value, zone) })}
          className={`${inputCls} ${invalid ? 'border-[#B4392B]' : ''}`}
        />
        {invalid && (
          <span role="alert" className="block font-['Courier_Prime'] text-[11px] text-[#B4392B] font-bold mt-1">
            Jam selesai harus setelah jam mulai.
          </span>
        )}
      </Field>
    </div>
  );
};

/** Pindahkan jam dinding ke zona waktu lain (08.00 WIB → 08.00 WITA). */
function rezone(iso: string, from: string, to: string): string {
  if (!iso) return iso;
  const p = isoToLocalParts(iso, from);
  return localPartsToIso(p.date, p.time, to);
}

export const EventsSection: React.FC<SectionProps> = ({ draft, update }) => {
  const zone = draft.timeZone;
  const deadline = isoToLocalParts(draft.rsvp.deadlineISO, zone);

  const changeZone = (to: TimeZoneId) =>
    update((d) => {
      const from = d.timeZone;
      d.events.forEach((e) => {
        e.dateISO = rezone(e.dateISO, from, to);
        e.endISO = rezone(e.endISO, from, to);
      });
      d.rsvp.deadlineISO = rezone(d.rsvp.deadlineISO, from, to);
      d.timeZone = to;
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Zona waktu">
          <select value={zone} onChange={(e) => changeZone(e.target.value as TimeZoneId)} className={inputCls}>
            {TIME_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label} ({z.offset})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Batas konfirmasi RSVP" hint="Setelah tanggal ini form RSVP ditutup.">
          <input
            type="date"
            value={deadline.date}
            onChange={(e) => update((d) => (d.rsvp.deadlineISO = localPartsToIso(e.target.value, '23:59', zone)))}
            className={inputCls}
          />
        </Field>
        <Field label="Acara di tiket" hint="Lokasi registrasi yang dicetak di tiket QR.">
          <select
            value={draft.mainEventId}
            onChange={(e) => update((d) => (d.mainEventId = e.target.value))}
            className={inputCls}
          >
            {draft.events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title || '(tanpa judul)'}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <ListEditor
        items={draft.events}
        min={1}
        onChange={(events) =>
          update((d) => {
            d.events = events;
            if (!events.some((e) => e.id === d.mainEventId)) d.mainEventId = events[0]?.id ?? '';
          })
        }
        addLabel="Tambah acara"
        itemTitle={(e, i) => `Showtime ${i + 1} · ${e.title || 'Acara baru'}`}
        create={() => {
          const base = draft.events[draft.events.length - 1];
          return {
            id: newId('acara'),
            title: '',
            subtitle: '',
            dateISO: base?.dateISO ?? '',
            endISO: base?.endISO ?? '',
            venue: '',
            address: '',
            mapsUrl: '',
          };
        }}
        renderItem={(event, set) => (
          <div className="space-y-4">
            <div className={grid2}>
              <TextInput label="Judul acara" required value={event.title} onChange={(title) => set({ title })} placeholder="AKAD NIKAH" />
              <TextInput label="Subjudul" value={event.subtitle} onChange={(subtitle) => set({ subtitle })} placeholder="The Sacred Vows" />
            </div>
            <EventTimes event={event} zone={zone} onChange={set} />
            <TextInput label="Nama tempat" required value={event.venue} onChange={(venue) => set({ venue })} />
            <TextInput label="Alamat lengkap" multiline rows={2} value={event.address} onChange={(address) => set({ address })} />
            <TextInput
              label="Link Google Maps"
              type="url"
              value={event.mapsUrl}
              onChange={(mapsUrl) => set({ mapsUrl })}
              hint="Opsional. Jika kosong, dibuat otomatis dari nama tempat + alamat."
            />
          </div>
        )}
      />
    </div>
  );
};

// ---------------------------------------------------------------- Umum

export const GeneralSection: React.FC<SectionProps> = ({ draft, update }) => (
  <div className="space-y-4">
    <ImageInput
      label="Poster utama"
      value={draft.posterImage}
      aspect="aspect-[4/5]"
      onChange={(posterImage) => update((d) => (d.posterImage = posterImage))}
      onFileUploaded={async (file) => {
        // Gambar preview WhatsApp ikut dibuat dari poster (khusus Supabase).
        if (!isSupabaseConfigured) return;
        const og = await uploadOgImage(file);
        update((d) => (d.ogImage = og));
      }}
      hint={
        isSupabaseConfigured
          ? 'Juga dipakai sebagai gambar preview saat link dibagikan (dibuat otomatis).'
          : 'Foto tampil di atas undangan.'
      }
    />
    <div className={grid2}>
      <TextInput label="Dipersembahkan oleh" value={draft.presentedBy} onChange={(v) => update((d) => (d.presentedBy = v))} />
      <TextInput
        label="Diproduksi oleh (poster)"
        value={draft.producedBy}
        onChange={(v) => update((d) => (d.producedBy = v))}
        hint="Versi singkat untuk tulisan kecil di bawah poster."
      />
      <TextInput label="Tagline" value={draft.tagline} onChange={(v) => update((d) => (d.tagline = v))} />
      <TextInput
        label="Teks tepi film"
        value={draft.filmEdgeText}
        onChange={(v) => update((d) => (d.filmEdgeText = v))}
        placeholder="PREMIERE 2027 ▸ 400 ISO"
      />
      <TextInput label="Kota" value={draft.city} onChange={(v) => update((d) => (d.city = v))} />
      <TextInput label="Provinsi" value={draft.region} onChange={(v) => update((d) => (d.region = v))} />
    </div>
    <SubHeading>Sinopsis (ayat / kutipan)</SubHeading>
    <TextInput label="Kutipan" multiline rows={4} value={draft.synopsis.quote} onChange={(v) => update((d) => (d.synopsis.quote = v))} />
    <TextInput label="Sumber" value={draft.synopsis.source} onChange={(v) => update((d) => (d.synopsis.source = v))} placeholder="QS. Ar-Rum : 21" />
  </div>
);

// ---------------------------------------------------------------- Kisah

export const StorySection: React.FC<SectionProps> = ({ draft, update }) => (
  <ListEditor
    items={draft.scenes}
    onChange={(scenes) => update((d) => (d.scenes = scenes))}
    addLabel="Tambah babak cerita"
    itemTitle={(s, i) => `Scene ${String(i + 1).padStart(2, '0')} · ${s.title || 'Cerita baru'}`}
    create={() => ({ id: newId('scene'), year: '', title: '', story: '', image: '' })}
    renderItem={(scene, set) => (
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
        <ImageInput label="Foto" value={scene.image} onChange={(image) => set({ image })} />
        <div className="space-y-4">
          <div className="grid grid-cols-[6rem_1fr] gap-4">
            <TextInput label="Tahun" value={scene.year} onChange={(year) => set({ year })} placeholder="2019" />
            <TextInput label="Judul" value={scene.title} onChange={(title) => set({ title })} />
          </div>
          <TextInput label="Cerita" multiline rows={4} value={scene.story} onChange={(story) => set({ story })} />
        </div>
      </div>
    )}
  />
);

// ---------------------------------------------------------------- Galeri

export const GallerySection: React.FC<SectionProps> = ({ draft, update }) => (
  <ListEditor
    items={draft.stills}
    onChange={(stills) => update((d) => (d.stills = stills))}
    addLabel="Tambah foto"
    itemTitle={(s, i) => `Frame ${12 + i} · ${s.title || 'Foto'}`}
    create={() => ({ id: newId('still'), title: '', caption: '', image: '' })}
    extraActions={
      <BulkImageUpload
        onUploaded={(urls) =>
          update((d) => {
            d.stills.push(...urls.map((image) => ({ id: newId('still'), title: '', caption: '', image })));
          })
        }
      />
    }
    renderItem={(still, set) => (
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
        <ImageInput label="Foto" value={still.image} onChange={(image) => set({ image })} />
        <div className="space-y-4">
          <TextInput label="Judul" value={still.title} onChange={(title) => set({ title })} />
          <TextInput label="Keterangan" value={still.caption} onChange={(caption) => set({ caption })} />
        </div>
      </div>
    )}
  />
);

// ---------------------------------------------------------------- Video

export const VideoSection: React.FC<SectionProps> = ({ draft, update }) => (
  <div className="space-y-4">
    <SubHeading>Video pembuka (setelah hitungan mundur)</SubHeading>
    <MediaInput
      label="Video pembuka"
      kind="video"
      fileOnly
      maxMb={MAX_INTRO_VIDEO_MB}
      value={draft.intro.videoUrl}
      onChange={(v) => update((d) => (d.intro.videoUrl = v))}
      hint="Diputar layar penuh setelah hitungan mundur 3-2-1, sebelum nama mempelai muncul. Disarankan 5–15 detik, 720p, ±10 MB, format MP4. Kosongkan jika tidak memakai video pembuka."
    />
    <SubHeading>Trailer / video prewedding</SubHeading>
    <div className={grid2}>
      <TextInput label="Judul" value={draft.trailer.title} onChange={(v) => update((d) => (d.trailer.title = v))} />
      <TextInput label="Keterangan" value={draft.trailer.caption} onChange={(v) => update((d) => (d.trailer.caption = v))} />
    </div>
    <MediaInput
      label="Video trailer"
      kind="video"
      value={draft.trailer.videoUrl}
      onChange={(v) => update((d) => (d.trailer.videoUrl = v))}
      hint="Kosongkan untuk menyembunyikan section trailer."
    />
    <SubHeading>Video setelah acara</SubHeading>
    <MediaInput
      label="Video dokumentasi"
      kind="video"
      value={draft.postEvent.videoUrl}
      onChange={(v) => update((d) => (d.postEvent.videoUrl = v))}
      hint="Tampil di bagian 'Terima Kasih' setelah acara selesai."
    />
  </div>
);

// ---------------------------------------------------------------- Amplop

export const EnvelopeSection: React.FC<SectionProps> = ({ draft, update }) => {
  const { qris, giftAddress } = draft.envelope;
  return (
    <div className="space-y-6">
      <div>
        <SubHeading>Rekening</SubHeading>
        <ListEditor
          items={draft.envelope.accounts}
          onChange={(accounts) => update((d) => (d.envelope.accounts = accounts))}
          addLabel="Tambah rekening / e-wallet"
          itemTitle={(a, i) => `${a.bank || 'Rekening'} ${i + 1}`}
          create={() => ({ id: newId('acc'), bank: '', number: '', holder: '' })}
          renderItem={(acc, set) => (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput label="Bank / e-wallet" value={acc.bank} onChange={(bank) => set({ bank: bank.toUpperCase() })} placeholder="BCA / DANA" />
              <TextInput label="Nomor" value={acc.number} onChange={(number) => set({ number: number.replace(/[^0-9]/g, '') })} />
              <TextInput label="Atas nama" value={acc.holder} onChange={(holder) => set({ holder })} />
            </div>
          )}
        />
      </div>

      <div className="space-y-4">
        <SubHeading>QRIS</SubHeading>
        <ImageInput
          label="Gambar QRIS"
          value={qris.image}
          aspect="aspect-square"
          onChange={(v) => update((d) => (d.envelope.qris.image = v))}
          hint="Foto/screenshot QRIS dari aplikasi bank. Kosongkan gambar & payload untuk menyembunyikan QRIS."
        />
        <div className={grid2}>
          <TextInput label="Nama merchant" value={qris.merchantName} onChange={(v) => update((d) => (d.envelope.qris.merchantName = v))} />
          <TextInput label="NMID" value={qris.nmid} onChange={(v) => update((d) => (d.envelope.qris.nmid = v))} />
        </div>
        <TextInput
          label="Payload QRIS (opsional)"
          value={qris.payload}
          onChange={(v) => update((d) => (d.envelope.qris.payload = v))}
          hint="Hanya dipakai jika tidak ada gambar QRIS. Isi dengan teks hasil scan QRIS asli."
        />
      </div>

      <div className="space-y-4">
        <SubHeading>Alamat kado</SubHeading>
        <div className={grid2}>
          <TextInput label="Penerima" value={giftAddress.recipient} onChange={(v) => update((d) => (d.envelope.giftAddress.recipient = v))} />
          <TextInput label="No. telepon" value={giftAddress.phone} onChange={(v) => update((d) => (d.envelope.giftAddress.phone = v))} />
        </div>
        <TextInput
          label="Alamat"
          multiline
          rows={2}
          value={giftAddress.address}
          onChange={(v) => update((d) => (d.envelope.giftAddress.address = v))}
          hint="Kosongkan untuk menyembunyikan kartu alamat kado."
        />
        <TextInput label="Catatan" value={giftAddress.note} onChange={(v) => update((d) => (d.envelope.giftAddress.note = v))} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Dress code

export const DressCodeSection: React.FC<SectionProps> = ({ draft, update }) => (
  <div className="space-y-4">
    <TextInput label="Judul" value={draft.dressCode.title} onChange={(v) => update((d) => (d.dressCode.title = v))} />
    <TextInput
      label="Deskripsi"
      multiline
      value={draft.dressCode.description}
      onChange={(v) => update((d) => (d.dressCode.description = v))}
    />
    <ColorListInput label="Palet warna" value={draft.dressCode.palette} onChange={(v) => update((d) => (d.dressCode.palette = v))} />
  </div>
);

// ---------------------------------------------------------------- Musik

export const MusicSection: React.FC<SectionProps> = ({ draft, update }) => (
  <div className="space-y-4">
    <MediaInput
      label="File musik latar"
      kind="audio"
      value={draft.audio.src}
      onChange={(v) => update((d) => (d.audio.src = v))}
      hint="Diputar saat tamu menekan tombol PUTAR di intro."
    />
    <div className={grid2}>
      <TextInput label="Judul lagu" value={draft.audio.title} onChange={(v) => update((d) => (d.audio.title = v))} />
      <TextInput label="Penyanyi / artis" value={draft.audio.artist} onChange={(v) => update((d) => (d.audio.artist = v))} />
    </div>
  </div>
);

// ---------------------------------------------------------------- Kredit

export const CreditsSection: React.FC<SectionProps> = ({ draft, update }) => (
  <div className="space-y-4">
    <LinesInput
      label="Executive producers (orang tua)"
      value={draft.credits.executiveProducers}
      onChange={(v) => update((d) => (d.credits.executiveProducers = v))}
    />
    <LinesInput
      label="Supporting cast (keluarga & sahabat)"
      value={draft.credits.supportingCast}
      onChange={(v) => update((d) => (d.credits.supportingCast = v))}
    />
    <div className={grid2}>
      <TextInput label="Lokasi syuting" value={draft.credits.shootingLocation} onChange={(v) => update((d) => (d.credits.shootingLocation = v))} />
      <TextInput label="Soundtrack" value={draft.credits.soundtrack} onChange={(v) => update((d) => (d.credits.soundtrack = v))} />
    </div>
    <TextInput
      label="Ucapan terima kasih"
      multiline
      value={draft.credits.specialThanks}
      onChange={(v) => update((d) => (d.credits.specialThanks = v))}
    />
  </div>
);

// ---------------------------------------------------------------- Pasca-acara

export const PostEventSection: React.FC<SectionProps> = ({ draft, update }) => (
  <div className="space-y-4">
    <p className="font-['Work_Sans'] text-sm text-[#4A413A]">
      Bagian ini otomatis muncul setelah acara terakhir selesai. Pratinjau dengan membuka undangan memakai{' '}
      <code className="font-['Courier_Prime'] bg-[#E3D5B8] px-1">?preview=after</code> (mode demo harus aktif).
    </p>
    <TextInput label="Judul" value={draft.postEvent.title} onChange={(v) => update((d) => (d.postEvent.title = v))} />
    <TextInput label="Pesan" multiline rows={4} value={draft.postEvent.message} onChange={(v) => update((d) => (d.postEvent.message = v))} />
    <SubHeading>Galeri hari H</SubHeading>
    <ListEditor
      items={draft.postEvent.gallery}
      onChange={(gallery) => update((d) => (d.postEvent.gallery = gallery))}
      addLabel="Tambah foto"
      itemTitle={(g, i) => `Foto ${i + 1}${g.caption ? ` · ${g.caption}` : ''}`}
      create={() => ({ id: newId('post'), image: '', caption: '' })}
      extraActions={
        <BulkImageUpload
          onUploaded={(urls) =>
            update((d) => {
              d.postEvent.gallery.push(...urls.map((image) => ({ id: newId('post'), image, caption: '' })));
            })
          }
        />
      }
      renderItem={(item, set) => (
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4">
          <ImageInput label="Foto" value={item.image} onChange={(image) => set({ image })} />
          <TextInput label="Keterangan" value={item.caption} onChange={(caption) => set({ caption })} />
        </div>
      )}
    />
  </div>
);

// ---------------------------------------------------------------- Pengaturan

const SECTION_LABELS: Array<{ key: keyof SectionToggles; label: string }> = [
  { key: 'story', label: 'Kisah (Behind the Scenes)' },
  { key: 'trailer', label: 'Trailer / video prewedding' },
  { key: 'gallery', label: 'Galeri pita seluloid' },
  { key: 'dressCode', label: 'Dress code' },
  { key: 'envelope', label: 'Amplop digital (rekening, QRIS, alamat kado)' },
  { key: 'rsvp', label: 'RSVP & tiket QR' },
  { key: 'wishes', label: 'Ucapan tamu' },
];

export const SettingsSection: React.FC<SectionProps> = ({ draft, update }) => (
  <div className="space-y-6">
    <div>
      <SubHeading>Tampilkan section</SubHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {SECTION_LABELS.map(({ key, label }) => (
          <Toggle key={key} label={label} checked={draft.sections[key]} onChange={(v) => update((d) => (d.sections[key] = v))} />
        ))}
      </div>
    </div>

    <div>
      <SubHeading>Template pesan WhatsApp</SubHeading>
      <TextInput
        label="Isi pesan"
        multiline
        rows={14}
        value={draft.whatsappTemplate}
        onChange={(v) => update((d) => (d.whatsappTemplate = v))}
        hint="Kode yang otomatis diganti: {sapaan} {nama} {link} {pasangan} {tanggal} {kota}. Gunakan *teks* untuk huruf tebal di WhatsApp."
      />
    </div>

    <div>
      <SubHeading>Mode demo</SubHeading>
      <Toggle
        label="Aktifkan parameter ?preview"
        checked={draft.demoMode}
        onChange={(v) => update((d) => (d.demoMode = v))}
        hint="Memungkinkan melihat tampilan saat/sesudah acara lewat ?preview=live atau ?preview=after. Boleh tetap aktif."
      />
    </div>
  </div>
);

