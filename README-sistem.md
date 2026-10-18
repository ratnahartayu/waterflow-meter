# Sistem Monitoring Toren Desa Berbasis IoT (5 lokasi, Kabupaten Tuban)

Satu node per toren. Tiap node mengukur tiga hal: air masuk dari pompa (meter masuk), air keluar ke warga (meter keluar), dan isi toren (sensor level). Dari ketiganya server menghitung neraca air harian: masuk − keluar − perubahan isi toren = selisih. Selisih yang menetap berarti toren bocor, luber, atau meteran bermasalah.

```
monitoring-tandon/
├── firmware/esp32_flowmeter/     # Arduino sketch ESP32 (satu sketch, config.h per lokasi)
├── backend/                      # Node.js: MQTT -> Firestore -> alarm -> Telegram
├── aplikasi/                     # aplikasi operator desa, di-deploy ke Firebase Hosting
├── firestore.rules               # siapa boleh membaca dan menulis apa
└── grafana/dashboard.json        # dashboard lama untuk PostgreSQL, belum bisa dipakai dengan Firestore
```

## 1. Lokasi dan ukuran meter

| Node | Desa, kecamatan | Pipa masuk | Meter masuk | Pipa keluar | Meter keluar |
|---|---|---|---|---|---|
| tuban-mander | Mander, Tambakboyo | ¾" | DN20 | 1½" | DN40 |
| tuban-bader | Bader, Jatirogo | 1" | DN25 | 1½" | DN40 |
| tuban-tuwiri | Tuwiri Kulon, Merakurak | 1" | DN25 | ½" | DN15 |
| tuban-kabluan | Kabluan, Bangilan | ¾" | DN20 | 1½" | DN40 |
| tuban-ngulahan | Ngulahan, Tambakboyo | 1" | DN25 | 1½" | DN40 |

Semua toren plastik Hidro 2.000 L di atas rumah pompa; pompa dan node memakai listrik PLN; kartu IM3.

## 2. Pengkabelan node

| Dari | Ke ESP32 | Catatan |
|---|---|---|
| Reed meter keluar | GPIO 27 dan GND | pull-up internal; 10 kΩ eksternal bila kabel > 5 m |
| Reed meter masuk | GPIO 26 dan GND | idem |
| Sensor level 4–20 mA (2 kabel) | 12 V → sensor → shunt 150 Ω → GND; titik shunt ke GPIO 35 | 4 mA = 0,6 V, 20 mA = 3,0 V |
| SIM7600 TX / RX | GPIO 16 / 17 | level 3,3 V, tidak perlu pembagi |
| SIM7600 VCC | 5 V dari step-down, kapasitor 1000 µF | arus puncak 2 A |
| SIM7600 PWRKEY | GPIO 4 | lewat transistor NPN |
| microSD CS | GPIO 5 | MOSI 23, MISO 19, SCK 18 |
| RTC DS3231 | SDA 21, SCL 22 | |
| Aki 12 V (pembagi 100k/27k) | GPIO 34 | maks 3,3 V |

Catu daya: adaptor 12 V 2 A dari PLN rumah pompa → modul charger/UPS 12 V → aki VRLA 7 Ah → dua step-down (5 V ESP32 dan SIM7600, 12 V langsung ke loop sensor level). Saat PLN padam node tetap hidup lebih dari sehari.

Sensor level: tekanan hidrostatik 0–2 mH₂O (0–0,2 bar), ulir G¼ atau G½, dipasang lewat tee pada nipel bawah toren di hulu katup utama. Jangan dipasang di pipa keluar yang mengalir, pembacaannya turun saat ada aliran.

## 3. Firmware

