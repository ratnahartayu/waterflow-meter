// Template HTML kecil: semua isian di-escape kecuali yang dibungkus aman().

class Aman { constructor(s) { this.s = s; } toString() { return this.s; } }
export const aman = (s) => new Aman(s);

const GANTI = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function isi(x) {
  if (x == null || x === false) return "";
  if (x instanceof Aman) return x.s;
  if (Array.isArray(x)) return x.map(isi).join("");
  return String(x).replace(/[&<>"']/g, (c) => GANTI[c]);
}

export function html(bagian, ...nilai) {
  let s = "";
  bagian.forEach((b, i) => { s += b + (i < nilai.length ? isi(nilai[i]) : ""); });
  return aman(s);
}
