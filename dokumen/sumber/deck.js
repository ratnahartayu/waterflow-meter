const pptxgen = require("pptxgenjs");
const { applyTheme } = require("/mnt/skills/public/pptx/scripts/apply_theme.js");
const fs = require("fs");

const THEME = {
  name: "Tandon Desa",
  headFontFace: "Calibri", bodyFontFace: "Calibri",
  colors: { dk1: "14211E", lt1: "FFFFFF", dk2: "0B3B33", lt2: "EEF2EF", accent1: "1D9E75", accent2: "D85A30", accent3: "9FE1CB", accent4: "4A5568", accent5: "0F6E56", accent6: "BFD8D5", hlink: "0F6E56", folHlink: "4A5568" },
};
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Sistem Monitoring Toren Air Desa Berbasis IoT";
pres.author = "Ir. Ratna Hartayu, M.T.";
const C = pres.SchemeColor;
const DARK = "0B3B33", LIGHT = "EEF2EF", WHITE = "FFFFFF", MINT = "9FE1CB", INK = "14211E", BODY = "4A5568", CORAL = "D85A30", GREEN = "1D9E75", LINE = "D9D6CC";

pres.defineSlideMaster({ title: "DARK", background: { color: DARK }, objects: [] });
pres.defineSlideMaster({
  title: "LIGHT", background: { color: WHITE },
  objects: [
    { placeholder: { options: { name: "eyebrow", type: "body", x: 0.6, y: 0.4, w: 8, h: 0.35, fontSize: 12, bold: true, color: CORAL, charSpacing: 2, margin: 0 } } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.75, w: 12.1, h: 1.2, fontSize: 28, bold: true, color: INK, align: "left", valign: "top", margin: 0 } } },
    { text: { text: "Proposal PkM, Teknik Elektro UNTAG Surabaya", options: { x: 0.6, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: BODY, margin: 0 } } },
  ],
  slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: BODY },
});
pres.defineSlideMaster({ title: "TINT", background: { color: LIGHT }, objects: [
    { placeholder: { options: { name: "eyebrow", type: "body", x: 0.6, y: 0.4, w: 8, h: 0.35, fontSize: 12, bold: true, color: CORAL, charSpacing: 2, margin: 0 } } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.75, w: 12.1, h: 1.2, fontSize: 28, bold: true, color: INK, align: "left", valign: "top", margin: 0 } } },
  ],
  slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: BODY },
});

const img = (f) => "image/png;base64," + fs.readFileSync(f).toString("base64");
const png = (f) => { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const fitImg = (slide, file, x, y, maxW, maxH) => {
  const { w, h } = png(file); const s = Math.min(maxW / w, maxH / h);
  const W = w * s, H = h * s;
  slide.addShape(pres.ShapeType.roundRect, { x: x + (maxW - W) / 2 - 0.1, y: y + (maxH - H) / 2 - 0.1, w: W + 0.2, h: H + 0.2, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, rectRadius: 0.1 });
  slide.addImage({ data: img(file), x: x + (maxW - W) / 2, y: y + (maxH - H) / 2, w: W, h: H });
};
const card = (slide, x, y, w, h, title, body, opts = {}) => {
  slide.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: opts.fill ?? WHITE }, line: { color: opts.line ?? LINE, width: 0.75 }, rectRadius: 0.12 });
  let ty = y + 0.2;
  if (opts.big) { slide.addText(opts.big, { x: x + 0.25, y: ty, w: w - 0.5, h: 0.8, fontSize: 40, bold: true, color: MINT, margin: 0, isTextBox: true }); ty += 0.85; }
  if (title) { slide.addText(title, { x: x + 0.25, y: ty, w: w - 0.5, h: 0.4, fontSize: 16, bold: true, color: opts.titleColor ?? INK, margin: 0, isTextBox: true }); ty += 0.45; }
  slide.addText(body, { x: x + 0.25, y: ty, w: w - 0.5, h: h - (ty - y) - 0.2, fontSize: opts.fs ?? 13, color: opts.bodyColor ?? BODY, margin: 0, valign: "top", isTextBox: true, paraSpaceAfter: 4 });
};
const hdr = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: DARK } } });
const paras = (slide, x, y, w, h, items, fs = 14) =>
  slide.addText(items.map((t, i) => ({ text: t, options: { breakLine: i < items.length - 1, paraSpaceAfter: 10 } })), { x, y, w, h, fontSize: fs, color: BODY, margin: 0, valign: "top", isTextBox: true });
