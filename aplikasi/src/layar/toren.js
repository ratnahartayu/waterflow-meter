import { html } from "../html.js";
import { CONFIG } from "../config.js";
import { angka, liter, jam, jamWIB, tanggalWIB, persenIsi, menitSejakData, lamaWaktu, airHilang, hilangWajar, infoJenis } from "../logika.js";
import { halaman, navBawah, memuat, aktifSaja } from "./bersama.js";

// bacaan 24 jam dan rekap hari ini per toren; diambil ulang bila ada paket baru
const simpan = new Map();

function ambil(k, node) {
  const kunci = `${node.id}:${node.terakhir?.ts ?? 0}`;
  const ada = simpan.get(node.id);
  if (ada?.kunci === kunci) return ada;
  if (ada?.sedang === kunci) return ada;
  const baru = { ...(ada ?? {}), sedang: kunci };
  simpan.set(node.id, baru);
  const jamIni = Math.floor(Date.now() / 3600e3) * 3600e3;
  const hariIni = tanggalWIB(Date.now());
  Promise.all([k.data.ambilBacaan(node.id, jamIni - 23 * 3600e3), k.data.ambilHarian(node.id, hariIni, hariIni)])
    .then(([bacaan, harian]) => simpan.set(node.id, { kunci, bacaan, hari: harian[0] ?? null, jamIni }))
    .catch((e) => { console.error(e); simpan.set(node.id, { kunci, galat: true }); })
    .finally(() => k.gambarUlang());
  return baru;
}

// 24 batang per jam: tinggi = rata-rata isi toren, biru tua = pompa mengisi,
// merah = isi turun tengah malam padahal tidak ada pemakaian dan pompa mati
function batangJam(bacaan, jamIni, kapasitas) {
  return Array.from({ length: 24 }, (_, i) => {
    const mulai = jamIni - (23 - i) * 3600e3;
    const isi = bacaan.filter((b) => b.ts >= mulai && b.ts < mulai + 3600e3);
    const sah = isi.filter((b) => b.toren_l != null && b.toren_l >= 0);
    const rata = sah.length ? sah.reduce((a, b) => a + b.toren_l, 0) / sah.length : null;
    const pompa = isi.some((b) => b.pompa);
    const j = jamWIB(mulai);
    const tenang = isi.length > 1 && isi.every((b) => !b.pompa && Number(b.vol_l) === 0);
    const turun = sah.length > 1 ? sah[0].toren_l - sah[sah.length - 1].toren_l : 0;
    const bocor = j >= 0 && j < 5 && tenang && turun > 5;
    return { mulai, tinggi: rata == null ? 0 : Math.max(2, Math.min(100, rata / kapasitas * 100)), warna: bocor ? "merah" : pompa ? "tua" : rata == null ? "kosong" : "muda", rata };
  });
}

function pompaTerakhir(bacaan, node) {
  if (node.terakhir?.pompa) {
    let i = bacaan.length - 1; while (i > 0 && bacaan[i - 1].pompa) i--;
    const mulai = bacaan[i]?.ts;
    return mulai ? `sejak ${jam(mulai - 15 * 60e3)}` : "sedang mengisi toren";
  }
  let akhir = bacaan.length - 1; while (akhir >= 0 && !bacaan[akhir].pompa) akhir--;
  if (akhir < 0) return "tidak hidup dalam 24 jam terakhir";
  let mulai = akhir; while (mulai > 0 && bacaan[mulai - 1].pompa) mulai--;
  const menit = (akhir - mulai + 1) * 15;
  return `terakhir hidup ${jam(bacaan[mulai].ts - 15 * 60e3)}, ${menit} menit`;
}

function cukupUntuk(bacaan, node) {
  const isi = node.terakhir?.toren_l;
  if (isi == null || isi < 0) return "";
  const tiga = bacaan.filter((b) => b.ts > Date.now() - 3 * 3600e3);
  const perJam = tiga.length ? tiga.reduce((a, b) => a + Number(b.vol_l), 0) / (tiga.length / 4) : 0;
  if (perJam < 10) return "Belum ada pemakaian dalam 3 jam terakhir.";
  const j = isi / perJam;
  return j >= 24 ? "Cukup untuk lebih dari sehari dengan pemakaian seperti sekarang."
    : `Cukup untuk kira-kira ${j < 1 ? "kurang dari 1" : Math.round(j)} jam dengan pemakaian seperti 3 jam terakhir.`;
}

