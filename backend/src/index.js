// Backend monitoring toren desa (5 node, Kabupaten Tuban)
// MQTT subscriber -> Firestore -> cek ambang -> Telegram -> ringkasan harian dan neraca air

import "dotenv/config";
import mqtt from "mqtt";
import cron from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { db, FieldValue, simpanPaket, bacaanSejak, neraca, tanggalWIB, jamWIB, geserTanggal } from "./firestore.js";

const env = (k, d) => process.env[k] ?? d;
const AMBANG = {
  malamLpm: Number(env("AMBANG_MALAM_LPM", 2)),
  lonjakanPersen: Number(env("AMBANG_LONJAKAN_PERSEN", 150)),
  nolJam: Number(env("AMBANG_NOL_JAM", 3)),
  akiV: Number(env("AMBANG_AKI_V", 11.5)),
  offlineMenit: Number(env("AMBANG_OFFLINE_MENIT", 45)),
  neracaPersen: Number(env("AMBANG_NERACA_PERSEN", 4)),     // selisih neraca harian yang masih wajar
  neracaMinL: Number(env("AMBANG_NERACA_MIN_L", 100)),      // abaikan selisih di bawah ini
  bocorMalamL: Number(env("AMBANG_BOCOR_MALAM_L", 20)),     // level turun saat tidak ada aliran
  luberPersen: Number(env("AMBANG_LUBER_PERSEN", 97)),      // toren dianggap penuh
};

const bot = new TelegramBot(env("TELEGRAM_TOKEN"), { polling: false });
const CHAT = env("TELEGRAM_CHAT_ID");
const kirimTelegram = async (teks) => { try { await bot.sendMessage(CHAT, teks, { parse_mode: "HTML" }); } catch (e) { console.error("Telegram gagal:", e.message, "\n" + teks); } };

const nodeCache = new Map();
async function infoNode(id) {
  if (!nodeCache.has(id)) { const s = await db.doc(`node/${id}`).get(); nodeCache.set(id, s.exists ? { id, ...s.data() } : null); }
  return nodeCache.get(id);
}
const namaNode = async (id) => (await infoNode(id))?.nama ?? id;
const daftarNode = async () => (await db.collection("node").get()).docs.map((d) => ({ id: d.id, ...d.data() }));

// ---------- peringatan dengan status ----------
async function peringatanAktif(nodeId, jenis) {
  const s = await db.collection("peringatan").where("node_id", "==", nodeId).where("jenis", "==", jenis).where("selesai", "==", null).limit(1).get();
  return s.empty ? null : s.docs[0].ref;
}
async function naikkanPeringatan(nodeId, jenis, pesan, nilai) {
  if (await peringatanAktif(nodeId, jenis)) return;
  await db.collection("peringatan").add({ node_id: nodeId, jenis, pesan, nilai: nilai ?? null, ts: FieldValue.serverTimestamp(), selesai: null });
  await kirimTelegram(`⚠️ <b>${await namaNode(nodeId)}</b>\n${pesan}`);
  console.log(`[ALARM] ${nodeId} ${jenis}`);
}
async function selesaikanPeringatan(nodeId, jenis) {
  const aktif = await peringatanAktif(nodeId, jenis);
  if (!aktif) return;
  await aktif.update({ selesai: FieldValue.serverTimestamp(), ditangani_oleh: null, catatan: "kembali normal sendiri" });
  await kirimTelegram(`✅ <b>${await namaNode(nodeId)}</b>\nKondisi <i>${jenis.replaceAll("_", " ")}</i> kembali normal.`);
}