const light = (eyebrow, title, master = "LIGHT", section) => {
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  s.addText(eyebrow.toUpperCase(), { placeholder: "eyebrow" });
  s.addText(title, { placeholder: "title" });
  return s;
};

// ---------- 1 cover ----------
pres.addSection({ title: "Pembuka" });
let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Pembuka" });
s.addShape(pres.ShapeType.rect, { x: 0.8, y: 0.8, w: 0.7, h: 0.06, fill: { color: "F5C4B3" }, line: { color: "F5C4B3" } });
s.addText("PROPOSAL PENGABDIAN KEPADA MASYARAKAT", { x: 0.8, y: 1.1, w: 11, h: 0.4, fontSize: 13, bold: true, color: MINT, charSpacing: 3, margin: 0, isTextBox: true });
s.addText("Sistem Monitoring Toren Air Desa Berbasis IoT", { x: 0.8, y: 1.7, w: 11.5, h: 2.0, fontSize: 44, bold: true, color: WHITE, margin: 0, valign: "top", isTextBox: true });
s.addText("Air masuk, air keluar, dan isi toren di lima desa Kabupaten Tuban, dipantau dari ponsel", { x: 0.8, y: 3.7, w: 10, h: 0.6, fontSize: 18, color: "BFD8D5", margin: 0, isTextBox: true });
s.addText([{ text: "Ir. Ratna Hartayu, M.T.", options: { bold: true, fontSize: 16, color: WHITE, breakLine: true } },
  { text: "Program Studi S1 Teknik Elektro, Fakultas Teknologi Elektro dan Informatika Cerdas, Universitas 17 Agustus 1945 Surabaya", options: { fontSize: 12, color: "BFD8D5", breakLine: true } },
  { text: "Oktober 2026", options: { fontSize: 12, color: MINT } }], { x: 0.8, y: 5.6, w: 11, h: 1.3, margin: 0, valign: "top", isTextBox: true });
s.addNotes("Pembuka: lima toren di lima desa, tiga titik ukur per toren. Total sekitar Rp28 juta, dua belas minggu.");

// ---------- 2 masalah ----------
s = light("Latar belakang", "Di lima desa, pompa mengisi toren 2.000 L lalu air mengalir ke warga, tapi tidak ada yang tahu berapa yang dipompa dan berapa yang sampai");
[["Kebocoran terlambat diketahui", "Pipa distribusi baru ketahuan bocor setelah tanah becek; toren yang rembes atau luber tidak pernah ketahuan."],
 ["Iuran dipukul rata", "Tanpa angka volume, iuran tidak punya dasar dan sering memicu ketidakpuasan warga."],
 ["Lima desa berjauhan", "Pencatatan manual tidak jalan; pengelola juga tidak tahu berapa jam pompa bekerja tiap hari."]]
 .forEach(([t, b], i) => card(s, 0.6 + i * 4.1, 2.4, 3.9, 2.6, t, b, { fs: 14 }));
s.addNotes("Tiga masalah inti pengelola: kebocoran, iuran, dan jarak. Semua berakar pada tidak adanya data debit.");
// ---------- 2b lokasi ----------
s = light("Lokasi", "Lima toren Hidro 2.000 L di atas rumah pompa, lima desa, empat kecamatan di Kabupaten Tuban");
s.addTable([
  [hdr("Desa, kecamatan"), hdr("Pipa masuk"), hdr("Meter masuk"), hdr("Pipa keluar"), hdr("Meter keluar")],
  ["Mander, Tambakboyo", "¾ inci", "DN20", "1½ inci", "DN40"],
  ["Bader, Jatirogo", "1 inci", "DN25", "1½ inci", "DN40"],
  ["Tuwiri Kulon, Merakurak", "1 inci", "DN25", "½ inci", "DN15"],
  ["Kabluan, Bangilan", "¾ inci", "DN20", "1½ inci", "DN40"],
  ["Ngulahan, Tambakboyo", "1 inci", "DN25", "1½ inci", "DN40"],
], { x: 0.6, y: 2.3, w: 12.1, colW: [4.1, 2.0, 2.0, 2.0, 2.0], fontSize: 14, color: INK, border: { type: "solid", pt: 0.5, color: LINE }, rowH: 0.5, margin: 0.08, valign: "middle" });
paras(s, 0.6, 5.6, 12.1, 1.0, ["Semua lokasi: sumur bor bantuan Rotary, pompa dan listrik PLN di rumah pompa, sinyal seluler IM3. Ukuran meter mengikuti pipa; meter yang kebesaran tidak membaca aliran kecil malam hari."], 13);
s.addNotes("Tunjukkan foto toren bila ada. Tuwiri Kulon pipa keluarnya setengah inci, jadi DN15.");


