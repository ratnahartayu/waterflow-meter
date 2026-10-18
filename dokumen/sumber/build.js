const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ImageRun, BorderStyle, ShadingType, LevelFormat, PageBreak, Footer, PageNumber, TabStopType
} = require("docx");

const FONT = "Calibri";
const INK = "2C2C2A";
const HEAD = "0F6E56";

const p = (text, opts = {}) => new Paragraph({
  spacing: { after: opts.after ?? 160, line: 300 },
  alignment: opts.align ?? AlignmentType.JUSTIFIED,
  children: [new TextRun({ text, font: FONT, size: 22, color: INK, bold: opts.bold, italics: opts.italics })],
});
const num2 = (t) => num(t, "nums2");
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text, font: FONT, size: 30, bold: true, color: HEAD })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: INK })] });
const num = (text, ref = "nums") => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 100, line: 300 }, children: [new TextRun({ text, font: FONT, size: 22, color: INK })] });
const caption = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 240 }, children: [new TextRun({ text, font: FONT, size: 20, italics: true, color: "5F5E5A" })] });

const img = (file, widthIn) => {
  const data = fs.readFileSync(file);
  const { PNG } = require("pngjs");
  const png = PNG.sync.read(data);
  const w = Math.round(widthIn * 96);
  const h = Math.round(w * png.height / png.width);
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new ImageRun({ type: "png", data, transformation: { width: w, height: h } })] });
};

const cell = (text, w, opts = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: opts.head ? { type: ShadingType.CLEAR, fill: "E1F5EE", color: "auto" } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: [new Paragraph({ alignment: opts.align ?? AlignmentType.LEFT, spacing: { after: 0, line: 260 }, children: [new TextRun({ text, font: FONT, size: 20, bold: opts.head || opts.bold, color: INK })] })],
});
const table = (widths, rows, headRow = true) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  rows: rows.map((r, i) => new TableRow({
    tableHeader: headRow && i === 0,
    children: r.map((c, j) => {
      const o = typeof c === "object" ? c : { text: c };
      return cell(o.text, widths[j], { head: headRow && i === 0, bold: o.bold, align: o.align });
    }),
  })),
});

const R = (v) => ({ text: v, align: AlignmentType.RIGHT });
const B = (v, right) => ({ text: v, bold: true, align: right ? AlignmentType.RIGHT : undefined });

const lokasi = [
  ["Lokasi (desa, kecamatan)", "Pipa masuk (pompa)", "Meter masuk", "Pipa keluar (warga)", "Meter keluar"],
  ["Mander, Tambakboyo", "¾ inci", "DN20", "1½ inci", "DN40"],
  ["Bader, Jatirogo", "1 inci", "DN25", "1½ inci", "DN40"],
  ["Tuwiri Kulon, Merakurak", "1 inci", "DN25", "½ inci", "DN15"],
  ["Kabluan, Bangilan", "¾ inci", "DN20", "1½ inci", "DN40"],
  ["Ngulahan, Tambakboyo", "1 inci", "DN25", "1½ inci", "DN40"],
];

const rabUmum = [
  ["No", "Komponen per lokasi", "Spesifikasi", "Jml", "Harga satuan (Rp)", "Subtotal (Rp)"],
  ["1", "Water meter keluar multi-jet kuningan", "DN40 kelas B + modul pulsa 10 L (DN15 untuk Tuwiri Kulon)", "1", R("1.600.000"), R("1.600.000")],
  ["2", "Water meter masuk multi-jet kuningan", "DN20 atau DN25 kelas B + modul pulsa 10 L", "1", R("1.050.000"), R("1.050.000")],
  ["3", "Strainer Y kuningan", "1,5 inci (½ inci untuk Tuwiri Kulon)", "1", R("200.000"), R("200.000")],
  ["4", "Sensor level tekanan hidrostatik", "0–2 mH₂O, 4–20 mA, G½, dengan tee dan shunt", "1", R("280.000"), R("280.000")],
  ["5", "Fitting, union, tee, seal tape, lem", "Sambungan dua meter dan sensor", "1 set", R("200.000"), R("200.000")],
  ["6", "ESP32 DevKit V1", "30 pin", "1", R("75.000"), R("75.000")],
  ["7", "Modul 4G SIM7600 dan antena", "LTE Cat-1, TLS", "1", R("500.000"), R("500.000")],
  ["8", "Kartu SIM IM3", "Paket data 1 GB per bulan", "1", R("50.000"), R("50.000")],
  ["9", "Modul RTC DS3231 dan microSD 8 GB", "", "1 set", R("85.000"), R("85.000")],
  ["10", "PCB, resistor, kapasitor, terminal", "", "1 set", R("50.000"), R("50.000")],
  ["11", "Adaptor 12 V 2 A, modul charger, aki VRLA 7 Ah, 2 step-down", "Catu daya PLN dengan cadangan", "1 set", R("390.000"), R("390.000")],
  ["12", "Box panel IP65, kabel, klem", "Dipasang di dalam rumah pompa", "1 set", R("220.000"), R("220.000")],
  ["13", "Jasa tukang pipa", "Pemasangan dua meter, tee sensor", "1", R("250.000"), R("250.000")],
  ["", B("Per lokasi (keluaran DN40)"), "", "", "", B("4.950.000", true)],
];

