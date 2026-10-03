import { createRoot } from 'react-dom/client';
import './index.css';
import { loadContent } from './lib/content';

const rootEl = document.getElementById('root')!;

function showBootError() {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#171412;color:#F6EFE1;font-family:'Courier Prime',monospace;text-align:center;padding:24px">
      <div>
        <p style="color:#D7A13E;letter-spacing:.2em;font-size:12px;margin:0 0 8px">PROYEKTOR MACET</p>
        <p style="font-size:15px;margin:0 0 20px">Undangan gagal dimuat. Periksa koneksi internet Anda.</p>
        <button id="boot-reload" style="font:inherit;padding:10px 20px;background:#B4392B;color:#F6EFE1;border:2px solid #F6EFE1;cursor:pointer">MUAT ULANG</button>
      </div>
    </div>`;
  // Tanpa onclick inline: diblokir Content-Security-Policy (lihat public/.htaccess).
  document.getElementById('boot-reload')?.addEventListener('click', () => location.reload());
}

async function boot() {
  try {
    // Konten dimuat lebih dulu agar seluruh komponen membaca data yang benar.
    await loadContent();
  } catch (err) {
    console.error('Gagal memuat konten', err);
    showBootError();
    return;
  }
  const { default: App } = await import('./App');
  createRoot(rootEl).render(<App />);
}

boot();