// ---------- 3 usulan ----------
s = light("Usulan", "Tiga titik ukur per toren yang menutup neraca air harian di tiap desa");
[["Rp4,9 jt", "biaya satu lokasi lengkap; lima lokasi plus perjalanan sekitar Rp28 juta"], ["3 ukur", "meter masuk, meter keluar, sensor level; data tiap 15 menit"], ["12 mgg", "dari survei sampai pelatihan pengelola lima desa"]]
 .forEach(([n, b], i) => card(s, 0.6 + i * 4.1, 2.3, 3.9, 2.3, null, b, { big: n, fill: DARK, line: DARK, bodyColor: WHITE, fs: 14 }));
paras(s, 0.6, 5.0, 12.1, 1.6, ["Dua water meter bermodul pulsa, sensor level tekanan, node ESP32 dengan 4G IM3, listrik PLN rumah pompa dengan aki cadangan. Pengelola melihat air masuk, air keluar, isi toren, jam pompa, dan selisih neraca tanpa datang ke rumah pompa."], 15);
s.addNotes("Tiga angka kunci: biaya, ketelitian, waktu. Semua komponen dari toko lokal dan marketplace.");

// ---------- 4 tujuan ----------
s = light("Tujuan dan manfaat", "Empat sasaran yang diserahkan ke pengelola air desa");
const sasaran = ["Catatan harian air masuk, air keluar, dan isi toren di tiap desa dengan ketelitian 10 liter.", "Neraca air harian tiap toren terhitung otomatis; selisih di atas 4 persen dilaporkan.", "Peringatan Telegram saat ada aliran malam, toren bocor, luber, pompa tanpa hasil, atau aliran berhenti.", "Sepuluh pengelola (dua per desa) terlatih membaca dashboard dan merawat alat."];
sasaran.forEach((t, i) => { const x = 0.6 + (i % 2) * 6.2, y = 2.2 + Math.floor(i / 2) * 1.45;
  s.addShape(pres.ShapeType.roundRect, { x, y, w: 5.9, h: 1.25, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, rectRadius: 0.12 });
  s.addText(String(i + 1), { x: x + 0.2, y: y + 0.15, w: 0.6, h: 0.9, fontSize: 32, bold: true, color: GREEN, margin: 0, isTextBox: true });
  s.addText(t, { x: x + 0.9, y: y + 0.15, w: 4.8, h: 0.95, fontSize: 13, color: INK, margin: 0, valign: "middle", isTextBox: true }); });
[["Pengelola:", " dasar iuran yang terukur, deteksi dini kebocoran dan luapan, data jam pompa untuk biaya listrik."], ["Warga:", " pasokan lebih stabil karena gangguan cepat diketahui, iuran lebih adil."], ["Kampus:", " lima lokasi riset dan tugas akhir mahasiswa, model yang bisa direplikasi."]]
 .forEach(([b, t], i) => s.addText([{ text: b, options: { bold: true } }, { text: t }], { x: 0.6 + i * 4.1, y: 5.3, w: 3.9, h: 1.4, fontSize: 12, color: BODY, margin: 0, valign: "top", isTextBox: true }));
s.addNotes("Empat sasaran terukur, lalu manfaat untuk tiga pihak.");


// ---------- 5 neraca ----------
pres.addSection({ title: "Neraca air dan cara kerja" });
s = light("Neraca air", "Tiga titik ukur menutup persamaan: masuk dikurangi keluar sama dengan perubahan isi toren", "TINT", "Neraca air dan cara kerja");
paras(s, 0.6, 2.2, 5.2, 4.6, ["Dengan dua titik saja persamaannya tidak tertutup. Level dan meter keluar menyembunyikan kebocoran toren; meter masuk dan keluar tidak membedakan air hilang dengan air tersimpan.", "Toren 2.000 L diisi ulang beberapa kali sehari, jadi tiap siklus pengisian adalah satu uji: air yang dipompa harus sama dengan kenaikan isi toren dalam 3 sampai 4 persen.", "Selisih yang menetap berarti toren bocor, luber karena pelampung rusak, atau salah satu meteran perlu dikalibrasi."], 14);
fitImg(s, "neraca_air.png", 6.2, 2.2, 6.5, 4.4);
s.addText("Gambar 1. Neraca air toren", { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: BODY, margin: 0, isTextBox: true });
s.addNotes("Ini inti usulannya. Tekankan kenapa harus tiga pengukuran, bukan dua.");

