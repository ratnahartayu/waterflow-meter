// Data contoh untuk mencoba aplikasi tanpa Firebase dan tanpa alat terpasang.
// Buka aplikasi dengan ?contoh di alamat, PIN 1234. Isinya simulasi 35 hari terakhir.
import { tanggalWIB, jamWIB } from "../logika.js";

export const contoh = true;

const NODE = [
  { id: "tuban-mander",   nama: "Toren Mander",       desa: "Mander",       kecamatan: "Tambakboyo", pakai: 1.0 },
  { id: "tuban-bader",    nama: "Toren Bader",        desa: "Bader",        kecamatan: "Jatirogo",   pakai: 1.2 },
  { id: "tuban-tuwiri",   nama: "Toren Tuwiri Kulon", desa: "Tuwiri Kulon", kecamatan: "Merakurak",  pakai: 0.8, bocorLJam: 24 },
  { id: "tuban-kabluan",  nama: "Toren Kabluan",      desa: "Kabluan",      kecamatan: "Bangilan",   pakai: 0.9 },
  { id: "tuban-ngulahan", nama: "Toren Ngulahan",     desa: "Ngulahan",     kecamatan: "Tambakboyo", pakai: 1.1 },
];

// pemakaian warga per jam (liter per 15 menit), ramai pagi dan sore
const POLA = [0, 0, 0, 0, 20, 60, 90, 80, 50, 40, 40, 40, 50, 40, 30, 40, 60, 80, 70, 50, 30, 20, 10, 0];
const LANGKAH = 15 * 60e3;

function acak(benih) { let s = benih; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

const sekarang = Math.floor(Date.now() / LANGKAH) * LANGKAH;
const bacaan = new Map(), harian = new Map();

NODE.forEach((n, i) => {
  const r = acak(1000 + i * 77);
  let toren = 1200 + i * 150, pompa = false;
  const daftar = [], hari = new Map();
  for (let t = sekarang - 35 * 86400e3; t <= sekarang; t += LANGKAH) {
    const j = jamWIB(t);
    const akhirPekan = [0, 6].includes(new Date(t + 7 * 3600e3).getUTCDay());
    let keluar = Math.round(POLA[j] * n.pakai * (akhirPekan ? 1.15 : 1) * (0.7 + r() * 0.6) / 10) * 10;
    keluar = Math.min(keluar, Math.max(0, toren - 50));
    if (toren < 2000 * 0.35) pompa = true;
    if (toren > 2000 * 0.92) pompa = false;
    const masuk = pompa ? Math.min(600, Math.floor((2000 - toren + keluar) / 10) * 10) : 0;
    const bocor = n.bocorLJam && t > sekarang - 3 * 86400e3 ? n.bocorLJam / 4 : 0;
    const riak = (r() - 0.5) * 6;
    toren = Math.max(0, Math.min(2000, toren + masuk - keluar - bocor));
    const b = { ts: t, vol_l: keluar, vol_in_l: masuk, q_lpm: keluar / 15, q_in_lpm: masuk / 15, toren_l: Math.max(0, Math.min(2000, Math.round(toren + riak))), pompa, v_aki: 12.6 };
    daftar.push(b);

    const tgl = tanggalWIB(t);
    const h = hari.get(tgl) ?? { tanggal: tgl, masuk_l: 0, keluar_l: 0, paket: 0, paket_pompa: 0 };
    h.masuk_l += masuk; h.keluar_l += keluar; h.paket++; if (pompa) h.paket_pompa++;
    h.jam_pompa = h.paket_pompa * 0.25;
    if (h.toren_awal_l == null) h.toren_awal_l = b.toren_l;
    h.toren_akhir_l = b.toren_l;
    hari.set(tgl, h);
  }
  bacaan.set(n.id, daftar);
  harian.set(n.id, [...hari.values()]);
});

const nodes = NODE.map(({ pakai, bocorLJam, ...n }, urutan) => {
  const d = bacaan.get(n.id), b = d[d.length - 1];
  const tunda = n.id === "tuban-tuwiri" ? 15 * 60e3 : 0;
  return { ...n, kabupaten: "Tuban", toren_l: 2000, urutan, terakhir: { ...b, ts: b.ts - tunda } };
});

const hariIni = tanggalWIB(sekarang);
const lalu = (hari, j, m) => Date.parse(hariIni) - 7 * 3600e3 - hari * 86400e3 + (j * 60 + m) * 60e3;
let peringatan = [
  { id: "c1", node_id: "tuban-tuwiri", jenis: "toren_bocor", nilai: 24, ts: lalu(0, 1, 10), selesai: null,
    pesan: "Isi toren turun 24 L dalam satu jam tanpa aliran keluar dan pompa mati." },
  { id: "c2", node_id: "tuban-kabluan", jenis: "offline", nilai: 95, ts: lalu(3, 14, 0), selesai: lalu(3, 16, 20),
    ditangani_oleh: "Pak Sutrisno", catatan: "listrik rumah pompa padam, sudah hidup lagi" },
  { id: "c3", node_id: "tuban-bader", jenis: "luber", nilai: 1960, ts: lalu(6, 9, 30), selesai: lalu(6, 13, 0),
    ditangani_oleh: "Bu Siti", catatan: "pelampung diganti" },
];

let pengguna = null;
const pemantauLogin = new Set(), pemantauPeringatan = new Set();
const tunggu = (x) => new Promise((ok) => setTimeout(() => ok(x), 150));

export async function mulai() {
  try { if (sessionStorage.getItem("contoh-masuk")) pengguna = { uid: "contoh" }; } catch {}
}
export function pantauLogin(cb) { pemantauLogin.add(cb); cb(pengguna); return () => pemantauLogin.delete(cb); }
function ubahLogin(u) {
  pengguna = u;
  try { u ? sessionStorage.setItem("contoh-masuk", "1") : sessionStorage.removeItem("contoh-masuk"); } catch {}
  pemantauLogin.forEach((cb) => cb(u));
}
let pinContoh = "1234";
export async function masuk(pin) { await tunggu(); if (pin !== pinContoh) throw new Error("PIN salah. Coba lagi. (PIN contoh: 1234)"); ubahLogin({ uid: "contoh" }); }
export async function keluar() { ubahLogin(null); }
export async function gantiPin(lama, baru) { await tunggu(); if (lama !== pinContoh) throw new Error("PIN lama salah."); pinContoh = baru; }

export function pantauNode(cb) { cb(nodes); return () => {}; }
export function pantauPeringatan(sejakMs, cb) {
  const kirim = () => cb(peringatan.filter((p) => p.selesai == null || p.selesai >= sejakMs));
  pemantauPeringatan.add(kirim); kirim();
  return () => pemantauPeringatan.delete(kirim);
}
export async function ambilBacaan(nodeId, sejakMs) { return tunggu((bacaan.get(nodeId) ?? []).filter((b) => b.ts >= sejakMs)); }
export async function ambilHarian(nodeId, dari, sampai) { return tunggu((harian.get(nodeId) ?? []).filter((h) => h.tanggal >= dari && h.tanggal <= sampai)); }
export async function tandaiDitangani(id, oleh, catatan) {
  peringatan = peringatan.map((p) => (p.id === id ? { ...p, selesai: Date.now(), ditangani_oleh: oleh, catatan } : p));
  pemantauPeringatan.forEach((f) => f());
}
