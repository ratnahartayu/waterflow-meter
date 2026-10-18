# Catatan untuk Claude Code

Proyek: sistem pemantauan lima toren air desa di Kabupaten Tuban (PkM Teknik Elektro UNTAG Surabaya, Ir. Ratna Hartayu, M.T.). Baca README.md dulu, lalu README-sistem.md untuk detail perangkat keras.

## Bahasa dan gaya
- Semua teks yang dibaca manusia (UI, komentar, dokumen, pesan Telegram) dalam bahasa Indonesia sehari-hari. Hindari istilah teknis di layar operator: pakai "air masuk", "air keluar", "air yang hilang", "isi toren", bukan "inflow", "neraca", "ADC".
- Tulis dengan gaya manusiawi, tanpa kosakata khas AI, tanpa format berlebihan.

## Keputusan teknis yang sudah final
- Meter air multi-jet kuningan ISO 4064 kelas B dengan modul pulsa reed switch 10 L/pulsa. Ukuran per lokasi ada di README-sistem.md.
- Sensor level hidrostatik 0–2 mH2O, 4–20 mA, shunt 150 Ω ke GPIO 35. Toren Hidro 2.000 L ≈ 14,3 L per cm.
- ESP32 + SIM7600 (4G, IM3, APN indosatgprs), MQTT TLS 8883, kirim tiap 15 menit, buffer microSD, RTC DS3231, listrik PLN dengan aki cadangan.
- Backend Node.js → Firebase (Firestore + Auth), aplikasi operator di Firebase Hosting. Supabase tidak dipakai lagi sejak 18 Oktober 2026. Alarm: aliran_malam, toren_bocor, neraca_harian, luber, pompa_tanpa_hasil, aliran_nol, sensor_level, aki_rendah, offline, lonjakan_harian. Ambang di backend/.env.example (NERACA_PERSEN=4, NERACA_MIN_L=100, BOCOR_MALAM_L=20, LUBER_PERSEN=97).
- Lima node: tuban-mander, tuban-bader, tuban-tuwiri, tuban-kabluan, tuban-ngulahan.

## Aplikasi operator (aplikasi/, rancangan awal di aplikasi-mockup/)
- Warna: biru #1565C0, biru muda #E3F0FB, latar #F4F8FC, teks #0F2A44, teks redup #4A6482, garis #D6E4F2, hijau #2E7D32, merah #C62828. Font Plus Jakarta Sans.
- Prinsip: satu layar satu tugas, tulisan besar, warna selalu ditemani kata, tombol minimal 44 px, tiap peringatan menyebut tindakan.
- Enam layar: Masuk (PIN 4 angka), Beranda (lima toren), Toren (detail), Peringatan, Laporan, Bantuan.
- Aplikasi sungguhan ada di aplikasi/ (Vite tanpa framework), teks layar mengikuti mockup. Data dari Firestore: node/{id} (+ terakhir), node/{id}/bacaan, node/{id}/harian/{YYYY-MM-DD}, peringatan. Bentuk datanya dijelaskan di backend/src/firestore.js.
- Masuk dengan PIN: satu akun operator (email di config), password = "toren-" + PIN, klaim operator=true dibuat oleh backend/src/siapkan-firebase.js. Aturan akses di firestore.rules.
- Ambang di aplikasi/src/config.js harus sama dengan backend/.env.
- Data contoh untuk mencoba tanpa Firebase: buka dengan ?contoh, PIN 1234.

## Jangan diubah tanpa diminta
- Angka RAB di dokumen/ (total anggaran Rp33.200.000 termasuk cadangan risiko dan cadangan manajemen).
- Skrip di dokumen/sumber/ adalah pembangkit dokumen; menjalankannya ulang menimpa docx/pptx/xlsx.
