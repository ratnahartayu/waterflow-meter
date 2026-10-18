import "./gaya.css";
import { muatData } from "./data/index.js";
import { html } from "./html.js";
import { awalMinggu, tanggalWIB, awalHariMs } from "./logika.js";
import * as masuk from "./layar/masuk.js";
import * as beranda from "./layar/beranda.js";
import * as toren from "./layar/toren.js";
import * as peringatan from "./layar/peringatan.js";
import * as laporan from "./layar/laporan.js";
import * as bantuan from "./layar/bantuan.js";

const RUTE = { "": beranda, toren, peringatan, laporan, bantuan };
const root = document.getElementById("app");

// Keadaan bersama: diisi langganan Firestore, dibaca semua layar
const k = { data: null, pengguna: undefined, nodes: null, peringatan: null };
let lepas = [];

function urai() {
  const [nama = "", ...arg] = location.hash.replace(/^#\/?/, "").split("/");
  return { nama: decodeURIComponent(nama), arg: arg.map(decodeURIComponent) };
}

function layarSekarang() {
  if (k.pengguna === undefined) return null;
  if (!k.pengguna) return masuk;
  return RUTE[urai().nama] ?? beranda;
}

let jadwal = 0, layarLalu = null;
export function gambarUlang() {
  cancelAnimationFrame(jadwal);
  jadwal = requestAnimationFrame(gambar);
}

function gambar() {
  const layar = layarSekarang();
  if (!layar) { root.innerHTML = String(html`<div class="memuat">Memuat…</div>`); return; }

  // simpan posisi kursor supaya isian formulir tidak hilang saat layar digambar ulang
  const aktif = document.activeElement;
  const fokus = aktif && root.contains(aktif) && aktif.id ? { id: aktif.id, a: aktif.selectionStart, b: aktif.selectionEnd } : null;
  const gulir = layar === layarLalu ? root.querySelector(".isi")?.scrollTop : 0;

  const konteks = { ...k, arg: urai().arg, gambarUlang };
  root.innerHTML = String(html`${k.data?.contoh ? html`<div class="pita-contoh">Data contoh, bukan data alat sungguhan</div>` : ""}${layar.tampil(konteks)}`);

  const isi = root.querySelector(".isi");
  if (isi && gulir) isi.scrollTop = gulir;
  if (fokus) {
    const el = document.getElementById(fokus.id);
    if (el) { el.focus(); try { el.setSelectionRange(fokus.a, fokus.b); } catch {} }
  }
  if (layar !== layarLalu) {
    layar.masuk?.(konteks);
    if (layar !== masuk) root.querySelector("h1")?.focus({ preventScroll: true });
  }
  layarLalu = layar;
}

// Tombol dan isian memakai data-aksi="nama"; fungsinya ada di layar yang sedang tampil
function jalankan(jenis, ev) {
  const el = ev.target.closest(`[data-${jenis}]`);
  const layar = layarSekarang();
  if (!el || !layar?.aksi) return;
  const f = layar.aksi[el.dataset[jenis]];
  if (f) { if (jenis === "aksi") ev.preventDefault(); f(el, ev, { ...k, arg: urai().arg, gambarUlang }); }
}
root.addEventListener("click", (ev) => jalankan("aksi", ev));
root.addEventListener("input", (ev) => jalankan("ubah", ev));
root.addEventListener("submit", (ev) => { ev.preventDefault(); jalankan("kirim", ev); });
document.addEventListener("keydown", (ev) => layarSekarang()?.tombol?.(ev, { ...k, gambarUlang }));
window.addEventListener("hashchange", () => { window.scrollTo(0, 0); gambarUlang(); });

function langganan() {
  lepas.forEach((f) => f()); lepas = [];
  if (!k.pengguna) { k.nodes = null; k.peringatan = null; return; }
  lepas.push(k.data.pantauNode((n) => { k.nodes = n; gambarUlang(); }));
  // peringatan selesai sejak Senin minggu ini, untuk bagian "Sudah selesai"
  const senin = awalHariMs(awalMinggu(tanggalWIB(Date.now())));
  lepas.push(k.data.pantauPeringatan(senin, (p) => { k.peringatan = p; gambarUlang(); }));
}

async function mulai() {
  gambar();
  try {
    k.data = await muatData();
    await k.data.mulai();
  } catch (e) {
    console.error(e);
    root.innerHTML = String(html`<div class="memuat galat">Aplikasi belum bisa dibuka.<br>${e.message}</div>`);
    return;
  }
  k.data.pantauLogin((u) => {
    const berubah = (u?.uid ?? null) !== (k.pengguna?.uid ?? null) || k.pengguna === undefined;
    k.pengguna = u;
    if (berubah) langganan();
    gambarUlang();
  });
  // jam di kepala layar dan "data terakhir" diperbarui tiap menit
  setInterval(gambarUlang, 60e3);
}

mulai();
