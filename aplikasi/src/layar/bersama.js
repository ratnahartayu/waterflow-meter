import { html } from "../html.js";
import { ikon } from "../ikon.js";

export const kepala = (judul, sub, { atas, kembali } = {}) => html`
  <header class="kepala${kembali ? " kepala-baris" : ""}">
    ${kembali ? html`<a class="tombol-kembali" href="${kembali}" aria-label="Kembali">${ikon.kembali()}</a>` : ""}
    <div class="kepala-teks">
      ${atas ? html`<div class="kepala-atas">${atas}</div>` : ""}
      <h1 tabindex="-1">${judul}</h1>
      ${sub ? html`<div class="kepala-sub">${sub}</div>` : ""}
    </div>
  </header>`;

const MENU = [
  ["", "Beranda", ikon.beranda],
  ["peringatan", "Peringatan", ikon.lonceng],
  ["laporan", "Laporan", ikon.laporan],
  ["bantuan", "Bantuan", ikon.bantuan],
];

export const navBawah = (aktif, jumlahPeringatan = 0) => html`
  <nav class="nav-bawah" aria-label="Menu utama">
    ${MENU.map(([rute, label, ik]) => html`
      <a href="#/${rute}" ${rute === aktif ? html`aria-current="page"` : ""}>
        <span class="nav-ikon">${ik()}${rute === "peringatan" && jumlahPeringatan ? html`<span class="lencana" aria-label="${jumlahPeringatan} perlu ditangani">${jumlahPeringatan}</span>` : ""}</span>
        ${label}
      </a>`)}
  </nav>`;

export const halaman = (isiKepala, isi, nav) => html`
  <div class="layar">${isiKepala}<main class="isi">${isi}</main>${nav}</div>`;

export const memuat = (teks = "Memuat data…") => html`<div class="kartu redup">${teks}</div>`;

export const aktifSaja = (peringatan) => (peringatan ?? []).filter((p) => p.selesai == null).sort((a, b) => b.ts - a.ts);
export const namaPendek = (node) => node?.desa ?? node?.nama?.replace(/^Toren /, "") ?? "";
