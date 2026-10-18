// Sambungan ke Firestore dan bentuk data yang dipakai backend serta aplikasi operator.
//
// node/{id}                  info toren + "terakhir" (bacaan paling baru, untuk layar Beranda)
// node/{id}/bacaan/{ts}      satu paket 15 menit, id dokumen = detik Unix (paket ganda otomatis diabaikan)
// node/{id}/harian/{tgl}     rekap harian WIB (YYYY-MM-DD), diperbarui tiap paket masuk:
//                            air masuk, air keluar, isi toren awal dan akhir hari, jam pompa, uji malam
// peringatan/{auto}          alarm dengan status: selesai = null selama masih aktif

import { readFileSync } from "node:fs";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const kunci = process.env.FIREBASE_KREDENSIAL;
initializeApp({ credential: kunci ? cert(JSON.parse(readFileSync(kunci, "utf8"))) : applicationDefault() });

export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = getAuth();
export { FieldValue, Timestamp };

// Indonesia tidak memakai jam musim panas, jadi WIB cukup UTC + 7 jam
const WIB_MS = 7 * 3600e3;
export const tanggalWIB = (ms) => new Date(ms + WIB_MS).toISOString().slice(0, 10);
export const jamWIB = (ms) => new Date(ms + WIB_MS).getUTCHours();
export const geserTanggal = (tgl, hari) => new Date(Date.parse(tgl) + hari * 86400e3).toISOString().slice(0, 10);

// Selisih neraca: masuk - keluar - perubahan isi toren. Positif = air hilang.
export function neraca(h) {
  if (!h || h.toren_awal_l == null || h.toren_akhir_l == null) return null;
  const berubah = h.toren_akhir_l - h.toren_awal_l;
  const selisih = h.masuk_l - h.keluar_l - berubah;
  return { masuk_l: h.masuk_l, keluar_l: h.keluar_l, berubah_l: berubah, selisih_l: selisih, selisih_persen: h.masuk_l > 0 ? (selisih / h.masuk_l) * 100 : null };
}

// Simpan satu paket. Mengembalikan false bila paket ini sudah pernah disimpan.
export async function simpanPaket(p) {
  const ms = p.ts * 1000;
  const nodeRef = db.doc(`node/${p.id}`);
  const bacaanRef = nodeRef.collection("bacaan").doc(String(p.ts));
  const tgl = tanggalWIB(ms), jam = jamWIB(ms);
  const harianRef = nodeRef.collection("harian").doc(tgl);

  const bacaan = {
    ts: Timestamp.fromMillis(ms), diterima: FieldValue.serverTimestamp(),
    vol_l: Number(p.vol_l ?? 0), kum_l: p.kum_l, q_lpm: Number(p.q_lpm ?? 0),
    vol_in_l: Number(p.vol_in_l ?? 0), kum_in_l: p.kum_in_l, q_in_lpm: Number(p.q_in_lpm ?? 0),
    level_cm: p.level_cm, toren_l: p.toren_l, pompa: !!p.pompa, v_aki: p.v_aki, rssi: p.rssi,
  };

  return db.runTransaction(async (tx) => {
    const [ada, hr, nd] = await Promise.all([tx.get(bacaanRef), tx.get(harianRef), tx.get(nodeRef)]);
    if (ada.exists) return false;

    const h = hr.exists ? hr.data() : { tanggal: tgl, masuk_l: 0, keluar_l: 0, paket: 0, paket_pompa: 0, q_lpm_puncak: 0 };
    h.masuk_l += bacaan.vol_in_l;
    h.keluar_l += bacaan.vol_l;
    h.paket += 1;
    if (bacaan.pompa) h.paket_pompa += 1;
    h.jam_pompa = h.paket_pompa * 0.25;                      // paket 15 menit
    h.q_lpm_puncak = Math.max(h.q_lpm_puncak ?? 0, bacaan.q_lpm);
    if (p.v_aki != null) h.v_aki_min = Math.min(h.v_aki_min ?? Infinity, p.v_aki);

    // isi toren awal dan akhir hari, hanya dari bacaan sensor yang sah
    if (p.toren_l != null && p.toren_l >= 0) {
      if (h.ts_awal == null || p.ts < h.ts_awal) { h.ts_awal = p.ts; h.toren_awal_l = p.toren_l; }
      if (h.ts_akhir == null || p.ts > h.ts_akhir) { h.ts_akhir = p.ts; h.toren_akhir_l = p.toren_l; }
    }

    // uji malam 01.00 sampai 04.00 WIB: pompa mati dan tidak ada aliran keluar, isi toren seharusnya datar
    if (jam >= 1 && jam <= 3) {
      if (p.toren_l != null && p.toren_l >= 0) {
        h.malam_min_l = Math.min(h.malam_min_l ?? Infinity, p.toren_l);
        h.malam_max_l = Math.max(h.malam_max_l ?? -Infinity, p.toren_l);
        h.malam_turun_l = h.malam_max_l - h.malam_min_l;
      }
      h.malam_keluar_l = (h.malam_keluar_l ?? 0) + bacaan.vol_l;
      h.malam_pompa = !!(h.malam_pompa || bacaan.pompa);
      h.malam_q_jumlah = (h.malam_q_jumlah ?? 0) + bacaan.q_lpm;
      h.malam_n = (h.malam_n ?? 0) + 1;
      h.malam_q_lpm = h.malam_q_jumlah / h.malam_n;
    }

    tx.set(bacaanRef, bacaan);
    tx.set(harianRef, h);
    const lama = nd.exists ? nd.data().terakhir?.ts?.toMillis?.() ?? 0 : 0;
    if (ms > lama) {
      tx.set(nodeRef, {
        terakhir: { ts: bacaan.ts, toren_l: p.toren_l ?? null, level_cm: p.level_cm ?? null, pompa: bacaan.pompa, q_lpm: bacaan.q_lpm, q_in_lpm: bacaan.q_in_lpm, v_aki: p.v_aki ?? null, rssi: p.rssi ?? null },
      }, { merge: true });
    }
    return true;
  });
}

// Bacaan satu node sejak waktu tertentu, terbaru dulu
export async function bacaanSejak(nodeId, sejakMs, { sebelumMs, batas } = {}) {
  let q = db.collection(`node/${nodeId}/bacaan`).where("ts", ">=", Timestamp.fromMillis(sejakMs));
  if (sebelumMs != null) q = q.where("ts", "<", Timestamp.fromMillis(sebelumMs));
  q = q.orderBy("ts", "desc");
  if (batas) q = q.limit(batas);
  const s = await q.get();
  return s.docs.map((d) => d.data());
}