const rabLokasi = [
  ["Lokasi", "Meter keluar", "Meter masuk", "Biaya lokasi (Rp)"],
  ["Mander, Tambakboyo", "DN40", "DN20", R("4.900.000")],
  ["Bader, Jatirogo", "DN40", "DN25", R("4.950.000")],
  ["Tuwiri Kulon, Merakurak", "DN15", "DN25", R("3.850.000")],
  ["Kabluan, Bangilan", "DN40", "DN20", R("4.900.000")],
  ["Ngulahan, Tambakboyo", "DN40", "DN25", R("4.950.000")],
  [B("Lima lokasi"), "", "", B("23.550.000", true)],
  ["Perjalanan tim Surabaya–Tuban (survei, pemasangan, pelatihan; 3 kunjungan ke 5 desa)", "", "", R("4.500.000")],
  [B("Total"), "", "", B("28.050.000", true)],
];

const spek = [
  ["Bagian", "Pilihan", "Alasan"],
  ["Meter keluar", "Water meter multi-jet kuningan DN40 (DN15 di Tuwiri Kulon), kelas B tera ISO 4064, modul pulsa reed 10 L/pulsa", "Membaca aliran kecil malam hari; tahan pasir; tidak butuh daya; angka sah untuk dasar iuran"],
  ["Meter masuk", "Water meter multi-jet kuningan DN20 (pipa ¾ inci) atau DN25 (pipa 1 inci), kelas B, modul pulsa 10 L/pulsa", "Mencatat air yang dipompa dan jam kerja pompa; kelas yang sama dengan meter keluar agar kesalahan seimbang"],
  ["Sensor level", "Tekanan hidrostatik 0–2 mH₂O, keluaran 4–20 mA, dipasang lewat tee di nipel bawah toren", "Resolusi sekitar 5 liter pada toren 2.000 L; tidak terganggu embun atau riak; kabel putus terdeteksi (arus di bawah 4 mA)"],
  ["Pengaman", "Strainer Y di hulu meter keluar, pipa lurus 5D sebelum dan 3D sesudah meter", "Mencegah pasir masuk ke impeler dan aliran turbulen"],
  ["Mikrokontroler", "ESP32 DevKit V1, dua interrupt pulsa dengan debounce 20 ms, ADC untuk level dan aki", "Murah, cukup pin, tidur ringan di antara pengiriman"],
  ["Penyimpanan lokal", "Modul microSD 8 GB dan RTC DS3231", "Data tetap tercatat dengan waktu benar saat sinyal hilang"],
  ["Komunikasi", "Modul 4G SIM7600 dengan kartu IM3, MQTT dengan TLS port 8883, kirim tiap 15 menit", "Jaringan 2G Indosat sudah ditinggalkan; 4G aman beberapa tahun dan mendukung enkripsi; kuota sekitar 1 MB per bulan"],
  ["Catu daya", "Adaptor 12 V dari PLN rumah pompa, modul charger, aki VRLA 7 Ah cadangan, step-down 5 V", "Rumah pompa sudah berlistrik; aki menjaga node tetap hidup lebih dari sehari saat PLN padam"],
  ["Kotak", "Box panel IP65 di dalam rumah pompa", "Kering, terkunci, jauh dari jangkauan anak-anak"],
  ["Server", "HiveMQ Cloud (broker), Supabase (database), Grafana Cloud (dashboard), bot Telegram", "Paket gratis cukup untuk lima node; satu dashboard dengan pilihan toren"],
];

