import { aman } from "./html.js";

const svg = (isi, { ukuran = 24, tebal = 2.2, warna = "currentColor" } = {}) =>
  aman(`<svg aria-hidden="true" width="${ukuran}" height="${ukuran}" viewBox="0 0 24 24" fill="none" stroke="${warna}" stroke-width="${tebal}" stroke-linecap="round" stroke-linejoin="round">${isi}</svg>`);

export const ikon = {
  tetes: (o) => svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9 14a3 3 0 0 0 3 3"/>', o),
  beranda: (o) => svg('<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>', o),
  lonceng: (o) => svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>', o),
  laporan: (o) => svg('<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>', o),
  bantuan: (o) => svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5"/><path d="M12 17h.01"/>', o),
  awas: (o) => svg('<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', o),
  kembali: (o) => svg('<path d="M15 5l-7 7 7 7"/>', { tebal: 2.4, ...o }),
  lanjut: (o) => svg('<path d="M9 5l7 7-7 7"/>', { ukuran: 20, warna: "#4A6482", ...o }),
  wa: (o) => svg('<path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/>', { ukuran: 22, ...o }),
  kirim: (o) => svg('<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>', o),
  telepon: (o) => svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>', o),
};
