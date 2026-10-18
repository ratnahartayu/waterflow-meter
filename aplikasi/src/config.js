// Pengaturan yang mungkin perlu diubah per desa. Ambang harus sama dengan backend/.env.

export const CONFIG = {
  emailOperator: import.meta.env.VITE_EMAIL_OPERATOR || "operator@toren-tuban.id",
  awalanPassword: "toren-",            // password akun = awalan + PIN (Firebase minta minimal 6 karakter)

  ambang: {
    neracaPersen: 4,                   // AMBANG_NERACA_PERSEN
    neracaMinL: 100,                   // AMBANG_NERACA_MIN_L
    bocorMalamL: 20,                   // AMBANG_BOCOR_MALAM_L
    nolJam: 3,                         // AMBANG_NOL_JAM
    offlineMenit: 45,                  // AMBANG_OFFLINE_MENIT
  },

  // Layar Bantuan dan Laporan
  telegramGrup: "",                    // tautan undangan grup operator, misalnya https://t.me/+xxxx
  teleponUntag: "",                    // nomor tim UNTAG, misalnya +6281234567890
  waKepalaDesa: "",                    // nomor WhatsApp kepala desa tanpa +, misalnya 6281234567890; kosong = pilih kontak sendiri
  penerimaTelegram: "diatur tim UNTAG",
  versi: "1.0",
};
