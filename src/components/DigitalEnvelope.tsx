import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { weddingConfig } from '../content/wedding.config';
import { copyText } from '../lib/files';
import { Modal } from './ui/Modal';

const { qris, accounts, giftAddress } = weddingConfig.envelope;
const hasQris = !!(qris.image.trim() || qris.payload.trim());
const hasGiftAddress = !!giftAddress.address.trim();

export const DigitalEnvelope: React.FC = () => {
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showQris, setShowQris] = useState(false);
  const [qrisDataUrl, setQrisDataUrl] = useState('');

  // QRIS dibuat lokal dari payload di config (tanpa layanan pihak ketiga).
  useEffect(() => {
    // Gambar QRIS asli diutamakan; payload hanya dipakai jika gambar tidak ada.
    if (!showQris || qrisDataUrl || qris.image.trim() || !qris.payload.trim()) return;
    QRCode.toDataURL(qris.payload, { width: 480, margin: 1, errorCorrectionLevel: 'M' })
      .then(setQrisDataUrl)
      .catch((err) => console.error('Gagal membuat QRIS', err));
  }, [showQris, qrisDataUrl]);

  const copyToClipboard = async (text: string, identifier: string) => {
    if (!(await copyText(text))) return;
    if (identifier === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedBank(identifier);
      setTimeout(() => setCopiedBank(null), 2000);
    }
  };

  const formatAccountNumber = (num: string) => {
    return num.replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <section className="px-4 sm:px-6 py-16 max-w-4xl mx-auto">
      {/* Section Title */}
      <div className="text-center mb-12">
        <span className="font-['Courier_Prime'] text-xs uppercase tracking-[0.25em] text-[#6B6156] block mb-2 font-bold">
          WARM TRIBUTES & GIFTS
        </span>
        <h2 className="font-['Anton'] text-3xl sm:text-5xl uppercase tracking-tight text-[#171412]">
          TANDA KASIH
        </h2>
        <div className="w-16 h-[2px] bg-[#B4392B] mx-auto mt-3" />
        <p className="font-['Work_Sans'] text-xs sm:text-sm text-[#4A413A] max-w-xl mx-auto mt-3 leading-relaxed">
          Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda bermaksud memberikan tanda kasih, Anda dapat menyampaikannya melalui tautan rekening resmi atau alamat di bawah ini.
        </p>
      </div>

      {/* Bank Account Cards */}
      {accounts.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="border-2 border-[#171412] bg-[#E3D5B8] p-6 shadow-[5px_5px_0px_#171412] relative flex flex-col justify-between"
          >
            {/* Vintage Passbook Stamp Header */}
            <div className="flex items-center justify-between border-b border-[#171412]/20 pb-3 mb-4">
              <span className="font-['Anton'] text-2xl text-[#171412] tracking-wider">
                BANK {acc.bank}
              </span>
              <span className="font-['Courier_Prime'] text-[11px] text-[#B4392B] uppercase tracking-widest font-bold border border-[#B4392B] px-2 py-0.5">
                SLIP SETORAN
              </span>
            </div>

            <div className="my-2">
              <span className="font-['Courier_Prime'] text-[11px] uppercase text-[#6B6156] tracking-widest block mb-1">
                NOMOR REKENING:
              </span>
              <p className="font-['Courier_Prime'] font-bold text-xl sm:text-2xl text-[#171412] tracking-wider tabular-nums">
                {formatAccountNumber(acc.number)}
              </p>
              <p className="font-['Work_Sans'] text-xs text-[#4A413A] mt-1">
                Atas Nama: <span className="font-semibold text-[#171412]">{acc.holder}</span>
              </p>
            </div>

            <div className="pt-4 border-t border-[#171412]/20 mt-4 flex items-center justify-between">
              <button
                onClick={() => copyToClipboard(acc.number, acc.bank)}
                className="w-full py-2.5 px-4 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{copiedBank === acc.bank ? '✓' : '📋'}</span>
                {copiedBank === acc.bank ? 'NOMOR TERSALIN!' : 'SALIN REKENING'}
              </button>
            </div>
          </div>
        ))}
      </div>

      )}

      {/* QRIS & Physical Gift Grid */}
      {(hasQris || hasGiftAddress) && (
      <div className={`grid grid-cols-1 gap-6 ${hasQris && hasGiftAddress ? 'md:grid-cols-2' : 'max-w-md mx-auto'}`}>
        {/* QRIS Card */}
        {hasQris && (
        <div className="border-2 border-[#171412] bg-[#EFE5D0] p-6 shadow-[5px_5px_0px_#171412] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#171412]/20 pb-3 mb-4">
              <span className="font-['Anton'] text-xl text-[#171412] tracking-wider">
                QRIS NASIONAL
              </span>
              <span className="font-['Courier_Prime'] text-[11px] text-[#3C6966] font-bold border border-[#3C6966] px-2 py-0.5">
                INSTANT SCAN
              </span>
            </div>
            <p className="font-['Work_Sans'] text-xs text-[#4A413A] leading-relaxed mb-4">
              Mendukung semua bank dan e-wallet (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay).
            </p>
          </div>

          <button
            onClick={() => setShowQris(true)}
            className="w-full py-2.5 px-4 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#3C6966] text-[#F6EFE1] hover:bg-[#171412] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>📱</span> BUKA KODE QRIS
          </button>
        </div>
        )}

        {/* Physical Gift Address Card */}
        {hasGiftAddress && (
        <div className="border-2 border-[#171412] bg-[#EFE5D0] p-6 shadow-[5px_5px_0px_#171412] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#171412]/20 pb-3 mb-4">
              <span className="font-['Anton'] text-xl text-[#171412] tracking-wider">
                KIRIM KADO FISIK
              </span>
              <span className="font-['Courier_Prime'] text-[11px] text-[#A87A1F] font-bold border border-[#A87A1F] px-2 py-0.5">
                PARCEL / ALAMAT
              </span>
            </div>
            <p className="font-['Work_Sans'] text-xs font-semibold text-[#171412] mb-1">
              {giftAddress.recipient}
            </p>
            <p className="font-['Work_Sans'] text-xs text-[#4A413A] leading-relaxed mb-4">
              {giftAddress.address}
            </p>
            {giftAddress.phone && (
              <p className="font-['Courier_Prime'] text-xs text-[#4A413A] -mt-2 mb-3">☎ {giftAddress.phone}</p>
            )}
            {giftAddress.note && (
              <p className="font-['Work_Sans'] text-[11px] italic text-[#6B6156] leading-relaxed mb-4">{giftAddress.note}</p>
            )}
          </div>

          <button
            onClick={() => copyToClipboard(`${giftAddress.recipient}
${giftAddress.address}${giftAddress.phone ? `
${giftAddress.phone}` : ''}`, 'address')}
            className="w-full py-2.5 px-4 font-['Courier_Prime'] text-xs uppercase tracking-widest font-bold border-2 border-[#171412] bg-[#EFE5D0] text-[#171412] hover:bg-[#171412] hover:text-[#EFE5D0] transition-colors shadow-[2px_2px_0px_#171412] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{copiedAddress ? '✓' : '📦'}</span>
            {copiedAddress ? 'ALAMAT TERSALIN!' : 'SALIN ALAMAT KADO'}
          </button>
        </div>
        )}
      </div>
      )}

      {/* QRIS Modal */}
      <Modal
        open={showQris}
        onClose={() => setShowQris(false)}
        labelledBy="qris-title"
        className="max-w-sm w-full border-2 border-[#171412] bg-[#EFE5D0] p-6 shadow-[8px_8px_0px_#B4392B] text-center"
      >
        <button
          onClick={() => setShowQris(false)}
          className="absolute top-3 right-4 font-['Courier_Prime'] text-lg font-bold text-[#171412] hover:text-[#B4392B] cursor-pointer"
          aria-label="Tutup QRIS"
        >
          ✕
        </button>

        <span className="font-['Courier_Prime'] text-xs uppercase tracking-widest text-[#B4392B] font-bold">
          QRIS PEMBAYARAN ELEKTRONIK
        </span>
        <h3 id="qris-title" className="font-['Anton'] text-2xl uppercase text-[#171412] mt-1 mb-4">
          {qris.merchantName} WEDDING
        </h3>

        <div className="p-4 bg-white border-2 border-[#171412] inline-block mb-4 shadow-[3px_3px_0px_#171412]">
          {qris.image.trim() ? (
            <img src={qris.image} alt={`Kode QRIS ${qris.merchantName}`} className="w-60 max-w-full mx-auto" />
          ) : qrisDataUrl ? (
            <img src={qrisDataUrl} alt={`Kode QRIS ${qris.merchantName}`} className="w-52 h-52 mx-auto" />
          ) : (
            <div className="w-52 h-52 mx-auto bg-[#E3D5B8] animate-pulse" />
          )}
          <p className="font-['Courier_Prime'] text-[11px] text-[#4A413A] mt-2 font-bold uppercase tracking-wider">
            {[qris.nmid && `NMID: ${qris.nmid}`, qris.merchantName].filter(Boolean).join(' · ')}
          </p>
        </div>

        <p className="font-['Work_Sans'] text-xs text-[#4A413A]">
          Pindai menggunakan aplikasi mobile banking atau dompet digital Anda.
        </p>
      </Modal>
    </section>
  );
};