// ---------- pemeriksaan per paket ----------
async function periksaPaket(p) {
  const node = await infoNode(p.id);
  const kapasitas = Number(node?.toren_l ?? 2000);
  const ms = p.ts * 1000;
  const jam = jamWIB(ms);
  const sejak = (jamLalu) => ms - jamLalu * 3600e3;

  // aki cadangan
  if (p.v_aki != null) {
    if (p.v_aki < AMBANG.akiV) await naikkanPeringatan(p.id, "aki_rendah", `Tegangan aki cadangan ${p.v_aki} V. Cek adaptor PLN atau ganti aki.`, p.v_aki);
    else if (p.v_aki > AMBANG.akiV + 0.5) await selesaikanPeringatan(p.id, "aki_rendah");
  }

  // sensor level putus
  if (p.level_cm != null && p.level_cm < 0) await naikkanPeringatan(p.id, "sensor_level", "Sensor level tidak terbaca (arus loop di bawah 4 mA). Cek kabel sensor.", -1);
  else if (p.level_cm >= 0) await selesaikanPeringatan(p.id, "sensor_level");

  // aliran nol siang hari (paket ini sudah tersimpan, jadi ikut terhitung)
  if (jam >= 6 && jam < 18) {
    const data = await bacaanSejak(p.id, sejak(AMBANG.nolJam));
    const total = data.reduce((a, r) => a + Number(r.vol_l), 0);
    const cukup = data.length >= (AMBANG.nolJam * 60) / 15;
    if (cukup && total === 0) await naikkanPeringatan(p.id, "aliran_nol", `Tidak ada aliran ke warga selama ${AMBANG.nolJam} jam di siang hari. Toren kosong atau pipa tersumbat?`, 0);
    else if (total > 0) await selesaikanPeringatan(p.id, "aliran_nol");
  }

  // aliran malam ke warga (kebocoran jaringan distribusi)
  if (jam >= 1 && jam < 4) {
    if (p.q_lpm > AMBANG.malamLpm) await naikkanPeringatan(p.id, "aliran_malam", `Aliran ke warga ${p.q_lpm} L/menit pada pukul ${jam}.00 WIB. Kemungkinan pipa distribusi bocor atau keran terbuka.`, p.q_lpm);

    // toren bocor: tidak ada aliran keluar, pompa mati, tapi level turun
    const data = await bacaanSejak(p.id, sejak(1), { batas: 5 });
    const tenang = data.every((r) => Number(r.vol_l) === 0 && !r.pompa);
    if (tenang && data.length >= 4 && p.toren_l >= 0) {
      const turun = Number(data[data.length - 1].toren_l) - Number(p.toren_l);
      if (turun > AMBANG.bocorMalamL) await naikkanPeringatan(p.id, "toren_bocor", `Isi toren turun ${Math.round(turun)} L dalam satu jam tanpa aliran keluar dan pompa mati. Cek toren, nipel bawah, dan katup.`, turun);
    }
  } else if (jam === 6) {
    await selesaikanPeringatan(p.id, "aliran_malam");
    await selesaikanPeringatan(p.id, "toren_bocor");
  }

  // luber: toren penuh tapi pompa masih mengisi
  if (p.pompa && p.toren_l >= kapasitas * AMBANG.luberPersen / 100) {
    await naikkanPeringatan(p.id, "luber", `Toren sudah ${Math.round(p.toren_l)} L (penuh) tetapi pompa masih mengisi. Pelampung atau saklar otomatis pompa perlu dicek.`, p.toren_l);
  } else if (!p.pompa) await selesaikanPeringatan(p.id, "luber");

  // pompa tanpa hasil: ada pulsa masuk tapi level tidak naik sepadan dibanding paket sebelumnya
  if (p.pompa && p.vol_in_l > 100) {
    const [sebelum] = await bacaanSejak(p.id, sejak(1), { sebelumMs: ms, batas: 1 });
    if (sebelum && sebelum.toren_l >= 0 && p.toren_l >= 0) {
      const naikSeharusnya = Number(p.vol_in_l) - Number(p.vol_l);
      const naikNyata = Number(p.toren_l) - Number(sebelum.toren_l);
      if (naikSeharusnya > 150 && naikNyata < naikSeharusnya * 0.5)
        await naikkanPeringatan(p.id, "pompa_tanpa_hasil", `Meter masuk mencatat ${p.vol_in_l} L tetapi toren hanya naik ${Math.round(naikNyata)} L. Cek toren bocor, luber, atau meter masuk.`, naikNyata);
      else await selesaikanPeringatan(p.id, "pompa_tanpa_hasil");
    }
  }

  await selesaikanPeringatan(p.id, "offline");
}

// ---------- MQTT ----------
const client = mqtt.connect(env("MQTT_URL"), { username: env("MQTT_USER"), password: env("MQTT_PASS"), reconnectPeriod: 5000 });
client.on("connect", () => { console.log("MQTT tersambung"); client.subscribe("flowmeter/+/data"); client.subscribe("flowmeter/+/status"); });
// Pesan diproses satu per satu sesuai urutan datang. Kalau diproses bersamaan, paket yang lebih lama
// bisa diperiksa belakangan dan langsung menutup alarm yang baru dinaikkan paket sesudahnya.
let antrean = Promise.resolve();
client.on("message", (topik, pesan) => { antrean = antrean.then(() => terimaPesan(topik, pesan)).catch((e) => console.error("Pesan gagal:", e.message)); });

