# Pemantauan Meter Air Cerdas di Kabupaten Tuban

Sistem monitoring lima toren air desa (Mander, Bader, Tuwiri Kulon, Kabluan, Ngulahan) berbasis IoT. Tiap toren diukur di tiga titik: air masuk dari pompa, air keluar ke warga, dan isi toren. Server menghitung neraca air harian dan mengirim peringatan ke Telegram.

Program pengabdian masyarakat Teknik Elektro UNTAG Surabaya.

```
firmware/esp32_flowmeter/   sketch ESP32 (dua reed switch, sensor level 4-20 mA, SIM7600, IM3)
backend/                    Node.js: MQTT -> Supabase -> 10 alarm -> Telegram, rekap 06.30 WIB
supabase/schema.sql         tabel, view rekap_jam/rekap_hari/neraca_hari/uji_malam, 5 node
grafana/dashboard.json      dashboard teknis per node
aplikasi-mockup/            rancangan aplikasi operator desa (6 layar HTML, biru-putih)
dokumen/                    proposal (docx, pdf), slide (pptx), RAB dengan cadangan risiko (xlsx)
dokumen/sumber/             skrip pembangkit dokumen (build.js, deck.js, gambar*.py, rab_risiko.py)
dokumen/gambar/             gambar arsitektur, blok, neraca, flowchart, jadwal, potongan meteran
README-sistem.md            rincian teknis: pengkabelan, ukuran meter per lokasi, cara pasang
```

## Mulai cepat

Backend:

```
cd backend
cp .env.example .env      # isi URL Supabase, kunci service, token bot Telegram, broker MQTT
npm install
npm start
```

Database: jalankan `supabase/schema.sql` di SQL editor Supabase.

Firmware: buka `firmware/esp32_flowmeter/esp32_flowmeter.ino` di Arduino IDE, sesuaikan `config.h` (NODE_ID per lokasi, APN `indosatgprs`, kredensial MQTT), pasang pustaka TinyGSM, PubSubClient, ArduinoJson, RTClib.

Mockup aplikasi: buka `aplikasi-mockup/Masuk.dc.html` di browser; semua layar saling terhubung lewat tautan.

## Langkah berikutnya yang wajar dikerjakan di Claude Code

1. Mengubah mockup menjadi aplikasi web sungguhan (misalnya Next.js atau SvelteKit) yang membaca view `neraca_hari` dan `rekap_jam` dari Supabase.
2. Menambah tabel `peringatan` dengan status "sudah ditangani" dan nama penangani, dipakai layar Peringatan.
3. Endpoint kirim laporan harian ke WhatsApp (lewat API WhatsApp Business atau tautan wa.me).
4. Uji firmware dengan simulator pulsa sebelum dipasang di lapangan.
