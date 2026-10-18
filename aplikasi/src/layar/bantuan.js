import { html } from "../html.js";
import { ikon } from "../ikon.js";
import { CONFIG } from "../config.js";
import { kepala, halaman, navBawah, aktifSaja } from "./bersama.js";

let gantiPin = false, pinLama = "", pinBaru = "", pesan = "", berhasil = false, sibuk = false;

const RAWAT = [
  ["Bersihkan saringan", "Tutup kran sebelum meteran, buka tutup saringan Y, bilas pasirnya, pasang kembali. Kira-kira 10 menit."],
  ["Cocokkan angka meteran", "Baca angka di kaca meteran, bandingkan dengan angka di aplikasi. Kalau beda lebih dari 50 liter, laporkan."],
  ["Lihat lampu di kotak alat", "Lampu hijau berkedip berarti alat mengirim data. Kalau mati, cek stop kontak di rumah pompa dulu sebelum menelepon."],
];

export function tampil(k) {
  const aktif = aktifSaja(k.peringatan);
  const kontak = (href, judul, ket, ik) => href
    ? html`<a class="kartu baris" href="${href}" ${href.startsWith("http") ? html`target="_blank" rel="noopener"` : ""}>${ik}<div class="tumbuh kolom rapat-kecil"><div class="tebal-sedang">${judul}</div><div class="kecil redup">${ket}</div></div>${ikon.lanjut()}</a>`
    : html`<div class="kartu baris redup-kartu">${ik}<div class="tumbuh kolom rapat-kecil"><div class="tebal-sedang">${judul}</div><div class="kecil redup">${ket} · belum diisi di pengaturan aplikasi</div></div></div>`;

  const formPin = gantiPin ? html`
    <form class="formulir sela-dalam" data-kirim="simpanPin">
      <label for="pin-lama">PIN lama</label>
      <input id="pin-lama" data-ubah="lama" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" value="${pinLama}" autocomplete="current-password" required>
      <label for="pin-baru">PIN baru (4 angka)</label>
      <input id="pin-baru" data-ubah="baru" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" value="${pinBaru}" autocomplete="new-password" required>
      <div class="kecil redup">PIN baru berlaku untuk semua HP operator. Beri tahu operator lain lewat grup Telegram.</div>
      <div class="pesan-galat" role="alert">${berhasil ? "" : pesan}</div>
      <div class="baris rapat">
        <button type="button" class="tombol tombol-garis tumbuh" data-aksi="tutupPin">Batal</button>
        <button type="submit" class="tombol tumbuh" ${sibuk ? "disabled" : ""}>${sibuk ? "Menyimpan…" : "Simpan PIN"}</button>
      </div>
    </form>` : "";

  return halaman(kepala("Rawat dan bantuan", "Cara merawat alat dan siapa yang bisa dihubungi"), html`
    <h2 class="judul-bagian">Rawat rutin sebulan sekali</h2>
    ${RAWAT.map(([j, t], i) => html`
      <div class="kartu baris atas">
        <div class="nomor">${i + 1}</div>
        <div class="kolom rapat-kecil"><div class="tebal-sedang">${j}</div><div class="kecil redup paragraf">${t}</div></div>
      </div>`)}

    <h2 class="judul-bagian">Kalau ada masalah</h2>
    ${kontak(CONFIG.telegramGrup, "Grup Telegram operator", "Kirim foto dan ceritakan masalahnya", html`<span class="ikon-bulat">${ikon.kirim({ ukuran: 22 })}</span>`)}
    ${kontak(CONFIG.teleponUntag && `tel:${CONFIG.teleponUntag}`, "Telepon tim UNTAG Surabaya", "Senin sampai Jumat, 08.00 sampai 16.00", html`<span class="ikon-bulat">${ikon.telepon({ ukuran: 22 })}</span>`)}

    <h2 class="judul-bagian">Pengaturan</h2>
    <div class="kartu daftar-atur">
      <div class="atur-baris"><div class="tumbuh tebal-sedang">Nomor Telegram penerima peringatan</div><div class="kecil redup">${CONFIG.penerimaTelegram}</div></div>
      <button type="button" class="atur-baris" data-aksi="bukaPin" aria-expanded="${gantiPin}"><div class="tumbuh tebal-sedang">Ganti PIN</div>${ikon.lanjut()}</button>
      ${berhasil ? html`<div class="atur-baris teks-aman tebal-sedang" role="status">PIN sudah diganti.</div>` : ""}
      ${formPin}
      <button type="button" class="atur-baris teks-bahaya" data-aksi="keluar"><div class="tumbuh tebal">Keluar dari aplikasi</div></button>
    </div>
    <p class="catatan tengah">Pemantauan Meter Air Cerdas · versi ${CONFIG.versi}<br>Teknik Elektro UNTAG Surabaya</p>
  `, navBawah("bantuan", aktif.length));
}

export const aksi = {
  bukaPin: (el, ev, k) => { gantiPin = !gantiPin; pinLama = pinBaru = pesan = ""; berhasil = false; k.gambarUlang(); if (gantiPin) setTimeout(() => document.getElementById("pin-lama")?.focus(), 50); },
  tutupPin: (el, ev, k) => { gantiPin = false; k.gambarUlang(); },
  lama: (el) => { pinLama = el.value; },
  baru: (el) => { pinBaru = el.value; },
  keluar: (el, ev, k) => { location.hash = "#/"; k.data.keluar(); },
  simpanPin: async (el, ev, k) => {
    if (!/^\d{4}$/.test(pinLama) || !/^\d{4}$/.test(pinBaru)) { pesan = "PIN harus 4 angka."; k.gambarUlang(); return; }
    sibuk = true; pesan = ""; k.gambarUlang();
    try { await k.data.gantiPin(pinLama, pinBaru); berhasil = true; gantiPin = false; }
    catch (e) { pesan = e.message; }
    sibuk = false; pinLama = pinBaru = ""; k.gambarUlang();
  },
};
