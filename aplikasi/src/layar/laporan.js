import { html } from "../html.js";
import { ikon } from "../ikon.js";
import { CONFIG } from "../config.js";
import { angka, jam, hariTanggal, tanggalBulan, hariPendek, tanggalWIB, geserTanggal, tengahHariMs, awalMinggu, awalBulan, airHilang, hilangWajar } from "../logika.js";
import { kepala, halaman, navBawah, memuat, aktifSaja, namaPendek } from "./bersama.js";

let rentang = "hari";
// harian semua toren dari awal bulan lalu (cukup untuk bulan ini dan grafik 7 hari)
let simpan = { kunci: null, sedang: null, perNode: null };

function ambil(k) {
  const hariIni = tanggalWIB(Date.now());
  const dari = [awalBulan(hariIni), geserTanggal(hariIni, -7)].sort()[0];
  const kunci = `${hariIni}:${k.nodes.map((n) => n.terakhir?.ts ?? 0).join(",")}`;
  if (simpan.kunci === kunci || simpan.sedang === kunci) return simpan;
  simpan = { ...simpan, sedang: kunci };
  Promise.all(k.nodes.map((n) => k.data.ambilHarian(n.id, dari, hariIni)))
    .then((h) => { simpan = { kunci, perNode: Object.fromEntries(k.nodes.map((n, i) => [n.id, h[i]])) }; })
    .catch((e) => { console.error(e); simpan = { kunci, galat: true }; })
    .finally(() => k.gambarUlang());
  return simpan;
}

function hitung(k, perNode, dari, sampai) {
  const hari = Math.round((Date.parse(sampai) - Date.parse(dari)) / 86400e3) + 1;
  const baris = k.nodes.map((n) => {
    const h = (perNode[n.id] ?? []).filter((x) => x.tanggal >= dari && x.tanggal <= sampai);
    const masuk = h.reduce((a, x) => a + x.masuk_l, 0);
    const keluar = h.reduce((a, x) => a + x.keluar_l, 0);
    const daftarHilang = h.map(airHilang).filter((x) => x != null);
    const hilang = daftarHilang.length ? daftarHilang.reduce((a, x) => a + x, 0) : null;
    return { node: n, masuk, keluar, hilang, wajar: hilangWajar(hilang, masuk, hari) };
  });
  const jumlah = baris.reduce((a, b) => ({ masuk: a.masuk + b.masuk, keluar: a.keluar + b.keluar, hilang: a.hilang + (b.hilang ?? 0) }), { masuk: 0, keluar: 0, hilang: 0 });
  return { baris, jumlah };
}

function keteranganRentang(hariIni) {
  const sekarang = Date.now();
  if (rentang === "hari") return { dari: hariIni, sampai: hariIni, teks: `${hariTanggal(sekarang)} (hari ini, sampai ${jam(sekarang)} WIB)`, judulWa: `hari ini ${hariTanggal(sekarang)} sampai ${jam(sekarang)} WIB` };
  const dari = rentang === "minggu" ? awalMinggu(hariIni) : awalBulan(hariIni);
  const teks = `${tanggalBulan(tengahHariMs(dari))} sampai ${tanggalBulan(sekarang)}`;
  return { dari, sampai: hariIni, teks: `${teks} (${rentang === "minggu" ? "minggu ini" : "bulan ini"})`, judulWa: `${rentang === "minggu" ? "minggu ini" : "bulan ini"}, ${teks}` };
}

const angkaHilang = (h) => (h == null ? "-" : h < 0 ? `+${angka(-h)}` : angka(h));