// ---------- 6 arsitektur ----------
s = light("Cara kerja", "Data mengalir lewat empat lapisan, dari rumah pompa tiap desa sampai ponsel pengelola", "TINT", "Neraca air dan cara kerja");
paras(s, 0.6, 2.1, 5.4, 4.8, ["Perangkat. Dua water meter bermodul pulsa dan sensor level toren masuk ke satu ESP32 di rumah pompa, listrik PLN.", "Jaringan. 4G LTE dengan kartu IM3; jaringan 2G Indosat sudah ditinggalkan, dan 4G mendukung TLS.", "Server. Broker MQTT menerima data, backend menghitung neraca air dan sepuluh alarm, database menyimpan lima node.", "Pengguna. Dashboard per toren, ringkasan harian di ponsel, notifikasi ke grup Telegram lima desa."], 14);
fitImg(s, "arsitektur.png", 6.4, 2.0, 6.3, 5.0);
s.addText("Gambar 2. Arsitektur sistem", { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: BODY, margin: 0, isTextBox: true });
s.addNotes("Bacakan empat lapisan dari atas ke bawah. Tekankan GSM dipilih setelah survei sinyal.");

// ---------- 6 blok ----------
s = light("Blok diagram", "Dua meter, satu sensor level, satu ESP32, listrik dari rumah pompa", "TINT", "Neraca air dan cara kerja");
fitImg(s, "blok_diagram.png", 0.6, 2.0, 6.8, 4.9);
paras(s, 7.8, 2.1, 4.9, 4.8, ["Pulsa reed dari meter masuk dan meter keluar dihitung lewat dua interrupt dengan debounce 20 ms, supaya tidak ada pulsa ganda.", "Sensor level 4 sampai 20 mA dibaca lewat shunt 150 Ω; arus di bawah 4 mA berarti kabel putus dan langsung jadi alarm.", "Adaptor 12 V dari PLN rumah pompa dengan aki 7 Ah cadangan; semua di box IP65 di dalam rumah pompa yang terkunci."], 14);
s.addText("Gambar 3. Blok diagram perangkat keras", { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: BODY, margin: 0, isTextBox: true });
s.addNotes("Sebutkan bahwa modul GSM butuh kapasitor besar karena lonjakan arus saat transmisi.");

// ---------- 7 alur perangkat ----------
s = light("Alur di sisi perangkat", "Hitung pulsa, kirim tiap 15 menit, simpan dulu bila sinyal hilang", "TINT", "Neraca air dan cara kerja");
paras(s, 0.6, 2.1, 6.4, 4.8, ["Setiap paket berisi volume keluar, volume masuk, isi toren, status pompa, tegangan aki, dan kuat sinyal. Ukurannya sekitar 200 byte, kuota sebulan di bawah 1 MB.", "Saat koneksi putus, data tetap tercatat di microSD dengan waktu dari RTC dan dikirim ulang saat sinyal kembali. Grafik di server tidak bolong.", "Pompa dianggap hidup bila meter masuk mencatat aliran, jadi jam kerja pompa ikut tercatat tanpa sensor tambahan."], 14);
fitImg(s, "flowchart_node.png", 7.4, 1.95, 5.3, 5.0);
s.addText("Gambar 4. Flowchart node di rumah pompa", { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: BODY, margin: 0, isTextBox: true });
s.addNotes("Tekankan cabang buffer lokal: itu yang membedakan alat ini dari prototipe lab biasa.");

