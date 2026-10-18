import { html } from "../html.js";
import { waktuKejadian, tanggalPendek, infoJenis } from "../logika.js";
import { kepala, halaman, navBawah, memuat, aktifSaja, namaPendek } from "./bersama.js";

// formulir "Sudah ditangani": hanya satu yang terbuka
let buka = null, nama = "", catatan = "", sibuk = false, galat = "";
try { nama = localStorage.getItem("nama-operator") ?? ""; } catch {}

export function tampil(k) {
  const semua = k.peringatan;
  const aktif = aktifSaja(semua);
  const selesai = (semua ?? []).filter((p) => p.selesai != null).sort((a, b) => b.selesai - a.selesai);
  const nodeDari = (id) => k.nodes?.find((n) => n.id === id);
  const sub = semua ? `${aktif.length ? `${aktif.length} perlu ditangani` : "Tidak ada yang perlu ditangani"} · ${selesai.length} sudah selesai minggu ini` : "";

  if (!semua) return halaman(kepala("Peringatan", sub), memuat(), navBawah("peringatan"));

  const kartuAktif = aktif.map((p) => {
    const node = nodeDari(p.node_id);
    const info = infoJenis(p.jenis);
    const formulir = buka === p.id ? html`
      <form class="formulir" data-kirim="simpan" data-id="${p.id}">
        <label for="nama-penangani">Nama yang menangani</label>
        <input id="nama-penangani" data-ubah="nama" value="${nama}" maxlength="60" autocomplete="name" required>
        <label for="catatan-penanganan">Apa yang dikerjakan</label>
        <textarea id="catatan-penanganan" data-ubah="catatan" maxlength="300" rows="3" placeholder="Contoh: kran bawah toren bocor, sudah diganti">${catatan}</textarea>
        <div class="pesan-galat" role="alert">${galat}</div>
        <div class="baris rapat">
          <button type="button" class="tombol tombol-garis tumbuh" data-aksi="batal">Batal</button>
          <button type="submit" class="tombol tumbuh" ${sibuk ? "disabled" : ""}>${sibuk ? "Menyimpan…" : "Simpan"}</button>
        </div>
      </form>` : html`
      <div class="baris rapat">
        <a class="tombol tombol-garis tumbuh" href="#/toren/${p.node_id}">Lihat toren</a>
        <button type="button" class="tombol tumbuh" data-aksi="tangani" data-id="${p.id}">Sudah ditangani</button>
      </div>`;
    return html`
      <article class="kartu kartu-bahaya kolom">
        <div class="baris rapat"><span class="titik merah"></span><h2 class="judul-peringatan tumbuh">${namaPendek(node) || p.node_id}: ${info.judul}</h2></div>
        <div class="kecil redup">${waktuKejadian(p.ts)} · dikirim juga ke Telegram</div>
        <div class="paragraf">${info.teks(p, node)}</div>
        <div class="kotak-langkah">
          <div class="langkah-judul">Yang perlu dilakukan</div>
          <ol>${info.langkah.map((l) => html`<li>${l}</li>`)}</ol>
        </div>
        ${formulir}
      </article>`;
  });

  const kartuSelesai = selesai.map((p) => {
    const node = nodeDari(p.node_id);
    const oleh = p.ditangani_oleh ? `selesai oleh ${p.ditangani_oleh}` : "kembali normal sendiri";
    const cat = p.ditangani_oleh && p.catatan ? ` · ${p.catatan}` : "";
    return html`
      <article class="kartu kolom rapat selesai">
        <div class="baris rapat"><span class="titik hijau"></span><h3 class="judul-selesai tumbuh">${namaPendek(node) || p.node_id}: ${infoJenis(p.jenis).judul}</h3></div>
        <div class="kecil redup">${tanggalPendek(p.selesai)} · ${oleh}${cat}</div>
      </article>`;
  });

  return halaman(kepala("Peringatan", sub), html`
    ${aktif.length ? kartuAktif : html`<div class="kartu kartu-aman baris"><span class="titik hijau"></span><div class="teks-aman tebal">Semua toren aman, tidak ada yang perlu ditangani.</div></div>`}
    ${selesai.length ? html`<h2 class="judul-bagian">Sudah selesai</h2>${kartuSelesai}` : ""}
    <p class="catatan">Setiap peringatan juga dikirim ke grup Telegram desa supaya operator tahu meski aplikasi tidak dibuka. Kalau masalahnya belum beres, peringatan akan muncul lagi.</p>
  `, navBawah("peringatan", aktif.length));
}

export const aksi = {
  tangani: (el, ev, k) => { buka = el.dataset.id; catatan = ""; galat = ""; k.gambarUlang(); setTimeout(() => document.getElementById(nama ? "catatan-penanganan" : "nama-penangani")?.focus(), 50); },
  batal: (el, ev, k) => { buka = null; galat = ""; k.gambarUlang(); },
  nama: (el) => { nama = el.value; },
  catatan: (el) => { catatan = el.value; },
};

// dipanggil lewat data-kirim (submit formulir)
aksi.simpan = async (el, ev, k) => {
  const n = nama.trim();
  if (!n) { galat = "Tulis nama dulu."; k.gambarUlang(); return; }
  sibuk = true; galat = ""; k.gambarUlang();
  try {
    await k.data.tandaiDitangani(el.dataset.id, n, catatan.trim());
    try { localStorage.setItem("nama-operator", n); } catch {}
    buka = null; catatan = "";
  } catch (e) {
    console.error(e);
    galat = "Belum tersimpan. Periksa sinyal internet lalu coba lagi.";
  }
  sibuk = false; k.gambarUlang();
};
