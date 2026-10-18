import { html } from "../html.js";
import { ikon } from "../ikon.js";

let pin = "", galat = "", sibuk = false;

export function masuk() { pin = ""; galat = ""; sibuk = false; }

export const tampil = () => html`
  <div class="layar layar-masuk">
    <div class="masuk-merek">
      <div class="masuk-logo">${ikon.tetes({ ukuran: 48, warna: "#1565C0" })}</div>
      <h1 tabindex="-1">Pemantauan Meter Air Cerdas</h1>
      <div class="masuk-kab">Kabupaten Tuban</div>
    </div>
    <div class="masuk-kartu">
      <div class="masuk-label" id="label-pin">Masukkan PIN 4 angka</div>
      <div class="titik-pin" role="img" aria-labelledby="label-pin" aria-describedby="isi-pin">
        ${[0, 1, 2, 3].map((i) => html`<span class="${i < pin.length ? "terisi" : ""}"></span>`)}
      </div>
      <div id="isi-pin" class="sr">${pin.length} dari 4 angka sudah diisi</div>
      <div class="pesan-galat" role="alert">${galat}</div>
      <div class="papan-angka">
        ${["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => html`<button type="button" data-aksi="angka" data-n="${n}">${n}</button>`)}
        <button type="button" class="hapus" data-aksi="hapus">Hapus</button>
        <button type="button" data-aksi="angka" data-n="0">0</button>
        <button type="button" class="tombol-masuk" data-aksi="kirim" ${pin.length < 4 || sibuk ? "disabled" : ""}>${sibuk ? "…" : "Masuk"}</button>
      </div>
      <div class="masuk-catatan">Lupa PIN? Hubungi tim UNTAG lewat grup Telegram desa.</div>
    </div>
    <div class="masuk-kaki">Teknik Elektro UNTAG Surabaya · Rotary Clean Water Well</div>
  </div>`;

async function kirim(k) {
  if (pin.length < 4 || sibuk) return;
  sibuk = true; galat = ""; k.gambarUlang();
  try { await k.data.masuk(pin); pin = ""; }
  catch (e) { galat = e.message; pin = ""; }
  sibuk = false; k.gambarUlang();
}

function tambah(n, k) {
  if (sibuk || pin.length >= 4) return;
  pin += n; galat = "";
  k.gambarUlang();
  if (pin.length === 4) kirim(k);
}

export const aksi = {
  angka: (el, ev, k) => tambah(el.dataset.n, k),
  hapus: (el, ev, k) => { pin = pin.slice(0, -1); k.gambarUlang(); },
  kirim: (el, ev, k) => kirim(k),
};

// papan ketik komputer juga bisa dipakai
export function tombol(ev, k) {
  if (/^\d$/.test(ev.key)) tambah(ev.key, k);
  else if (ev.key === "Backspace") { pin = pin.slice(0, -1); k.gambarUlang(); }
  else if (ev.key === "Enter") kirim(k);
}