// ---------- 8 alur server ----------
s = light("Alur di sisi server", "Neraca air harian dan alarm yang menyertainya", "TINT", "Neraca air dan cara kerja");
fitImg(s, "flowchart_server.png", 0.6, 2.0, 5.6, 4.9);
[["Neraca harian", " masuk − keluar − ΔV toren; selisih di atas 4 % berarti bocor, luber, atau meteran bermasalah."], ["Uji malam", " pompa mati dan tidak ada aliran keluar tapi isi toren turun: toren bocor; aliran keluar di atas 2 L/menit: pipa bocor."], ["Luber dan pompa tanpa hasil", " toren penuh tapi pompa mengisi; meter masuk mencatat air tapi toren tidak naik."]]
 .forEach(([b, t], i) => { const y = 2.1 + i * 1.1;
  s.addShape(pres.ShapeType.roundRect, { x: 6.7, y, w: 6.0, h: 0.95, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, rectRadius: 0.1 });
  s.addText([{ text: b, options: { bold: true } }, { text: t }], { x: 6.9, y: y + 0.1, w: 5.6, h: 0.75, fontSize: 13, color: INK, margin: 0, valign: "middle", isTextBox: true }); });
paras(s, 6.7, 5.5, 6.0, 1.4, ["Ditambah aliran nol siang hari, lonjakan harian, aki rendah, sensor putus, dan offline. Ringkasan tiap toren dikirim ke Telegram pukul 06.30."], 13);
s.addText("Gambar 5. Flowchart pengolahan data di server", { x: 0.6, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: BODY, margin: 0, isTextBox: true });
s.addNotes("Aliran malam adalah indikator paling berharga; itu yang membedakan bocor dengan pemakaian wajar.");

// ---------- 9 meteran ----------
pres.addSection({ title: "Alat, anggaran, jadwal" });
s = light("Pemilihan alat ukur", "Water meter utilitas bermodul pulsa untuk dua titik, sensor tekanan untuk level toren", "LIGHT", "Alat, anggaran, jadwal");
s.addTable([
  [hdr("Kelas"), hdr("Contoh"), hdr("Harga"), hdr("Kecocokan untuk tandon desa")],
  ["Sensor turbin plastik", "YF-S201, YF-DN50", "Rp30 ribu sampai 360 ribu", "Tidak membaca aliran kecil malam hari, cepat macet oleh pasir"],
  [{ text: "Water meter utilitas + modul pulsa", options: { bold: true, fill: { color: "E1F5EE" } } }, { text: "Onda, Amico, Itron Aquadis DN40", options: { bold: true, fill: { color: "E1F5EE" } } }, { text: "Rp1,2 sampai 2 juta", options: { bold: true, fill: { color: "E1F5EE" } } }, { text: "Tera ISO 4064, tahan pasir, tanpa daya, angka sah untuk iuran", options: { bold: true, fill: { color: "E1F5EE" } } }],
  ["Elektromagnetik / ultrasonik", "Primapro, Itron Intelis", "Rp6 juta ke atas", "Akurat, tapi butuh 24 V terus-menerus dan harga berlipat"],
], { x: 0.6, y: 2.3, w: 12.1, colW: [2.8, 2.8, 2.2, 4.3], fontSize: 13, color: INK, border: { type: "solid", pt: 0.5, color: LINE }, rowH: 0.6, margin: 0.08, valign: "middle" });
paras(s, 0.6, 5.3, 12.1, 1.3, ["Meter keluar DN40 untuk pipa 1½ inci (DN15 di Tuwiri Kulon), meter masuk DN20 atau DN25 sesuai pipa pompa. Level toren dibaca sensor tekanan hidrostatik 0 sampai 2 m di nipel bawah, resolusi sekitar 5 liter."], 13);
s.addNotes("Alasan utama: aliran gravitasi malam hari sangat kecil, hanya meteran kelas B yang membacanya.");

// ---------- 10 spesifikasi ----------
s = light("Spesifikasi teknis", "Komponen dipilih untuk lima rumah pompa berlistrik PLN, air berpasir, dirawat warga sendiri", "LIGHT", "Alat, anggaran, jadwal");
[["Alat ukur", "Meter keluar DN40/DN15 dan meter masuk DN20/DN25, kelas B, modul pulsa 10 L, strainer Y"], ["Mikrokontroler", "ESP32 DevKit V1, dua interrupt pulsa dengan debounce 20 ms, ADC untuk level dan aki"], ["Sensor level dan buffer", "Sensor tekanan 0–2 mH₂O, 4–20 mA, lewat tee di nipel bawah toren; microSD dan RTC"], ["Komunikasi", "Modul 4G SIM7600 dengan kartu IM3, MQTT TLS port 8883, kirim tiap 15 menit, kuota sekitar 1 MB per bulan"], ["Catu daya", "Adaptor 12 V dari PLN rumah pompa, modul charger, aki VRLA 7 Ah cadangan lebih dari sehari"], ["Server", "HiveMQ Cloud, Supabase, Grafana Cloud, bot Telegram; paket gratis cukup untuk lima node"]]
 .forEach(([t, b], i) => card(s, 0.6 + (i % 3) * 4.1, 2.2 + Math.floor(i / 3) * 1.95, 3.9, 1.8, t, b, { fs: 12, titleColor: "0F6E56" }));