1. Arduino IDE → Board **ESP32 Dev Module**. Library: TinyGSM (≥ 0.12), PubSubClient, RTClib, ArduinoJson.
2. Salin `config.h` per lokasi: `ID_NODE`, liter per pulsa kedua meter, konstanta toren, APN IM3 (`indosatgprs`), broker.
3. Kalibrasi level saat pemasangan: kosongkan toren sampai nipel, catat `level_cm` yang terbaca (seharusnya 0; selisihnya masuk `LEVEL_OFFSET_CM`). Isi penuh, catat tinggi air (`TOREN_TINGGI_CM`). Ukur diameter dalam toren untuk `TOREN_LITER_PER_CM` (= π r² / 1000, r dalam cm).
4. Setel RTC sekali: tambahkan sementara `rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));` di `setup()`, upload, hapus, upload lagi.
5. Uji di meja: hubungkan GPIO 26 dan 27 ke GND bergantian, pastikan `vol_in_l` dan `vol_l` bertambah; beri 12 mA pada shunt (misal resistor 1 kΩ dari 12 V) dan pastikan `level_cm` sekitar 100.

Payload tiap 15 menit ke `flowmeter/<id>/data`:

```json
{"id":"tuban-mander","ts":1760598000,"vol_l":230,"kum_l":48210,"q_lpm":15.33,
 "vol_in_l":600,"kum_in_l":51300,"q_in_lpm":40.0,"level_cm":118.4,"toren_l":1693,"pompa":1,
 "v_aki":12.64,"rssi":21}
```

## 4. Broker, database, backend, dashboard

Broker: HiveMQ Cloud gratis, port 8883 (SIM7600 mendukung TLS). Dua kredensial: `node_tandon` (publish) dan `backend` (subscribe).

Database: Firestore. Backend menyimpan tiap paket di `node/<id>/bacaan` dan langsung memperbarui rekap harian WIB di `node/<id>/harian/<tanggal>`: air masuk, air keluar, isi toren awal dan akhir hari, jam pompa, dan hasil uji malam (01.00–04.00). Neraca harian dihitung dari rekap ini, jadi tidak perlu view seperti di PostgreSQL. Paket ganda dari buffer microSD diabaikan karena id dokumen bacaan = `ts`. Kelima node dan akun operator dibuat dengan `npm run siapkan -- --pin 1234` di folder backend.

Backend: `cd backend && cp .env.example .env && npm install && npm start`. Alarm yang dijalankan:

| Alarm | Kondisi |
|---|---|
| aliran_malam | aliran ke warga 01.00–04.00 di atas 2 L/menit (pipa distribusi bocor) |
| toren_bocor | pompa mati, tidak ada aliran keluar, isi toren turun > 20 L per jam |
| neraca_harian | selisih neraca kemarin > 4 % dari air masuk dan > 100 L |
| luber | toren ≥ 97 % tetapi pompa masih mengisi (pelampung rusak) |
| pompa_tanpa_hasil | meter masuk mencatat air tetapi toren tidak naik sepadan |
| aliran_nol | tidak ada aliran ke warga > 3 jam di siang hari |
| sensor_level | arus loop di bawah 4 mA (kabel sensor putus) |
| aki_rendah, offline, lonjakan_harian | seperti sebelumnya |

Tiap alarm hanya dikirim sekali sampai normal kembali. Ringkasan 06.30 WIB per toren memuat air keluar, air masuk, jam pompa, selisih neraca, dan hasil uji malam.

Tiap peringatan juga disimpan di koleksi `peringatan` dengan status. Operator bisa menandainya "sudah ditangani" dari aplikasi, lengkap dengan nama dan catatan. Kalau kondisinya masih terjadi, backend akan menaikkan peringatan baru.

Ringkasan kemarin bisa dikirim ulang kapan saja dengan `node src/index.js --ringkasan`.

Dashboard: aplikasi operator di `aplikasi/` menggantikan dashboard Grafana. `grafana/dashboard.json` masih ditulis untuk data source PostgreSQL, jadi tidak tersambung ke Firestore.

## 5. Uji coba lapangan (dua minggu pertama)

- Bandingkan `kum_l` dan `kum_in_l` dengan dial kedua meteran tiap kunjungan.
- Catat beberapa siklus pengisian: `vol_in_l` dalam satu siklus harus sama dengan kenaikan `toren_l` dalam 3–4 %. Bila selisihnya konsisten, perbaiki `TOREN_LITER_PER_CM`.
- Amati uji malam beberapa hari untuk menetapkan `AMBANG_BOCOR_MALAM_L` sesuai riak pembacaan sensor.