export function tampil(k) {
  const aktif = aktifSaja(k.peringatan);
  const nav = navBawah("laporan", aktif.length);
  const kep = kepala("Laporan", "Pemakaian air lima toren");
  if (!k.nodes) return halaman(kep, memuat(), nav);

  const s = ambil(k);
  const hariIni = tanggalWIB(Date.now());
  const r = keteranganRentang(hariIni);
  const tab = html`
    <div class="tab" role="group" aria-label="Pilih rentang laporan">
      ${[["hari", "Hari ini"], ["minggu", "Minggu ini"], ["bulan", "Bulan ini"]].map(([v, l]) =>
        html`<button type="button" data-aksi="rentang" data-v="${v}" aria-pressed="${rentang === v}">${l}</button>`)}
    </div>
    <div class="kecil redup sela">${r.teks}</div>`;

  if (s.galat) return halaman(kep, html`${tab}<div class="kartu redup">Laporan belum bisa diambil. Periksa sinyal internet.</div>`, nav);
  if (!s.perNode) return halaman(kep, html`${tab}${memuat()}`, nav);

  const { baris, jumlah } = hitung(k, s.perNode, r.dari, r.sampai);
  const tabel = html`
    <div class="kartu tabel" role="table" aria-label="Air masuk, keluar, dan hilang per toren">
      <div class="tabel-baris tabel-kepala" role="row">
        <div role="columnheader">Toren</div><div role="columnheader">Masuk (L)</div><div role="columnheader">Keluar (L)</div><div role="columnheader">Hilang</div>
      </div>
      ${baris.map((b) => html`
        <div class="tabel-baris${b.wajar ? "" : " baris-bahaya"}" role="row">
          <div role="cell" class="tebal-sedang">${namaPendek(b.node)}</div>
          <div role="cell">${angka(b.masuk)}</div>
          <div role="cell">${angka(b.keluar)}</div>
          <div role="cell" class="${b.hilang == null ? "redup" : b.wajar ? "teks-aman tebal-sedang" : "teks-bahaya tebal"}">${angkaHilang(b.hilang)}${b.wajar ? "" : html`<span class="sr"> perlu dicek</span>`}</div>
        </div>`)}
      <div class="tabel-baris tabel-jumlah" role="row">
        <div role="cell">Jumlah</div><div role="cell">${angka(jumlah.masuk)}</div><div role="cell">${angka(jumlah.keluar)}</div><div role="cell">${angkaHilang(jumlah.hilang)}</div>
      </div>
    </div>
    <p class="catatan">"Hilang" = air masuk dikurangi air keluar dan perubahan isi toren. Hijau berarti masih wajar (di bawah ${CONFIG.ambang.neracaMinL} L atau ${CONFIG.ambang.neracaPersen}% sehari). Merah perlu dicek. Tanda + berarti air keluar tercatat lebih banyak dari yang masuk.</p>`;

  // grafik 7 hari penuh terakhir (sampai kemarin), semua toren
  const tujuh = Array.from({ length: 7 }, (_, i) => geserTanggal(hariIni, i - 7));
  const perHari = tujuh.map((t) => k.nodes.reduce((a, n) => a + ((s.perNode[n.id] ?? []).find((x) => x.tanggal === t)?.keluar_l ?? 0), 0));
  const maks = Math.max(...perHari, 1);
  const rata = perHari.reduce((a, x) => a + x, 0) / 7;
  const grafik = html`
    <div class="kartu kolom">
      <h2 class="judul-kartu">Air keluar 7 hari terakhir, semua toren</h2>
      <div class="grafik grafik-hari" role="img" aria-label="Grafik air keluar per hari selama 7 hari terakhir">
        ${perHari.map((v, i) => html`<div class="batang tua" style="height:${Math.max(2, v / maks * 100)}%" title="${hariPendek(tengahHariMs(tujuh[i]))}: ${angka(v)} L"></div>`)}
      </div>
      <div class="sumbu-hari">${tujuh.map((t) => html`<span>${hariPendek(tengahHariMs(t))}</span>`)}</div>
      <div class="kecil redup paragraf">${rata > 0 ? `Rata-rata sekitar ${rata >= 1000 ? `${angka(rata / 1000)} ribu` : angka(rata)} liter sehari untuk lima desa.` : "Belum ada data minggu ini."}</div>
    </div>`;

  const teksWa = [`Laporan air toren desa, ${r.judulWa}`, "",
    ...baris.map((b) => `${namaPendek(b.node)}: masuk ${angka(b.masuk)} L, keluar ${angka(b.keluar)} L, hilang ${angkaHilang(b.hilang)} L${b.wajar ? "" : " (perlu dicek)"}`),
    "", `Jumlah: masuk ${angka(jumlah.masuk)} L, keluar ${angka(jumlah.keluar)} L, hilang ${angkaHilang(jumlah.hilang)} L`,
    aktif.length ? `${aktif.length} peringatan belum ditangani.` : "Tidak ada peringatan yang belum ditangani."].join("\n");
  const tautanWa = `https://wa.me/${CONFIG.waKepalaDesa}?text=${encodeURIComponent(teksWa)}`;

  return halaman(kep, html`
    ${tab}${tabel}${grafik}
    <a class="tombol tombol-besar" href="${tautanWa}" target="_blank" rel="noopener">${ikon.wa()}Kirim laporan ke WhatsApp kepala desa</a>
    <button type="button" class="tombol tombol-garis" data-aksi="unduh">Unduh tabel bulan ini (Excel)</button>
  `, nav);
}

// CSV dengan pemisah titik koma supaya langsung terbuka rapi di Excel berbahasa Indonesia
function unduh(k) {
  const hariIni = tanggalWIB(Date.now());
  const dari = awalBulan(hariIni);
  const baris = [["Tanggal", "Toren", "Air masuk (L)", "Air keluar (L)", "Isi awal (L)", "Isi akhir (L)", "Air hilang (L)", "Pompa hidup (jam)"]];
  for (const n of k.nodes) {
    for (const h of (simpan.perNode?.[n.id] ?? []).filter((x) => x.tanggal >= dari)) {
      baris.push([h.tanggal, namaPendek(n), h.masuk_l, h.keluar_l, h.toren_awal_l ?? "", h.toren_akhir_l ?? "", airHilang(h) ?? "", String(h.jam_pompa ?? 0).replace(".", ",")]);
    }
  }
  baris.sort((a, b) => (a[0] === "Tanggal" ? -1 : b[0] === "Tanggal" ? 1 : a[0].localeCompare(b[0]) || a[1].localeCompare(b[1])));
  const csv = "﻿" + baris.map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(";")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `laporan-toren-${hariIni.slice(0, 7)}.csv`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const aksi = {
  rentang: (el, ev, k) => { rentang = el.dataset.v; k.gambarUlang(); },
  unduh: (el, ev, k) => { if (simpan.perNode) unduh(k); },
};