paras(s, 0.6, 6.15, 12.1, 0.8, ["Ketelitian neraca mengikuti dua meter kelas B (±2 %) dan sensor level (±0,5 %), sehingga selisih harian sampai 4 % dari air masuk masih wajar."], 12);
s.addNotes("Enam bagian; kalau ditanya detail, rujuk ke tabel di dokumen proposal.");

// ---------- 11 anggaran ----------
s = light("Rencana anggaran biaya", "Biaya dasar Rp28,9 juta; dengan cadangan risiko dan manajemen, anggaran Rp33,2 juta", "LIGHT", "Alat, anggaran, jadwal");
const R = (t, o = {}) => ({ text: t, options: { align: "right", ...o } });
s.addTable([
  [hdr("Kelompok"), { text: "Rp", options: { bold: true, color: WHITE, fill: { color: DARK }, align: "right" } }],
  ["Meter keluar DN40 + pulsa, strainer, fitting", R("2.000.000")],
  ["Meter masuk DN20/DN25 + pulsa, sensor level", R("1.330.000")],
  ["ESP32, modul 4G, SIM, RTC, microSD, PCB", R("760.000")],
  ["Adaptor PLN, aki, box, kabel, jasa pipa", R("860.000")],
  [{ text: "Per lokasi (keluaran DN40)", options: { bold: true, fill: { color: "E1F5EE" } } }, R("4.950.000", { bold: true, fill: { color: "E1F5EE" } })],
], { x: 0.6, y: 2.3, w: 7.2, colW: [5.4, 1.8], fontSize: 13, color: INK, border: { type: "solid", pt: 0.5, color: LINE }, rowH: 0.55, margin: 0.08, valign: "middle" });
card(s, 8.3, 2.3, 4.4, 1.9, null, "anggaran diajukan: biaya dasar Rp28,9 jt + cadangan risiko Rp2,67 jt (Σ peluang × dampak, 9 risiko) + cadangan manajemen 5 %.", { big: "Rp33,2 jt", fill: DARK, line: DARK, bodyColor: WHITE, fs: 13 });
card(s, 8.3, 4.4, 4.4, 1.9, "Cadangan risiko", "Barang terlambat, tukang pipa tidak hadir (pengganti lebih mahal), sinyal lemah, harga naik, akses tertunda.\nBuffer jadwal dua minggu dari dampak jadwal × peluang.", { fs: 12 });
s.addText("Rincian komponen, daftar risiko, dan lembar Excel berformula ada di dokumen proposal; harga Oktober 2026", { x: 0.6, y: 6.3, w: 12, h: 0.3, fontSize: 10, color: BODY, margin: 0, isTextBox: true });
s.addNotes("Jelaskan tiga lapis anggaran: biaya dasar, cadangan risiko dari nilai harapan, cadangan manajemen 5 %. Pulsa data Rp250 ribu per bulan ditanggung desa.");

// ---------- 12 jadwal ----------
s = light("Jadwal pelaksanaan", "Dua belas minggu dari awal November 2026, dua kunjungan pemasangan, pelatihan pertengahan Januari", "LIGHT", "Alat, anggaran, jadwal");
fitImg(s, "jadwal.png", 0.6, 2.1, 12.1, 4.6);
s.addNotes("Sembilan tahap. Uji coba dipakai untuk kalibrasi level toren kosong dan penuh serta menyetel ambang alarm tiap desa.");

