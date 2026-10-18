// Jalankan sekali setelah proyek Firebase dibuat:
//   node src/siapkan-firebase.js --pin 1234
// Mengisi lima node dan membuat akun operator yang dipakai aplikasi (masuk dengan PIN 4 angka).
// Boleh dijalankan ulang untuk mengganti PIN; data bacaan tidak disentuh.

import "dotenv/config";
import { db, auth } from "./firestore.js";

const NODE = [
  { id: "tuban-mander",   nama: "Toren Mander",       desa: "Mander",       kecamatan: "Tambakboyo", dn_masuk: 20, dn_keluar: 40 },
  { id: "tuban-bader",    nama: "Toren Bader",        desa: "Bader",        kecamatan: "Jatirogo",   dn_masuk: 25, dn_keluar: 40 },
  { id: "tuban-tuwiri",   nama: "Toren Tuwiri Kulon", desa: "Tuwiri Kulon", kecamatan: "Merakurak",  dn_masuk: 25, dn_keluar: 15 },
  { id: "tuban-kabluan",  nama: "Toren Kabluan",      desa: "Kabluan",      kecamatan: "Bangilan",   dn_masuk: 20, dn_keluar: 40 },
  { id: "tuban-ngulahan", nama: "Toren Ngulahan",     desa: "Ngulahan",     kecamatan: "Tambakboyo", dn_masuk: 25, dn_keluar: 40 },
];

const i = process.argv.indexOf("--pin");
const pin = i > 0 ? process.argv[i + 1] : null;
if (pin != null && !/^\d{4}$/.test(pin)) { console.error("PIN harus 4 angka"); process.exit(1); }

for (const [urutan, n] of NODE.entries()) {
  const { id, ...isi } = n;
  // merge supaya "terakhir" dan isian lain yang sudah ada tidak terhapus
  await db.doc(`node/${id}`).set({ ...isi, kabupaten: "Tuban", toren_l: 2000, lpp_masuk: 10, lpp_keluar: 10, urutan }, { merge: true });
  console.log(`node ${id} siap`);
}

if (pin) {
  const email = process.env.EMAIL_OPERATOR ?? "operator@toren-tuban.id";
  const password = `toren-${pin}`;                           // Firebase meminta minimal 6 karakter
  let user;
  try { user = await auth.getUserByEmail(email); await auth.updateUser(user.uid, { password }); }
  catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
    user = await auth.createUser({ email, password, displayName: "Operator desa" });
  }
  await auth.setCustomUserClaims(user.uid, { operator: true }); // aturan Firestore hanya mengizinkan akun ini
  console.log(`akun operator ${email} siap, PIN ${pin}`);
} else {
  console.log("PIN tidak diisi, akun operator tidak diubah. Tambahkan --pin 1234 untuk membuatnya.");
}
process.exit(0);