const risiko = [
  ["Risiko", "Penanganan"],
  ["Sinyal 4G lemah di salah satu desa", "Survei sinyal IM3 saat kunjungan pertama; antena eksternal di luar rumah pompa; data tetap tersimpan di microSD"],
  ["Pasir menyumbat meteran", "Strainer Y di hulu, dibersihkan bulanan oleh pengelola"],
  ["Listrik PLN padam lama", "Aki 7 Ah menahan node lebih dari sehari; alarm tegangan rendah; saat pompa pun mati, tidak ada air yang perlu dicatat"],
  ["Sensor level bergeser atau kotor", "Kalibrasi ulang dua titik (kosong dan penuh) saat kunjungan; alarm bila arus loop di bawah 4 mA"],
  ["Pencurian atau vandalisme", "Semua alat di dalam rumah pompa yang terkunci; sosialisasi ke warga"],
  ["Pengelola tidak membuka dashboard", "Ringkasan harian tiap toren dikirim otomatis ke grup Telegram tiap pagi"],
];

const children = [
  new Paragraph({ spacing: { before: 2400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "PROPOSAL", font: FONT, size: 28, bold: true, color: "5F5E5A" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Sistem Monitoring Toren Air Desa Berbasis IoT", font: FONT, size: 40, bold: true, color: HEAD })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [new TextRun({ text: "Pemantauan jarak jauh air masuk, air keluar, dan isi toren di lima desa Kabupaten Tuban", font: FONT, size: 24, italics: true, color: INK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: "Disusun oleh", font: FONT, size: 22, color: "5F5E5A" })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Ir. Ratna Hartayu, M.T.", font: FONT, size: 26, bold: true, color: INK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Program Studi S1 Teknik Elektro", font: FONT, size: 22, color: INK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: "Fakultas Teknologi Elektro dan Informatika Cerdas", font: FONT, size: 22, color: INK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [new TextRun({ text: "Universitas 17 Agustus 1945 Surabaya", font: FONT, size: 22, color: INK })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Oktober 2026", font: FONT, size: 22, color: "5F5E5A" })] }),
  new Paragraph({ children: [new PageBreak()] }),

  h1("1. Ringkasan"),
  p("Proposal ini mengajukan pemasangan sistem monitoring berbasis IoT pada lima toren air bersih di lima desa Kabupaten Tuban (Mander, Bader, Tuwiri Kulon, Kabluan, dan Ngulahan), dengan biaya dasar sekitar Rp4,9 juta per lokasi, total Rp28,9 juta termasuk perjalanan tim dan cadangan komponen, dan anggaran yang diajukan Rp33,2 juta setelah cadangan risiko dan cadangan manajemen dihitung dengan metode manajemen proyek. Tiap toren diberi tiga titik ukur: meter air masuk dari pompa, meter air keluar ke warga, dan sensor isi toren. Dari ketiganya server menghitung neraca air harian, sehingga pengelola tahu bukan hanya berapa air yang dipakai warga, tetapi juga apakah air yang dipompa sampai ke warga atau hilang di toren. Semua dipantau dari ponsel lewat dashboard dan grup Telegram."),

  h1("2. Latar belakang"),
  p("Di lima desa mitra, air bersih bersumber dari sumur bor bantuan Rotary. Pompa listrik PLN di rumah pompa mengisi toren plastik 2.000 liter di atas atapnya, lalu air mengalir secara gravitasi ke rumah warga lewat pipa ½ sampai 1½ inci. Pengelola di tiap desa belum punya catatan berapa air yang dipompa, berapa yang sampai ke warga, dan berapa lama pompa bekerja setiap hari. Pemakaian hanya diketahui dari seberapa sering pompa menyala dan dari keluhan warga saat air tidak sampai ke rumah paling ujung."),
  p("Tanpa data, beberapa masalah sulit dikenali. Kebocoran pipa distribusi baru ketahuan setelah tanah becek. Toren yang rembes atau luber karena pelampung rusak membuang air dan listrik tanpa ada yang tahu. Iuran air dipukul rata tanpa dasar volume. Pengelola juga tidak bisa membedakan pompa yang bekerja normal dengan pompa yang berputar tanpa mengangkat air karena sumur mengering."),
  p("Dengan toren sekecil 2.000 liter dan pemakaian harian 4 sampai 12 m³, pompa mengisi ulang beberapa kali sehari. Setiap siklus pengisian adalah kesempatan untuk mencocokkan air yang dipompa dengan kenaikan isi toren, dan setiap malam adalah kesempatan untuk memastikan toren tidak bocor saat tidak ada yang memakai air. Monitoring jarak jauh membuat pencocokan itu berjalan otomatis di lima desa yang berjauhan tanpa petugas harus datang."),

  h1("3. Tujuan dan manfaat"),
  p("Kegiatan ini bertujuan memasang dan mengoperasikan sistem monitoring toren di lima desa serta melatih pengelola tiap desa membaca dan memanfaatkan datanya. Sasaran yang ingin dicapai:"),
  num("Tersedianya catatan harian air masuk dari pompa, air keluar ke warga, dan isi toren di tiap desa dengan ketelitian 10 liter."),
  num("Neraca air harian tiap toren terhitung otomatis dan selisih di atas 4 persen dilaporkan ke pengelola."),
  num("Peringatan otomatis lewat Telegram saat ada aliran malam mencurigakan, toren bocor, toren luber, pompa bekerja tanpa hasil, atau aliran berhenti di siang hari."),
  num("Sepuluh orang pengelola (dua per desa) terlatih mengoperasikan dashboard dan merawat alat sendiri."),
  p("Manfaat bagi pengelola air desa: dasar yang terukur untuk iuran, deteksi dini kebocoran dan luapan, serta data jam kerja pompa untuk memperkirakan biaya listrik dan umur pompa. Manfaat bagi warga: pasokan lebih stabil karena gangguan cepat diketahui, iuran lebih adil. Manfaat bagi perguruan tinggi: lima lokasi penerapan nyata untuk riset dan tugas akhir mahasiswa di bidang IoT dan sistem kendali, dengan model yang bisa direplikasi ke desa lain."),

  h1("4. Gambaran sistem"),
  p("Pada tiap toren dipasang tiga alat ukur yang terhubung ke satu node ESP32 di dalam rumah pompa. Node mengirim data setiap 15 menit lewat jaringan 4G ke server, dan server menghitung neraca air: air masuk dikurangi air keluar harus sama dengan perubahan isi toren. Selisih yang menetap berarti toren bocor, luber, atau salah satu meteran bermasalah (Gambar 1)."),
  img("neraca_air.png", 5.8),
  caption("Gambar 1. Neraca air toren dengan tiga titik ukur"),
  p("Tiga pengukuran diperlukan karena dengan dua saja persamaannya tidak tertutup. Bila hanya level dan meter keluar, air masuk bisa dihitung dari kenaikan level, tetapi kebocoran toren ikut tersembunyi di dalamnya. Bila hanya meter masuk dan keluar, air yang hilang tidak bisa dibedakan dari air yang memang sedang tersimpan. Gambar 2 memperlihatkan susunan sistem dalam empat lapisan dan Gambar 3 blok diagram perangkat keras di rumah pompa."),
  img("arsitektur.png", 5.8),
  caption("Gambar 2. Arsitektur sistem dalam empat lapisan"),
  img("blok_diagram.png", 5.8),
  caption("Gambar 3. Blok diagram perangkat keras dan hubungan ke server"),
  h2("Alur kerja di sisi perangkat"),
  p("Kedua water meter mengeluarkan satu pulsa setiap 10 liter. ESP32 menghitung pulsa dari masing-masing meter lewat interrupt, membaca sensor level toren lewat loop 4 sampai 20 mA, dan menandai pompa hidup bila ada aliran masuk. Setiap 15 menit node mengirim paket berisi volume keluar, volume masuk, isi toren, status pompa, tegangan aki cadangan, dan kuat sinyal ke broker MQTT. Bila sinyal hilang, paket disimpan di microSD dan dikirim ulang saat sinyal kembali (Gambar 4)."),
  img("flowchart_node.png", 4.4),
  caption("Gambar 4. Flowchart node di rumah pompa"),
  h2("Alur kerja di sisi server"),
  p("Backend menyimpan setiap paket ke database, lalu memeriksa kondisi per paket dan per hari (Gambar 5). Per paket: aliran malam ke warga di atas 2 liter/menit (pipa distribusi bocor), isi toren turun saat pompa mati dan tidak ada aliran keluar (toren bocor), toren penuh tetapi pompa masih mengisi (luber, pelampung rusak), meter masuk mencatat air tetapi toren tidak naik sepadan (pompa tanpa hasil), serta aliran nol lebih dari 3 jam di siang hari. Per hari pukul 06.30 WIB: neraca air dengan toleransi 4 persen dan lonjakan pemakaian di atas 150 persen rata-rata tujuh hari. Setiap kondisi dikirim sekali ke grup Telegram sampai normal kembali, dan ringkasan harian tiap toren memuat air keluar, air masuk, jam pompa, selisih neraca, dan hasil uji malam."),
  img("flowchart_server.png", 4.4),
  caption("Gambar 5. Flowchart pengolahan data di server"),

  h1("5. Lokasi dan ukuran alat"),
  p("Kelima toren berjenis sama, plastik Hidro 2.000 liter di atas rumah pompa, dengan pompa dan listrik dari PLN serta sinyal seluler IM3. Ukuran meter mengikuti pipa di tiap lokasi sesuai hasil survei."),
  table([2900, 1700, 1300, 1800, 1660], lokasi),
  p("", { after: 80 }),
  p("Meter keluar dipilih sesuai pipa, bukan dibesarkan: meter yang terlalu besar tidak membaca aliran kecil di malam hari. Di Tuwiri Kulon pipa keluarnya ½ inci sehingga cukup DN15, yang justru paling peka di aliran rendah."),

  h1("6. Spesifikasi teknis"),
  p("Komponen dipilih untuk kondisi lapangan: rumah pompa berlistrik PLN, air sumur yang membawa pasir, lima lokasi berjauhan, dan perawatan oleh warga sendiri."),
  table([1500, 3900, 3960], spek),
  p("", { after: 80 }),
  p("Format data tiap 15 menit: ID node, waktu (UTC), volume keluar dan kumulatifnya, volume masuk dan kumulatifnya, debit keluar dan masuk, tinggi air dan isi toren, status pompa, tegangan aki, dan kuat sinyal. Ukuran satu paket sekitar 200 byte. Ketelitian neraca mengikuti dua meteran kelas B (±2 persen masing-masing) dan sensor level (±0,5 persen), sehingga selisih harian sampai 4 persen dari air masuk masih dianggap wajar."),

  new Paragraph({ children: [new PageBreak()] }),
  h1("7. Rencana anggaran biaya"),
  p("Biaya satu lokasi lengkap, terpasang dan berjalan, sekitar Rp4,9 juta untuk toren dengan keluaran 1½ inci dan Rp3,85 juta untuk Tuwiri Kulon. Harga mengacu pada marketplace Indonesia per Oktober 2026 dan dapat bergeser 10 sampai 20 persen."),
  table([500, 2900, 2700, 600, 1340, 1320], rabUmum),
  p("", { after: 120 }),
  table([5060, 1400, 1400, 1500], rabLokasi),
  p("", { after: 80 }),
  p("Biaya rutin setelah pemasangan hanya pulsa data lima kartu, sekitar Rp250.000 per bulan, ditanggung dari kas pengelola air tiap desa. Server memakai paket gratis sehingga tidak ada biaya hosting."),
  h2("Perhitungan cadangan dengan konsep manajemen proyek"),
  p("Angka di atas adalah estimasi bottom-up dalam kondisi semua berjalan sesuai rencana. Dalam praktik, barang bisa terlambat datang, tukang pipa atau anggota tim bisa tidak hadir sehingga harus dicari pengganti dengan tarif lebih tinggi, dan harga bisa naik. Mengikuti praktik manajemen proyek (PMBOK), anggaran disusun dalam tiga lapis: biaya dasar, cadangan risiko (contingency reserve) untuk risiko yang sudah teridentifikasi, dan cadangan manajemen (management reserve) untuk hal yang belum teridentifikasi."),
  p("Cadangan risiko dihitung dari daftar risiko dengan metode nilai harapan: setiap risiko diberi peluang terjadi dan dampak biaya bila terjadi, lalu nilai harapan = peluang × dampak. Dampak dihitung dari biaya nyata yang akan timbul, misalnya selisih tarif tukang pengganti ditambah biaya tim menunggu, atau satu kunjungan tambahan bila komponen tertinggal. Jumlah seluruh nilai harapan menjadi cadangan risiko."),
  table([500, 2500, 2800, 1000, 1300, 1260], [
    ["ID", "Risiko", "Cara menghitung dampak", "Peluang", "Dampak (Rp)", "Nilai harapan (Rp)"],
    ["R1", "Komponen terlambat datang (meter, sensor level, modul 4G)", "Satu kunjungan tambahan untuk memasang komponen yang tertinggal", "30 %", R("1.500.000"), R("450.000")],
    ["R2", "Komponen rusak saat datang atau saat uji", "Harga pengganti dan ongkir kilat", "25 %", R("600.000"), R("150.000")],
    ["R3", "Tukang pipa tidak hadir, pengganti lokal lebih mahal", "Selisih tarif pengganti (450.000 − 250.000) + setengah hari tim menunggu (200.000), dua kunjungan", "40 %", R("800.000"), R("320.000")],
    ["R4", "Anggota tim mahasiswa tidak hadir atau mengundurkan diri", "Honor asisten lapangan pengganti satu kunjungan + lembur perakitan", "30 %", R("750.000"), R("225.000")],
    ["R5", "Sinyal IM3 lemah di salah satu rumah pompa", "Antena eksternal dan kabel + kunjungan ulang sebagian", "40 %", R("700.000"), R("280.000")],
    ["R6", "Ukuran pipa di lapangan berbeda dari catatan survei", "Beli ulang satu meter dan modul pulsa", "20 %", R("1.200.000"), R("240.000")],
    ["R7", "Kenaikan harga komponen atau ongkos kirim", "10 % dari 60 % komponen yang belum terbeli", "40 %", R("1.200.000"), R("480.000")],
    ["R8", "Akses lokasi tertunda (izin desa, hujan, jalan rusak)", "Satu kunjungan ulang", "25 %", R("1.500.000"), R("375.000")],
    ["R9", "Kalibrasi level gagal, sensor tidak cocok nipel toren", "Fitting adaptor + setengah hari kerja", "30 %", R("500.000"), R("150.000")],
    ["", B("Cadangan risiko"), "", "", "", B("2.670.000", true)],
  ]),
  p("", { after: 80 }),
  p("Mitigasi yang biayanya sudah dimasukkan ke biaya dasar: satu unit cadangan sensor level, modul 4G, dan ESP32 (Rp855.000) agar komponen rusak atau terlambat tidak menunda pemasangan; kontrak tukang pipa dengan uang muka dan dua kontak per desa; tim empat orang untuk kebutuhan tiga; pembelian komponen utama di minggu pertama setelah dana cair. Dampak jadwal tiap risiko dihitung dengan cara yang sama dan menghasilkan buffer jadwal sekitar dua minggu, sehingga bila terpakai laporan bergeser dari akhir Januari ke pertengahan Februari 2027."),
  table([6400, 2960], [
    ["Komponen anggaran", "Nilai (Rp)"],
    ["Biaya dasar: lima lokasi 23.550.000 + perjalanan 4.500.000 + cadangan komponen 855.000", R("28.905.000")],
    ["Cadangan risiko (contingency reserve), jumlah nilai harapan, 9,2 % biaya dasar", R("2.670.000")],
    [B("Cost baseline = biaya dasar + cadangan risiko"), B("31.575.000", true)],
    ["Cadangan manajemen (management reserve) 5 % cost baseline, untuk risiko yang belum teridentifikasi", R("1.578.750")],
    [B("Anggaran total yang diajukan (dibulatkan ke atas Rp100.000)"), B("33.200.000", true)],
  ]),
  p("", { after: 80 }),
  p("Aturan pemakaiannya: cadangan risiko dipakai ketua tim untuk risiko yang ada di daftar dan dicatat dalam log proyek (tanggal, risiko, nominal); cadangan manajemen hanya dipakai untuk kejadian di luar daftar dengan persetujuan LPPM; sisa cadangan yang tidak terpakai dikembalikan atau dialihkan ke tahap lanjutan dengan persetujuan pemberi dana. Tiap akhir minggu biaya aktual dibandingkan dengan cost baseline untuk melihat apakah cadangan mulai terpakai. Lembar kerja perhitungan (peluang, dampak, nilai harapan) disertakan sebagai file Excel berformula sehingga angkanya bisa disesuaikan saat survei."),

  h1("8. Jadwal pelaksanaan"),
  p("Kegiatan berjalan dua belas minggu dari awal November 2026. Survei kelima lokasi dilakukan dalam satu kunjungan, perakitan lima node dikerjakan di laboratorium kampus, pemasangan dua kunjungan (tiga lokasi lalu dua lokasi), uji coba dua minggu, pelatihan pengelola bersamaan dengan kunjungan terakhir, dan laporan selesai akhir Januari 2027 (Gambar 6)."),
  img("jadwal.png", 6.0),
  caption("Gambar 6. Jadwal pelaksanaan per minggu"),
  p("Uji coba dua minggu dipakai untuk memastikan data lima node terkirim stabil, mencocokkan angka meter dengan dial, mengkalibrasi sensor level pada toren kosong dan penuh, dan menyetel ambang alarm sesuai pola pemakaian tiap desa."),

  h1("9. Keberlanjutan dan peran mitra"),
  p("Alat dirancang agar dirawat warga sendiri. Perawatan rutin hanya tiga hal: membersihkan strainer sebulan sekali, memeriksa tegangan aki cadangan dari dashboard, dan mengisi pulsa data tiap bulan. Semua komponen tersedia di marketplace, dan dokumentasi pemasangan serta kode program diserahkan ke pengelola."),
  p("Peran mitra desa: menunjuk dua pengelola per desa yang mengikuti pelatihan, menyediakan akses ke rumah pompa saat pemasangan, menanggung pulsa data dari kas air, dan menyampaikan keluhan lewat grup Telegram bersama tim pelaksana selama satu tahun pendampingan."),
  p("Peran tim pelaksana: survei, perakitan, pemasangan, pelatihan, dan pendampingan jarak jauh selama satu tahun. Mahasiswa dilibatkan dalam perakitan dan pengujian sebagai bagian dari tugas akhir dan praktik lapangan."),
  p("Tahap lanjutan yang bisa diajukan terpisah: meteran per rumah di desa dengan jumlah pelanggan terbanyak, agar selisih antara meter induk dan jumlah meter rumah menunjukkan kebocoran jaringan distribusi."),
  h2("Risiko dan penanganannya"),
  table([3600, 5760], risiko),
  p("", { after: 80 }),

  h1("10. Penutup"),
  p("Dengan anggaran Rp33,2 juta (termasuk cadangan risiko dan cadangan manajemen) dan waktu dua belas minggu ditambah buffer dua minggu, pengelola air di lima desa memperoleh catatan air masuk, air keluar, dan isi toren yang akurat, peringatan dini kebocoran dan luapan, serta dasar yang adil untuk iuran, tanpa perlu datang ke rumah pompa setiap hari. Kami mengharapkan dukungan untuk melaksanakan kegiatan ini dan terbuka menyesuaikan rancangan dengan kondisi lapangan setelah survei."),
  p("Data yang masih perlu dipastikan saat survei: jumlah rumah tersambung di tiap desa, kuat sinyal IM3 di rumah pompa, dan jenis pelampung atau saklar otomatis pompa yang terpasang."),
  new Paragraph({ spacing: { before: 480, after: 600 }, children: [new TextRun({ text: "Hormat kami,", font: FONT, size: 22, color: INK })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Ir. Ratna Hartayu, M.T.", font: FONT, size: 22, bold: true, color: INK })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Program Studi S1 Teknik Elektro, Fakultas Teknologi Elektro dan Informatika Cerdas", font: FONT, size: 22, color: INK })] }),
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Universitas 17 Agustus 1945 Surabaya", font: FONT, size: 22, color: INK })] }),
  new Paragraph({ children: [new TextRun({ text: "rhartayu@untag-sby.ac.id", font: FONT, size: 22, color: INK })] }),
  new Paragraph({ children: [new PageBreak()] }),
  h1("Lampiran 1. Alat ukur: water meter multi-jet kuningan dengan modul pulsa"),
  p("Lampiran ini menjelaskan alat ukur yang diusulkan dan cara kerjanya, dari air yang masuk sampai pulsa yang dihitung ESP32."),
  img("water_meter_potongan.png", 6.0),
  caption("Gambar L1. Potongan skematik water meter multi-jet dengan modul pulsa reed switch"),
  h2("Spesifikasi yang diusulkan"),
  table([3200, 6160], [
    ["Parameter", "Nilai"],
    ["Tipe", "Multi-jet, register kering, bodi kuningan"],
    ["Ukuran", "DN40 (1,5 inci), ulir G1½ B; DN50 bila pipa 2 inci"],
    ["Kelas ketelitian", "Kelas B (ISO 4064) atau R160; ±5% di aliran rendah, ±2% di rentang kerja"],
    ["Debit nominal (Q3)", "10 m³/jam untuk DN40; aliran minimum terbaca sekitar 80 sampai 100 liter/jam"],
    ["Tekanan kerja", "Maksimum 16 bar"],
    ["Suhu air", "Air dingin, 0,1 sampai 50 °C"],
    ["Modul pulsa", "Reed switch, kontak kering, 1 pulsa per 10 liter (opsi 1 liter)"],
    ["Contoh merek", "Onda, Amico, Barindo, Itron Aquadis+ / Flodis (versi pulse ready)"],
  ]),
  p("", { after: 80 }),
  h2("Cara kerja"),
  p("Air masuk dari pipa ke ruang ukur silinder di dalam bodi kuningan. Dinding ruang ukur memiliki beberapa lubang miring (nozel) yang mengarahkan air secara tangensial ke rotor dari berbagai sisi sekaligus, karena itu disebut multi-jet. Dorongan dari banyak arah membuat rotor tetap berputar pada aliran kecil dan keausan porosnya merata. Jumlah putaran rotor sebanding dengan volume air yang lewat."),
  p("Bagian atas meteran kering. Rotor di bagian basah dan roda gigi register di bagian kering dipisahkan oleh pelat, dan putaran disalurkan lewat sepasang magnet yang saling tarik menembus pelat itu. Air, pasir, dan lumut tidak pernah menyentuh roda gigi dan angka, sehingga kaca penunjuk tidak berembun dan mekanisme tidak macet. Roda gigi menurunkan putaran rotor sampai menggerakkan deretan roda angka pada dial."),
  p("Modul pulsa memanfaatkan roda angka tersebut. Pada roda puluhan liter ditanam sebuah magnet kecil, dan di sebelahnya dipasang reed switch, yaitu dua lidah logam dalam tabung kaca yang menutup saat ada medan magnet. Setiap roda itu berputar satu kali, magnet lewat di depan reed switch dan kontaknya menutup sesaat lalu membuka lagi. Satu kali tutup-buka itulah satu pulsa, dan karena roda tersebut berputar satu kali tiap 10 liter, satu pulsa berarti 10 liter."),
  h2("Penyambungan ke ESP32"),
  p("Keluaran reed switch hanya kontak kering tanpa tegangan. Satu kabel reed disambung ke ground, kabel lainnya ke pin masukan ESP32 yang diberi resistor pull-up 10 kΩ ke 3,3 V. Saat kontak menutup, pin jatuh ke 0 V dan interrupt menghitungnya. Debounce 20 ms diperlukan karena lidah logam bergetar sesaat ketika menutup dan bisa terbaca dua kali. Frekuensi pulsa sangat rendah, paling cepat satu pulsa tiap beberapa detik pada jam puncak, sehingga tidak membebani mikrokontroler."),
  h2("Catatan pengadaan dan pemasangan"),
  num2("Pastikan meteran versi pulse ready atau reed switch sudah terpasang dari pabrik; tidak semua tipe bisa ditambah modul belakangan."),
  num2("Angka liter per pulsa harus tertulis di spesifikasi dan dicocokkan dengan konstanta di program ESP32."),
  num2("Pasang strainer Y di hulu, pipa lurus minimal 5 kali diameter sebelum meteran dan 3 kali sesudahnya, posisi horizontal dengan dial menghadap ke atas."),
  num2("Arah panah pada bodi mengikuti arah aliran dari tandon ke warga; pipa harus selalu terisi penuh agar gelembung udara tidak ikut terhitung."),
];

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  numbering: { config: ["nums", "nums2"].map(r => ({ reference: r, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] })) },
  sections: [{
    properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "5F5E5A" })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync("Proposal Sistem Monitoring Debit Air Tandon Desa Berbasis IoT.docx", buf); console.log("written", buf.length); });
