# Pemantauan Meter Air Cerdas di Kabupaten Tuban

Sistem monitoring lima toren air desa (Mander, Bader, Tuwiri Kulon, Kabluan, Ngulahan) berbasis IoT. Tiap toren diukur di tiga titik: air masuk dari pompa, air keluar ke warga, dan isi toren. Server menghitung neraca air harian, mengirim peringatan ke Telegram, dan operator desa memantau semuanya lewat aplikasi web di HP.

Program pengabdian masyarakat Teknik Elektro UNTAG Surabaya.

```
firmware/esp32_flowmeter/   sketch ESP32 (dua reed switch, sensor level 4-20 mA, SIM7600, IM3)
backend/                    Node.js: MQTT -> Firestore -> 10 alarm -> Telegram, rekap 06.30 WIB
aplikasi/                   aplikasi operator desa (Vite, Firebase Auth + Firestore), deploy ke Firebase Hosting
firebase.json               pengaturan Hosting, Firestore, emulator
firestore.rules             aturan akses: hanya akun operator yang bisa membaca
grafana/dashboard.json      dashboard lama untuk PostgreSQL (belum tersambung ke Firestore)
aplikasi-mockup/            rancangan awal aplikasi operator (6 layar HTML), acuan tampilan
dokumen/                    proposal (docx, pdf), slide (pptx), RAB dengan cadangan risiko (xlsx)
dokumen/sumber/             skrip pembangkit dokumen (build.js, deck.js, gambar*.py, rab_risiko.py)
dokumen/gambar/             gambar arsitektur, blok, neraca, flowchart, jadwal, potongan meteran
README-sistem.md            rincian teknis: pengkabelan, ukuran meter per lokasi, cara pasang
```

## Mulai cepat

### 1. Proyek Firebase (sekali saja)

1. Proyek Firebase: `waterflow-meter`. Paket gratis (Spark) sudah cukup.
2. Build > Authentication > Get started > aktifkan **Email/Password**. Di Settings > User actions, matikan "Enable create (sign-up)" supaya orang lain tidak bisa mendaftar sendiri.
3. Build > Firestore Database > Create database, lokasi `asia-southeast2` (Jakarta).
4. Setelan proyek > Akun layanan > Buat kunci pribadi baru. Simpan sebagai `backend/kunci-firebase.json` (sudah masuk .gitignore, jangan dibagikan).
5. Di folder proyek ini:

```
firebase login                # proyek waterflow-meter sudah tercatat di .firebaserc
```

### 2. Backend

```
cd backend
cp .env.example .env          # isi broker MQTT, token bot Telegram, path kunci Firebase
npm install
npm run siapkan -- --pin 1234 # isi lima node dan buat akun operator dengan PIN awal
npm start
```

### 3. Aplikasi operator

Isi tautan grup Telegram, nomor telepon tim UNTAG, dan nomor WhatsApp kepala desa di `aplikasi/src/config.js`, lalu deploy aturan Firestore dan aplikasinya (build otomatis sebelum deploy):

```
cd aplikasi && npm install && cd ..
firebase deploy --only firestore,hosting
```

Alamat aplikasi muncul di akhir, misalnya `https://<id-proyek>.web.app`. Buka di HP operator, masuk dengan PIN, lalu "Tambahkan ke layar utama" supaya terasa seperti aplikasi biasa.

Mencoba tanpa Firebase dan tanpa alat: `cd aplikasi && npm run dev`, lalu buka `http://localhost:5173/?contoh` dengan PIN 1234. Isinya data simulasi 35 hari.

Mencoba dengan emulator (perlu Java 11+): jalankan `firebase emulators:start --project demo-toren` di satu terminal. Di terminal lain jalankan backend dengan `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=demo-toren`, dan aplikasi dengan `VITE_EMULATOR=1 npm run dev`.

### 4. Firmware

Buka `firmware/esp32_flowmeter/esp32_flowmeter.ino` di Arduino IDE, sesuaikan `config.h` (NODE_ID per lokasi, APN `indosatgprs`, kredensial MQTT), pasang pustaka TinyGSM, PubSubClient, ArduinoJson, RTClib.

## Langkah berikutnya yang wajar dikerjakan di Claude Code

1. ~~Mengubah mockup menjadi aplikasi web sungguhan~~ selesai: `aplikasi/` di Firebase Hosting, termasuk status "sudah ditangani" pada peringatan (semula langkah 2).
2. Dashboard teknis pengganti Grafana untuk tim UNTAG (sinyal, tegangan aki, paket per hari), atau ekspor Firestore ke BigQuery bila tetap ingin memakai Grafana.
3. Endpoint kirim laporan harian ke WhatsApp (lewat API WhatsApp Business atau tautan wa.me).
4. Uji firmware dengan simulator pulsa sebelum dipasang di lapangan.