export function tampil(k) {
  const id = k.arg[0];
  const aktif = aktifSaja(k.peringatan);
  const nav = navBawah("", aktif.length);
  if (!k.nodes) return halaman(html`<header class="kepala"><h1 tabindex="-1">Toren</h1></header>`, memuat(), nav);
  const node = k.nodes.find((n) => n.id === id);
  if (!node) return halaman(html`<header class="kepala"><h1 tabindex="-1">Toren tidak ditemukan</h1></header>`, html`<a class="tombol" href="#/">Kembali ke beranda</a>`, nav);

  const menit = menitSejakData(node);
  const sub = `Kec. ${node.kecamatan} · ${node.terakhir ? `data terakhir ${jam(node.terakhir.ts)} WIB${menit > CONFIG.ambang.offlineMenit ? ` (${lamaWaktu(menit)} lalu)` : ""}` : "belum ada data"}`;
  const kepala = html`
    <header class="kepala kepala-baris">
      <a class="tombol-kembali" href="#/" aria-label="Kembali ke beranda"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></a>
      <div class="kepala-teks"><h1 tabindex="-1">${node.nama}</h1><div class="kepala-sub">${sub}</div></div>
    </header>`;

  const s = ambil(k, node);
  const p = aktif.find((x) => x.node_id === node.id);
  const info = p && infoJenis(p.jenis);
  const kotakPeringatan = p ? html`
    <div class="kartu kartu-bahaya kolom">
      <div class="teks-bahaya tebal">Perlu dicek: ${info.judul}</div>
      <div class="paragraf">${info.teks(p, node)}</div>
      <a class="tombol" href="#/peringatan">Lihat apa yang harus dilakukan</a>
    </div>` : "";

  const kap = node.toren_l || 2000;
  const persen = persenIsi(node);
  const isi = node.terakhir?.toren_l;
  const bacaan = s.bacaan ?? [];

  const kotakIsi = html`
    <div class="kartu baris kotak-isi">
      <div class="gambar-toren" role="img" aria-label="Isi toren ${persen ?? 0} persen">
        <div class="air" style="height:${persen ?? 0}%"></div>
        <div class="permukaan" style="bottom:${persen ?? 0}%"></div>
      </div>
      <div class="kolom tumbuh rapat">
        <div class="label">Isi toren sekarang</div>
        <div class="angka-besar">${persen == null ? "-" : `${persen}%`}</div>
        <div class="tebal-sedang">${isi == null || isi < 0 ? "Alat ukur isi toren tidak terbaca" : `${angka(isi)} liter dari ${angka(kap)} liter`}</div>
        <div class="kecil redup">${s.bacaan ? cukupUntuk(bacaan, node) : ""}</div>
      </div>
    </div>`;

  let ubin;
  if (s.galat) ubin = html`<div class="kartu redup">Data hari ini belum bisa diambil. Periksa sinyal internet.</div>`;
  else if (!s.bacaan) ubin = memuat();
  else {
    const h = s.hari;
    const hilang = airHilang(h);
    const wajar = hilangWajar(hilang, h?.masuk_l ?? 0);
    const pompaHidup = !!node.terakhir?.pompa;
    ubin = html`
      <div class="ubin-grid">
        <div class="kartu ubin"><div class="label">Air masuk hari ini</div><div class="angka-sedang">${liter(h?.masuk_l ?? 0)}</div><div class="kecil redup">dari pompa sumur</div></div>
        <div class="kartu ubin"><div class="label">Air keluar hari ini</div><div class="angka-sedang">${liter(h?.keluar_l ?? 0)}</div><div class="kecil redup">ke rumah warga</div></div>
        <div class="kartu ubin"><div class="label">Pompa</div><div class="angka-kecil ${pompaHidup ? "teks-biru" : "redup"}">${pompaHidup ? "Hidup" : "Mati"}</div><div class="kecil redup">${pompaTerakhir(bacaan, node)}</div></div>
        <div class="kartu ubin${wajar ? "" : " kartu-bahaya"}"><div class="label">Air yang hilang</div>
          <div class="angka-kecil ${wajar ? "teks-aman" : "teks-bahaya"}">${hilang == null ? "-" : hilang >= 0 ? liter(hilang) : wajar ? "0 L" : `${liter(-hilang)} lebih`}</div>
          <div class="kecil ${wajar ? "redup" : "teks-bahaya tebal-sedang"}">${wajar ? "masih wajar · " : ""}batas wajar ${CONFIG.ambang.neracaMinL} L</div></div>
      </div>`;
  }

  let grafik = "";
  if (s.bacaan) {
    const batang = batangJam(bacaan, s.jamIni, kap);
    const label = [0, 12, 18, 23].map((i) => ({ i, teks: `${jam(batang[i].mulai)}${i === 0 && tanggalWIB(batang[0].mulai) !== tanggalWIB(Date.now()) ? " kemarin" : ""}` }));
    grafik = html`
      <div class="kartu kolom">
        <h2 class="judul-kartu">Isi toren 24 jam terakhir</h2>
        <div class="grafik" role="img" aria-label="Grafik isi toren per jam selama 24 jam terakhir">
          ${batang.map((b) => html`<div class="batang ${b.warna}" style="height:${b.tinggi}%" title="${jam(b.mulai)}: ${b.rata == null ? "tidak ada data" : liter(b.rata)}"></div>`)}
        </div>
        <div class="sumbu">${label.map((l) => html`<span style="left:${(l.i + 0.5) / 24 * 100}%">${l.teks}</span>`)}</div>
        <div class="kecil redup paragraf">Biru tua = pompa mengisi. Merah = isi turun padahal tidak ada pemakaian (tengah malam).</div>
      </div>`;
  }

  return halaman(kepala, html`
    ${kotakPeringatan}${kotakIsi}${ubin}${grafik}
    <a class="tombol tombol-garis" href="#/laporan">Lihat laporan toren ini</a>
  `, nav);
}
