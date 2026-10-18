// Hitungan dan teks yang dipakai lebih dari satu layar.
import { CONFIG } from "./config.js";

const ZONA = "Asia/Jakarta";
const WIB_MS = 7 * 3600e3;

// ---------- angka dan waktu ----------
const fAngka = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
export const angka = (n) => (n == null || Number.isNaN(n) ? "-" : fAngka.format(Math.round(n)));
export const liter = (n) => `${angka(n)} L`;

const fJam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: ZONA });
const fHariTgl = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA });
const fTglPendek = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "short", timeZone: ZONA });
const fTglBulan = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: ZONA });
const fHariPendek = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: ZONA });

export const jam = (ms) => fJam.format(ms);
export const hariTanggal = (ms) => fHariTgl.format(ms);
export const tanggalPendek = (ms) => fTglPendek.format(ms);
export const tanggalBulan = (ms) => fTglBulan.format(ms);
export const hariPendek = (ms) => fHariPendek.format(ms).replace(".", "");

export const tanggalWIB = (ms) => new Date(ms + WIB_MS).toISOString().slice(0, 10);
export const jamWIB = (ms) => new Date(ms + WIB_MS).getUTCHours();
export const geserTanggal = (tgl, hari) => new Date(Date.parse(tgl) + hari * 86400e3).toISOString().slice(0, 10);
export const tengahHariMs = (tgl) => Date.parse(tgl) + 5 * 3600e3;   // 12.00 WIB, aman untuk format tanggal
export const awalMinggu = (tgl) => geserTanggal(tgl, -((new Date(tgl).getUTCDay() + 6) % 7)); // Senin
export const awalBulan = (tgl) => tgl.slice(0, 8) + "01";
export const awalHariMs = (tgl) => Date.parse(tgl) - WIB_MS;

export function lamaWaktu(menit) {
  if (menit < 60) return `${Math.max(1, Math.round(menit))} menit`;
  if (menit < 48 * 60) return `${Math.round(menit / 60)} jam`;
  return `${Math.round(menit / 1440)} hari`;
}

// "Tadi malam, 01.10 WIB" / "Hari ini, 09.20 WIB" / "Kamis, 15 Okt"
export function waktuKejadian(ms, sekarang = Date.now()) {
  const tgl = tanggalWIB(ms), hariIni = tanggalWIB(sekarang);
  const j = jamWIB(ms);
  if (tgl === hariIni) return `${j < 5 ? "Tadi malam" : "Hari ini"}, ${jam(ms)} WIB`;
  if (tgl === geserTanggal(hariIni, -1)) return `${j >= 18 ? "Tadi malam" : "Kemarin"}, ${jam(ms)} WIB`;
  return tanggalPendek(ms);
}

// ---------- air ----------
// Air yang hilang = masuk - keluar - perubahan isi toren. Positif = hilang, negatif = tercatat lebih.
export function airHilang(h) {
  if (!h || h.toren_awal_l == null || h.toren_akhir_l == null) return null;
  return h.masuk_l - h.keluar_l - (h.toren_akhir_l - h.toren_awal_l);
}

// Sama dengan aturan alarm neraca_harian di backend: wajar bila di bawah 100 L atau di bawah 4 %
export function hilangWajar(hilang, masuk, hari = 1) {
  if (hilang == null) return true;
  const persen = masuk > 0 ? Math.abs(hilang) / masuk * 100 : 0;
  return Math.abs(hilang) <= CONFIG.ambang.neracaMinL * hari || persen <= CONFIG.ambang.neracaPersen;
}

export const persenIsi = (node) => {
  const isi = node?.terakhir?.toren_l;
  if (isi == null || isi < 0) return null;
  return Math.max(0, Math.min(100, Math.round(isi / (node.toren_l || 2000) * 100)));
};

export const menitSejakData = (node, sekarang = Date.now()) =>
  node?.terakhir?.ts ? (sekarang - node.terakhir.ts) / 60e3 : null;

// ---------- peringatan ----------
const telegram = "Kalau tidak ketemu, foto dan kirim ke grup Telegram.";