async function terimaPesan(topik, pesan) {
  const [, nodeId, jenis] = topik.split("/");
  if (jenis === "status") { console.log(`[STATUS] ${nodeId}: ${pesan}`); return; }
  let p; try { p = JSON.parse(pesan.toString()); } catch { return; }
  if (!p.id || p.ts == null) return;

  try {
    if (!(await simpanPaket(p))) return;                     // paket ganda dari buffer microSD
  } catch (e) { console.error("Simpan gagal:", e.message); return; }
  console.log(`[DATA] ${p.id} keluar ${p.vol_l} L, masuk ${p.vol_in_l} L, toren ${p.toren_l} L, pompa ${p.pompa}`);

  if ((Date.now() - p.ts * 1000) / 60e3 < 30) {
    try { await periksaPaket(p); } catch (e) { console.error("Periksa gagal:", e.message); }
  }
}

// ---------- offline: tiap 10 menit ----------
cron.schedule("*/10 * * * *", async () => {
  for (const n of await daftarNode()) {
    const ts = n.terakhir?.ts?.toMillis?.();
    const menit = ts ? (Date.now() - ts) / 60e3 : Infinity;
    if (menit > AMBANG.offlineMenit) await naikkanPeringatan(n.id, "offline", `Tidak ada data selama ${Number.isFinite(menit) ? Math.round(menit) + " menit" : "sejak dipasang"}. Cek listrik rumah pompa atau sinyal.`, Number.isFinite(menit) ? menit : null);
  }
});

// ---------- ringkasan harian 06.30 WIB untuk hari kemarin: pemakaian, pompa, neraca air ----------
async function ringkasanHarian() {
  const kemarin = geserTanggal(tanggalWIB(Date.now()), -1);
  for (const n of await daftarNode()) {
    const s = await db.collection(`node/${n.id}/harian`).where("tanggal", ">=", geserTanggal(kemarin, -7)).where("tanggal", "<=", kemarin).orderBy("tanggal", "desc").get();
    const hari = s.docs.map((d) => d.data());
    const k = hari[0];
    if (!k || k.tanggal !== kemarin) continue;
    const sebelum = hari.slice(1);
    const rata = sebelum.length ? sebelum.reduce((a, r) => a + r.keluar_l, 0) / sebelum.length / 1000 : null;
    const keluarM3 = k.keluar_l / 1000;
    const nr = neraca(k);

    let t = `📊 <b>${n.nama}</b> (${n.desa}) ringkasan ${k.tanggal}\n`;
    t += `Keluar ke warga: <b>${keluarM3.toFixed(2)} m³</b>${rata ? ` (rata-rata 7 hari ${rata.toFixed(2)} m³)` : ""}\n`;
    t += `Masuk dari pompa: ${(k.masuk_l / 1000).toFixed(2)} m³, pompa hidup ${Number(k.jam_pompa ?? 0).toFixed(1)} jam\n`;
    if (nr) t += `Neraca air: selisih ${Math.round(nr.selisih_l)} L (${Number(nr.selisih_persen ?? 0).toFixed(1)} %)\n`;
    if (k.malam_n) t += `Uji malam: level ${k.malam_turun_l != null ? `turun ${Math.round(k.malam_turun_l)} L` : "-"}, aliran ${Number(k.malam_q_lpm ?? 0).toFixed(2)} L/menit\n`;
    t += `Paket diterima ${k.paket}/96, aki terendah ${k.v_aki_min ?? "-"} V`;
    await kirimTelegram(t);

    if (rata && keluarM3 > rata * AMBANG.lonjakanPersen / 100)
      await naikkanPeringatan(n.id, "lonjakan_harian", `Pemakaian kemarin ${keluarM3.toFixed(2)} m³, lebih dari ${AMBANG.lonjakanPersen}% rata-rata 7 hari (${rata.toFixed(2)} m³).`, keluarM3);
    else await selesaikanPeringatan(n.id, "lonjakan_harian");

    if (nr && Math.abs(nr.selisih_l) > AMBANG.neracaMinL && Math.abs(nr.selisih_persen ?? 0) > AMBANG.neracaPersen)
      await naikkanPeringatan(n.id, "neraca_harian", `Neraca air kemarin tidak seimbang: masuk ${Math.round(nr.masuk_l)} L, keluar ${Math.round(nr.keluar_l)} L, toren berubah ${Math.round(nr.berubah_l)} L, selisih ${Math.round(nr.selisih_l)} L (${Number(nr.selisih_persen).toFixed(1)} %). ${nr.selisih_l > 0 ? "Air hilang: cek toren bocor atau luber." : "Air lebih: cek meter masuk atau kalibrasi level."}`, nr.selisih_l);
    else await selesaikanPeringatan(n.id, "neraca_harian");
  }
}
cron.schedule("30 6 * * *", ringkasanHarian, { timezone: "Asia/Jakarta" });

// node src/index.js --ringkasan  : kirim ringkasan kemarin sekarang juga, lalu berhenti
if (process.argv.includes("--ringkasan")) { await ringkasanHarian(); process.exit(0); }

console.log("Backend monitoring toren berjalan");
