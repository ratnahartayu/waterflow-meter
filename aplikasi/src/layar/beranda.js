import { html } from "../html.js";
import { ikon } from "../ikon.js";
import { hariTanggal, jam, persenIsi, statusNode } from "../logika.js";
import { halaman, navBawah, memuat, aktifSaja, namaPendek } from "./bersama.js";

export function tampil(k) {
  const aktif = aktifSaja(k.peringatan);
  const nodeBahaya = new Set(aktif.map((p) => p.node_id));
  const sekarang = Date.now();

  const kepala = html`
    <header class="kepala">
      <div class="kepala-atas">Pemantauan Meter Air Cerdas</div>
      <h1 tabindex="-1">Kabupaten Tuban</h1>
      <div class="kepala-sub">${hariTanggal(sekarang)} · ${jam(sekarang)} WIB</div>
    </header>`;

  if (!k.nodes) return halaman(kepala, memuat(), navBawah("", aktif.length));

  const ringkas = nodeBahaya.size
    ? html`<div class="kartu kartu-bahaya baris">
        ${ikon.awas({ ukuran: 28, warna: "#C62828" })}
        <div class="tumbuh teks-bahaya tebal">${nodeBahaya.size} toren perlu dicek hari ini</div>
        <a class="tautan-tebal" href="#/peringatan">Lihat</a>
      </div>`
    : html`<div class="kartu kartu-aman baris">
        <span class="titik hijau"></span>
        <div class="tumbuh teks-aman tebal">Semua toren aman</div>
      </div>`;

  const daftar = k.nodes.map((n) => {
    const st = statusNode(n, aktif);
    const persen = persenIsi(n);
    return html`
      <a class="kartu baris toren-baris${st.bahaya ? " kartu-bahaya" : ""}" href="#/toren/${n.id}">
        <span class="titik ${st.bahaya ? "merah" : st.kosong ? "abu" : "hijau"}"></span>
        <div class="tumbuh">
          <div class="toren-nama">${namaPendek(n)}</div>
          <div class="toren-ket${st.bahaya ? " teks-bahaya tebal-sedang" : ""}">${n.kecamatan} · ${st.teks}</div>
        </div>
        <div class="toren-persen${st.bahaya ? " teks-bahaya" : ""}">${persen == null ? "-" : `${persen}%`}</div>
      </a>`;
  });

  return halaman(kepala, html`
    ${ringkas}
    <h2 class="judul-bagian">Lima toren</h2>
    ${daftar}
    <p class="catatan">Hijau = aman, merah = perlu dicek. Angka = isi toren.</p>
  `, navBawah("", aktif.length));
}