export const JENIS = {
  toren_bocor: {
    judul: "toren turun saat pompa mati",
    ringkas: "toren turun saat pompa mati, kemungkinan bocor",
    teks: (p) => `Isi toren berkurang ${angka(p.nilai)} liter dalam satu jam padahal tidak ada pemakaian dan pompa tidak menyala. Batas wajar ${CONFIG.ambang.bocorMalamL} liter. Kemungkinan ada kebocoran atau kran yang terbuka.`,
    langkah: ["Cek kran dan sambungan pipa di bawah toren, lihat ada tetesan atau tidak.", "Lihat pelampung di dalam toren, pastikan tidak tersangkut.", telegram],
  },
  aliran_malam: {
    judul: "ada air keluar tengah malam",
    ringkas: "ada air keluar tengah malam, mungkin pipa ke warga bocor",
    teks: (p) => `Tengah malam masih ada air keluar ke warga sekitar ${angka(p.nilai)} liter per menit, padahal biasanya tidak ada yang memakai. Kemungkinan pipa ke rumah warga bocor atau ada kran yang lupa ditutup.`,
    langkah: ["Tanya warga apakah ada yang menampung air tengah malam.", "Susuri jalur pipa ke rumah warga, cari tanah yang basah atau genangan.", telegram],
  },
  neraca_harian: {
    judul: "air yang hilang kemarin melebihi batas",
    ringkas: "air yang hilang kemarin melebihi batas",
    teks: (p) => p.nilai >= 0
      ? `Kemarin ada ${angka(p.nilai)} liter air yang hilang: air yang masuk dari pompa tidak cocok dengan air yang keluar ke warga ditambah perubahan isi toren. Batas wajar ${CONFIG.ambang.neracaMinL} liter.`
      : `Kemarin air yang keluar tercatat ${angka(-p.nilai)} liter lebih banyak dari yang masuk. Kemungkinan meteran masuk atau alat ukur isi toren perlu dicek.`,
    langkah: ["Lihat toren dan pipa di sekitarnya, ada yang bocor atau air tumpah dari atas toren.", "Baca angka di kaca kedua meteran, cocokkan dengan angka di aplikasi.", telegram],
  },
  luber: {
    judul: "toren penuh tapi pompa masih mengisi",
    ringkas: "toren penuh tapi pompa masih mengisi, mungkin luber",
    teks: (p) => `Toren sudah penuh (${angka(p.nilai)} liter) tetapi pompa masih mengisi. Air bisa tumpah dari atas toren dan terbuang.`,
    langkah: ["Lihat apakah air tumpah dari atas toren.", "Cek pelampung atau saklar otomatis pompa, mungkin macet.", "Kalau air tumpah, matikan pompa dulu lalu kabari grup Telegram."],
  },
  pompa_tanpa_hasil: {
    judul: "pompa mengisi tapi toren tidak naik",
    ringkas: "pompa mengisi tapi toren tidak naik",
    teks: (p) => `Meteran masuk mencatat air dari pompa, tetapi isi toren hanya naik ${angka(p.nilai)} liter. Air mungkin bocor di pipa antara pompa dan toren, atau tumpah dari toren.`,
    langkah: ["Cek pipa dari pompa ke toren, cari yang bocor atau sambungan lepas.", "Lihat apakah air tumpah dari atas toren.", telegram],
  },
  aliran_nol: {
    judul: "tidak ada air keluar ke warga",
    ringkas: "tidak ada air keluar ke warga, toren kosong atau pipa tersumbat",
    teks: () => `Tidak ada air keluar ke warga selama ${CONFIG.ambang.nolJam} jam di siang hari. Kemungkinan toren kosong, kran utama tertutup, atau pipa tersumbat.`,
    langkah: ["Lihat isi toren, kosong atau tidak.", "Pastikan kran utama ke warga terbuka.", "Bersihkan saringan sebelum meteran keluar.", telegram],
  },
  sensor_level: {
    judul: "alat ukur isi toren tidak terbaca",
    ringkas: "alat ukur isi toren tidak terbaca",
    teks: () => "Alat pengukur isi toren tidak mengirim angka, jadi isi toren tidak bisa dipantau. Biasanya kabelnya lepas atau putus.",
    langkah: ["Lihat kabel dari toren ke kotak alat, ada yang lepas atau tergigit tikus.", "Jangan membuka kotak alat kalau ragu.", "Telepon tim UNTAG Surabaya."],
  },
  aki_rendah: {
    judul: "aki cadangan lemah",
    ringkas: "aki cadangan lemah",
    teks: (p) => `Aki cadangan di kotak alat tinggal ${String(p.nilai ?? "-").replace(".", ",")} volt. Kalau listrik padam, alat bisa mati dan berhenti mengirim data.`,
    langkah: ["Cek steker adaptor di stop kontak rumah pompa, pastikan menancap dan listrik menyala.", "Kalau listrik normal tapi peringatan tetap muncul, aki perlu diganti. Telepon tim UNTAG."],
  },
  offline: {
    judul: "alat tidak mengirim data",
    ringkas: "alat tidak mengirim data",
    teks: (p, node) => {
      const m = menitSejakData(node);
      return `Alat belum mengirim data selama ${m != null ? lamaWaktu(m) : "beberapa waktu"}. Biasanya karena listrik rumah pompa padam atau sinyal sedang hilang.`;
    },
    langkah: ["Cek listrik di rumah pompa.", "Lihat lampu di kotak alat. Hijau berkedip berarti alat sudah mengirim lagi.", "Kalau listrik ada tapi lampu mati, telepon tim UNTAG."],
  },
  lonjakan_harian: {
    judul: "pemakaian kemarin jauh lebih banyak dari biasa",
    ringkas: "pemakaian kemarin jauh lebih banyak dari biasa",
    teks: (p) => `Kemarin air yang keluar ke warga ${angka((p.nilai ?? 0) * 1000)} liter, jauh di atas rata-rata seminggu terakhir.`,
    langkah: ["Tanya warga apakah kemarin ada hajatan atau acara.", "Kalau tidak ada, susuri pipa ke warga, cari yang bocor.", "Pantau angka hari ini di layar Laporan."],
  },
};

export const infoJenis = (jenis) => JENIS[jenis] ?? {
  judul: String(jenis).replaceAll("_", " "), ringkas: String(jenis).replaceAll("_", " "),
  teks: (p) => p.pesan ?? "", langkah: [telegram],
};

// ---------- status toren di Beranda ----------
export function statusNode(node, aktif) {
  const pertama = aktif.find((p) => p.node_id === node.id);
  const isi = node.terakhir?.toren_l;
  if (pertama) return { bahaya: true, teks: infoJenis(pertama.jenis).ringkas };
  if (!node.terakhir) return { bahaya: false, kosong: true, teks: "belum ada data" };
  const isiTeks = isi != null && isi >= 0 ? `isi ${liter(isi)}` : "isi tidak terbaca";
  if (node.terakhir.pompa) return { bahaya: false, teks: `${isiTeks} · pompa sedang mengisi` };
  return { bahaya: false, teks: `${isiTeks} · aman` };
}
