/**
 * Konten default undangan (template demo "Dimas & Laras").
 * Dipakai untuk mode demo dan sebagai titik awal saat client baru belum mengisi konten.
 * Untuk client sungguhan, edit konten lewat panel admin → tab Konten (tanpa mengubah file ini).
 */

import groomImg from '@/src/assets/images/groom_portrait.webp';
import brideImg from '@/src/assets/images/bride_portrait.webp';
import posterImg from '@/src/assets/images/wedding_poster.webp';
import sceneCafeImg from '@/src/assets/images/retro_scene_stills.webp';
import sceneBeachImg from '@/src/assets/images/retro_beach_stills.webp';

import type { WeddingContent } from './types';
import { isSupabaseConfigured } from '../lib/supabase';

export const defaultContent: WeddingContent = {
  couple: {
    groom: {
      callname: "Dimas",
      fullname: "Dimas Aditya Pratama, S.T.",
      bio: "Putra pertama yang menyukai piringan hitam lawas, fotografi seluloid, dan secangkir seduhan manual di pagi hari.",
      parents: "Bpk. H. Bambang Sutrisno & Ibu Hj. Ratna Juwita",
      instagram: "@dimasaditya",
      photo: groomImg,
    },
    bride: {
      callname: "Laras",
      fullname: "Larasati Sekar Kinanti, M.Ds.",
      bio: "Putri bungsu yang jatuh cinta pada desain vintage, buku sastra klasik, dan hangatnya obrolan senja.",
      parents: "Bpk. Dr. Hendro Prabowo & Ibu Dra. Siti Aminah",
      instagram: "@laras.kinanti",
      photo: brideImg,
    },
  },
  demoMode: true,
  sections: {
    trailer: true,
    story: true,
    gallery: true,
    dressCode: true,
    envelope: true,
    rsvp: true,
    wishes: true,
  },
  presentedBy: "Keluarga Besar Sutrisno & Prabowo",
  producedBy: "Keluarga Sutrisno & Prabowo",
  tagline: "A Love Story in 35mm Celluloid",
  city: "Palembang",
  region: "Sumatera Selatan",
  timeZone: "Asia/Jakarta",
  filmEdgeText: "PREMIERE 2027 ▸ 400 ISO",
  posterImage: posterImg,
  ogImage: "",
  synopsis: {
    quote: "Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.",
    source: "QS. Ar-Rum : 21",
  },
  events: [
    {
      id: "akad",
      title: "AKAD NIKAH",
      subtitle: "The Sacred Vows",
      dateISO: "2027-03-20T08:00:00+07:00",
      endISO: "2027-03-20T10:00:00+07:00",
      venue: "Masjid Agung Sultan Mahmud Badaruddin I",
      address: "Jl. Jend. Sudirman, 19 Ilir, Kec. Bukit Kecil, Kota Palembang, Sumatera Selatan",
      mapsUrl: "",
    },
    {
      id: "resepsi",
      title: "PREMIERE RECEPTION",
      subtitle: "The Celebration & Screening",
      dateISO: "2027-03-20T11:30:00+07:00",
      endISO: "2027-03-20T14:30:00+07:00",
      venue: "Grand Ballroom Hotel Aryaduta Palembang",
      address: "Jl. POM IX, Palembang Square, Lorok Pakjo, Kec. Ilir Barat I, Kota Palembang",
      mapsUrl: "",
    },
  ],
  mainEventId: "resepsi",
  rsvp: {
    deadlineISO: "2027-03-01T23:59:59+07:00",
  },
  whatsappTemplate: `Yth. {sapaan} {nama},

Tanpa mengurangi rasa hormat, perkenankan kami mengundang {sapaan} untuk hadir dalam pemutaran perdana ikatan suci kami:

*The Premiere: {pasangan}*
{tanggal}
{kota}

Untuk melihat jadwal tayang dan mencetak tiket premiere digital, silakan buka tautan berikut:
{link}

Merupakan suatu kebahagiaan bagi kami apabila {sapaan} berkenan hadir dan memberikan doa restu.

Salam hangat,
{pasangan}`,
  intro: {
    // Contoh video pendek (CC0, MDN) khusus mode demo lokal. Untuk client, isi lewat admin.
    videoUrl: isSupabaseConfigured ? "" : "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  trailer: {
    title: "Official Trailer",
    caption: "Cuplikan perjalanan kami sebelum hari pemutaran perdana.",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  },
  dressCode: {
    title: "Catatan Produksi & Tata Busana",
    description: "Para penonton diharapkan mengenakan busana bergaya Retro 60s–70s, Vintage Formal, atau Nuansa Earthy Tones yang hangat.",
    palette: ["#171412", "#EFE5D0", "#B4392B", "#D7A13E", "#3C6966", "#8C8274"],
  },
  scenes: [
    {
      id: "scene-1",
      year: "2019",
      title: "Pertemuan di Toko Piringan Hitam",
      story: "Sebuah sore berhujan di pasar loak antik. Dua tangan tak sengaja menyentuh sampul album kaset lawas yang sama. Pertukaran senyum kecil menjadi prolog yang tak pernah disangka.",
      image: sceneCafeImg,
    },
    {
      id: "scene-2",
      year: "2022",
      title: "Ratusan Roll Film & Cangkir Kopi",
      story: "Tahun-tahun berikutnya diisi dengan perjalanan menjelajah kota-kota tua. Menunggu rol film dicuci, berdiskusi tentang impian di masa depan, dan belajar saling melengkapi dalam sunyi maupun ramai.",
      image: sceneBeachImg,
    },
    {
      id: "scene-3",
      year: "2025",
      title: "Satu Janji di Tepian Senja",
      story: "Di bawah langit jingga temaram, gulungan film baru disematkan: sebuah cincin dan janji sehidup semati untuk menulis babak terindah bersama dalam sebuah ikatan suci.",
      image: posterImg,
    },
  ],
  stills: [
    {
      id: "still-1",
      title: "Prolog Hari Bahagia",
      caption: "Momen hangat di bawah naungan pohon randu tua.",
      image: posterImg,
    },
    {
      id: "still-2",
      title: "Tawa di Kedai Tua",
      caption: "Canda tawa di antara cangkir enamel dan aroma kayu jati.",
      image: sceneCafeImg,
    },
    {
      id: "still-3",
      title: "Langkah Berdampingan",
      caption: "Menyusuri pantai sebelum matahari tenggelam di ufuk barat.",
      image: sceneBeachImg,
    },
    {
      id: "still-4",
      title: "Sang Mempelai Pria",
      caption: "Dimas dalam balutan setelan vintage cokelat tanah.",
      image: groomImg,
    },
    {
      id: "still-5",
      title: "Sang Mempelai Wanita",
      caption: "Laras dengan riasan klasik dan renda lembut.",
      image: brideImg,
    },
    {
      id: "still-6",
      title: "Bingkai Bersama",
      caption: "Dua hati yang siap memulai babak baru.",
      image: posterImg,
    },
  ],
  envelope: {
    qris: {
      image: "",
      payload: "00020101021126580016ID.CO.QRIS.WWW011893600998822115204581253033605802ID5913DIMAS & LARAS6009PALEMBANG6304",
      nmid: "ID1029384756201",
      merchantName: "DIMAS & LARAS",
    },
    accounts: [
      {
        id: "acc-1",
        bank: "BCA",
        number: "8280192831",
        holder: "DIMAS ADITYA PRATAMA",
      },
      {
        id: "acc-2",
        bank: "MANDIRI",
        number: "1130099882211",
        holder: "LARASATI SEKAR KINANTI",
      },
    ],
    giftAddress: {
      recipient: "Dimas & Laras (Rumah Utama)",
      address: "Jl. Veteran No. 42B, RT 012 / RW 004, Kec. Ilir Timur II, Kota Palembang, Sumatera Selatan 30113",
      phone: "+62 812-7890-1234",
      note: "Mohon cantumkan nama pengirim agar kami dapat menyampaikan tanda terima kasih secara langsung.",
    },
  },
  credits: {
    executiveProducers: [
      "Bpk. H. Bambang Sutrisno & Ibu Hj. Ratna Juwita",
      "Bpk. Dr. Hendro Prabowo & Ibu Dra. Siti Aminah",
    ],
    supportingCast: [
      "Keluarga Besar Sutrisno",
      "Keluarga Besar Prabowo",
      "Sahabat & Kerabat Tercinta",
    ],
    shootingLocation: "Palembang, Sumatera Selatan",
    soundtrack: "Canon in D Major (Acoustic Vinyl Master)",
    specialThanks: "Seluruh tamu undangan, keluarga, dan sahabat yang telah hadir menjadi saksi perjalanan ini.",
  },
  audio: {
    title: "A Thousand Years (Vintage Acoustic)",
    artist: "Cinema Romantic Ensemble",
    src: "https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3",
  },
  postEvent: {
    title: "Terima Kasih Telah Menjadi Saksi",
    message: "Pemutaran perdana telah usai, namun kisah kami baru saja dimulai. Terima kasih atas kehadiran, doa, dan tanda kasih yang telah Anda berikan. Berikut beberapa potongan adegan dari hari bahagia kami.",
    videoUrl: "",
    gallery: [
      { id: "post-1", image: posterImg, caption: "Momen sakral setelah ijab kabul" },
      { id: "post-2", image: sceneCafeImg, caption: "Tawa bersama keluarga besar" },
      { id: "post-3", image: sceneBeachImg, caption: "Sesi foto di penghujung senja" },
      { id: "post-4", image: brideImg, caption: "Sang mempelai wanita di pelaminan" },
    ],
  },
};