// ---------- 13 keberlanjutan ----------
s = light("Keberlanjutan dan risiko", "Alat dirancang agar dirawat warga sendiri, dengan pendampingan satu tahun", "LIGHT", "Alat, anggaran, jadwal");
s.addShape(pres.ShapeType.roundRect, { x: 0.6, y: 2.2, w: 5.9, h: 4.0, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, rectRadius: 0.12 });
s.addText([{ text: "Perawatan rutin hanya tiga hal", options: { bold: true, color: "0F6E56", fontSize: 15, breakLine: true, paraSpaceAfter: 6 } },
  { text: "Bersihkan strainer sebulan sekali. Cek tegangan aki cadangan dari dashboard. Isi pulsa data tiap bulan.", options: { breakLine: true, paraSpaceAfter: 14 } },
  { text: "Peran mitra desa", options: { bold: true, color: "0F6E56", fontSize: 15, breakLine: true, paraSpaceAfter: 6 } },
  { text: "Dua pengelola per desa ikut pelatihan, akses ke rumah pompa saat pemasangan, pulsa data dari kas air, grup Telegram bersama tim." }],
  { x: 0.85, y: 2.4, w: 5.4, h: 3.6, fontSize: 13, color: BODY, margin: 0, valign: "top", isTextBox: true });
s.addShape(pres.ShapeType.roundRect, { x: 6.8, y: 2.2, w: 5.9, h: 4.0, fill: { color: WHITE }, line: { color: LINE, width: 0.75 }, rectRadius: 0.12 });
const risiko = [["Sinyal 4G lemah:", " survei awal, antena eksternal, buffer microSD."], ["Pasir menyumbat:", " strainer Y di hulu, dibersihkan bulanan."], ["PLN padam lama:", " aki 7 Ah menahan node lebih dari sehari; pompa pun ikut mati."], ["Sensor level bergeser:", " kalibrasi ulang dua titik saat kunjungan; alarm bila loop putus."], ["Dashboard tidak dibuka:", " ringkasan harian otomatis ke Telegram."]];
s.addText([{ text: "Risiko dan penanganannya", options: { bold: true, color: CORAL, fontSize: 15, breakLine: true, paraSpaceAfter: 6 } },
  ...risiko.flatMap(([b, t], i) => [{ text: b, options: { bold: true } }, { text: t, options: { breakLine: i < risiko.length - 1, paraSpaceAfter: 6 } }])],
  { x: 7.05, y: 2.4, w: 5.4, h: 3.6, fontSize: 13, color: BODY, margin: 0, valign: "top", isTextBox: true });
paras(s, 0.6, 6.35, 12.1, 0.6, ["Tahap lanjutan yang bisa diajukan terpisah: meteran per rumah di desa dengan pelanggan terbanyak, untuk menghitung kebocoran jaringan distribusi."], 12);
s.addNotes("Sebutkan bahwa semua komponen bisa dibeli di toko lokal; tidak ada ketergantungan pada vendor.");

// ---------- 14 penutup ----------
pres.addSection({ title: "Penutup" });
s = pres.addSlide({ masterName: "DARK", sectionTitle: "Penutup" });
s.addText("PENUTUP", { x: 0.8, y: 0.8, w: 6, h: 0.4, fontSize: 13, bold: true, color: MINT, charSpacing: 3, margin: 0, isTextBox: true });
s.addText("Dengan Rp33,2 juta termasuk cadangan risiko, dan dua belas minggu, lima desa mendapat catatan air masuk, keluar, dan isi toren, peringatan dini kebocoran dan luapan, serta dasar iuran yang adil", { x: 0.8, y: 1.4, w: 11.5, h: 2.4, fontSize: 32, bold: true, color: WHITE, margin: 0, valign: "top", isTextBox: true });
s.addText("Rancangan akan disesuaikan setelah survei. Tiga hal yang perlu dipastikan di lokasi: jumlah rumah tersambung tiap desa, kuat sinyal IM3 di rumah pompa, dan jenis pelampung pompa.", { x: 0.8, y: 4.0, w: 10.5, h: 1.0, fontSize: 15, color: "BFD8D5", margin: 0, valign: "top", isTextBox: true });
s.addText([{ text: "Ir. Ratna Hartayu, M.T.", options: { bold: true, fontSize: 16, color: WHITE, breakLine: true } },
  { text: "S1 Teknik Elektro, FTEIC, Universitas 17 Agustus 1945 Surabaya", options: { fontSize: 12, color: "BFD8D5", breakLine: true } },
  { text: "rhartayu@untag-sby.ac.id", options: { fontSize: 12, color: MINT } }], { x: 0.8, y: 5.7, w: 11, h: 1.2, margin: 0, valign: "top", isTextBox: true });
s.addNotes("Tutup dengan tiga data survei yang dibutuhkan, lalu buka sesi tanya jawab.");

(async () => {
  const out = "Sistem Monitoring Toren Air Desa Berbasis IoT.pptx";
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("written", out);
})();
