// Backend monitoring toren desa (5 node, Kabupaten Tuban)
// MQTT subscriber -> Supabase -> cek ambang -> Telegram -> ringkasan harian dan neraca air

import "dotenv/config";
import mqtt from "mqtt";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import TelegramBot from "node-telegram-bot-api";

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

const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_KEY"));
const bot = new TelegramBot(env("TELEGRAM_TOKEN"), { polling: false });
const CHAT = env("TELEGRAM_CHAT_ID");
const kirimTelegram = async (teks) => { try { await bot.sendMessage(CHAT, teks, { parse_mode: "HTML" }); } catch (e) { console.error("Telegram:", e.message); } };

const nodeCache = new Map();
async function infoNode(id) {
  if (!nodeCache.has(id)) { const { data } = await db.from("node").select("*").eq("id", id).single(); nodeCache.set(id, data); }
  return nodeCache.get(id);
}
const namaNode = async (id) => (await infoNode(id))?.nama ?? id;

// ---------- peringatan dengan status ----------
async function peringatanAktif(nodeId, jenis) {
  const { data } = await db.from("peringatan").select("id").eq("node_id", nodeId).eq("jenis", jenis).is("selesai", null).limit(1);
  return data?.[0] ?? null;
}
async function naikkanPeringatan(nodeId, jenis, pesan, nilai) {
  if (await peringatanAktif(nodeId, jenis)) return;
  await db.from("peringatan").insert({ node_id: nodeId, jenis, pesan, nilai });
  await kirimTelegram(`⚠️ <b>${await namaNode(nodeId)}</b>\n${pesan}`);
  console.log(`[ALARM] ${nodeId} ${jenis}`);
}
async function selesaikanPeringatan(nodeId, jenis) {
  const aktif = await peringatanAktif(nodeId, jenis);
  if (!aktif) return;
  await db.from("peringatan").update({ selesai: new Date().toISOString() }).eq("id", aktif.id);
  await kirimTelegram(`✅ <b>${await namaNode(nodeId)}</b>\nKondisi <i>${jenis.replaceAll("_", " ")}</i> kembali normal.`);
}

// ---------- pemeriksaan per paket ----------
async function periksaPaket(p) {
  const node = await infoNode(p.id);
  const kapasitas = Number(node?.toren_l ?? 2000);
  const jam = Number(new Date(p.ts * 1000).toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Jakarta" }));
  const sejak = (jamLalu) => new Date(Date.now() - jamLalu * 3600e3).toISOString();

  // aki cadangan
  if (p.v_aki != null) {
    if (p.v_aki < AMBANG.akiV) await naikkanPeringatan(p.id, "aki_rendah", `Tegangan aki cadangan ${p.v_aki} V. Cek adaptor PLN atau ganti aki.`, p.v_aki);
    else if (p.v_aki > AMBANG.akiV + 0.5) await selesaikanPeringatan(p.id, "aki_rendah");
  }

  // sensor level putus
  if (p.level_cm != null && p.level_cm < 0) await naikkanPeringatan(p.id, "sensor_level", "Sensor level tidak terbaca (arus loop di bawah 4 mA). Cek kabel sensor.", -1);
  else if (p.level_cm >= 0) await selesaikanPeringatan(p.id, "sensor_level");

  // aliran nol siang hari
  if (jam >= 6 && jam < 18) {
    const { data } = await db.from("bacaan").select("vol_l").eq("node_id", p.id).gte("ts", sejak(AMBANG.nolJam));
    const total = (data ?? []).reduce((a, r) => a + Number(r.vol_l), 0) + Number(p.vol_l);
    const cukup = (data?.length ?? 0) >= (AMBANG.nolJam * 60) / 15 - 1;
    if (cukup && total === 0) await naikkanPeringatan(p.id, "aliran_nol", `Tidak ada aliran ke warga selama ${AMBANG.nolJam} jam di siang hari. Toren kosong atau pipa tersumbat?`, 0);
    else if (total > 0) await selesaikanPeringatan(p.id, "aliran_nol");
  }

  // aliran malam ke warga (kebocoran jaringan distribusi)
  if (jam >= 1 && jam < 4) {
    if (p.q_lpm > AMBANG.malamLpm) await naikkanPeringatan(p.id, "aliran_malam", `Aliran ke warga ${p.q_lpm} L/menit pada pukul ${jam}.00 WIB. Kemungkinan pipa distribusi bocor atau keran terbuka.`, p.q_lpm);

    // toren bocor: tidak ada aliran keluar, pompa mati, tapi level turun
    const { data } = await db.from("bacaan").select("toren_l, vol_l, pompa").eq("node_id", p.id).gte("ts", sejak(1)).order("ts", { ascending: false }).limit(4);
    const tenang = (data ?? []).every(r => Number(r.vol_l) === 0 && !r.pompa) && Number(p.vol_l) === 0 && !p.pompa;
    if (tenang && data?.length >= 3 && p.toren_l >= 0) {
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

  // pompa tanpa hasil: ada pulsa masuk tapi level tidak naik, atau sebaliknya
  if (p.pompa && p.vol_in_l > 100) {
    const { data } = await db.from("bacaan").select("toren_l, vol_l").eq("node_id", p.id).order("ts", { ascending: false }).limit(1);
    const sebelum = data?.[0];
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
client.on("message", async (topik, pesan) => {
  const [, nodeId, jenis] = topik.split("/");
  if (jenis === "status") { console.log(`[STATUS] ${nodeId}: ${pesan}`); return; }
  let p; try { p = JSON.parse(pesan.toString()); } catch { return; }
  if (!p.id || p.ts == null) return;

  const { error } = await db.from("bacaan").upsert({
    node_id: p.id, ts: new Date(p.ts * 1000).toISOString(),
    vol_l: p.vol_l, kum_l: p.kum_l, q_lpm: p.q_lpm,
    vol_in_l: p.vol_in_l ?? 0, kum_in_l: p.kum_in_l, q_in_lpm: p.q_in_lpm ?? 0,
    level_cm: p.level_cm, toren_l: p.toren_l, pompa: !!p.pompa,
    v_aki: p.v_aki, rssi: p.rssi,
  }, { onConflict: "node_id,ts", ignoreDuplicates: true });
  if (error) { console.error("Simpan gagal:", error.message); return; }
  console.log(`[DATA] ${p.id} keluar ${p.vol_l} L, masuk ${p.vol_in_l} L, toren ${p.toren_l} L, pompa ${p.pompa}`);

  if ((Date.now() - p.ts * 1000) / 60e3 < 30) await periksaPaket(p);
});

// ---------- offline: tiap 10 menit ----------
cron.schedule("*/10 * * * *", async () => {
  const { data: nodes } = await db.from("node").select("id");
  for (const n of nodes ?? []) {
    const { data } = await db.from("bacaan").select("ts").eq("node_id", n.id).order("ts", { ascending: false }).limit(1);
    const menit = data?.[0]?.ts ? (Date.now() - new Date(data[0].ts)) / 60e3 : Infinity;
    if (menit > AMBANG.offlineMenit) await naikkanPeringatan(n.id, "offline", `Tidak ada data selama ${Math.round(menit)} menit. Cek listrik rumah pompa atau sinyal.`, menit);
  }
});

// ---------- ringkasan harian 06.30 WIB: pemakaian, pompa, neraca air ----------
cron.schedule("30 6 * * *", async () => {
  const { data: nodes } = await db.from("node").select("id, nama, desa");
  for (const n of nodes ?? []) {
    const { data: hari } = await db.from("rekap_hari").select("*").eq("node_id", n.id).order("tanggal", { ascending: false }).limit(8);
    if (!hari?.length) continue;
    const k = hari[0], sebelum = hari.slice(1, 8);
    const rata = sebelum.length ? sebelum.reduce((a, r) => a + Number(r.vol_m3), 0) / sebelum.length : null;
    const { data: nr } = await db.from("neraca_hari").select("*").eq("node_id", n.id).eq("tanggal", k.tanggal).limit(1);
    const { data: um } = await db.from("uji_malam").select("*").eq("node_id", n.id).eq("tanggal", k.tanggal).limit(1);
    const neraca = nr?.[0], malam = um?.[0];

    let t = `📊 <b>${n.nama}</b> (${n.desa}) ringkasan ${k.tanggal}\n`;
    t += `Keluar ke warga: <b>${Number(k.vol_m3).toFixed(2)} m³</b>${rata ? ` (rata-rata 7 hari ${rata.toFixed(2)} m³)` : ""}\n`;
    t += `Masuk dari pompa: ${Number(k.vol_in_m3).toFixed(2)} m³, pompa hidup ${Number(k.jam_pompa).toFixed(1)} jam\n`;
    if (neraca) t += `Neraca air: selisih ${Math.round(neraca.selisih_l)} L (${Number(neraca.selisih_persen ?? 0).toFixed(1)} %)\n`;
    if (malam) t += `Uji malam: level ${malam.turun_l != null ? `turun ${Math.round(malam.turun_l)} L` : "-"}, aliran ${Number(malam.q_lpm_malam ?? 0).toFixed(2)} L/menit\n`;
    t += `Paket diterima ${k.jumlah_paket}/96, aki terendah ${k.v_aki_min ?? "-"} V`;
    await kirimTelegram(t);

    if (rata && Number(k.vol_m3) > rata * AMBANG.lonjakanPersen / 100)
      await naikkanPeringatan(n.id, "lonjakan_harian", `Pemakaian kemarin ${Number(k.vol_m3).toFixed(2)} m³, lebih dari ${AMBANG.lonjakanPersen}% rata-rata 7 hari (${rata.toFixed(2)} m³).`, k.vol_m3);
    else await selesaikanPeringatan(n.id, "lonjakan_harian");

    if (neraca && Math.abs(neraca.selisih_l) > AMBANG.neracaMinL && Math.abs(neraca.selisih_persen ?? 0) > AMBANG.neracaPersen)
      await naikkanPeringatan(n.id, "neraca_harian", `Neraca air kemarin tidak seimbang: masuk ${Math.round(neraca.masuk_l)} L, keluar ${Math.round(neraca.keluar_l)} L, toren berubah ${Math.round(neraca.toren_akhir_l - neraca.toren_awal_l)} L, selisih ${Math.round(neraca.selisih_l)} L (${Number(neraca.selisih_persen).toFixed(1)} %). ${neraca.selisih_l > 0 ? "Air hilang: cek toren bocor atau luber." : "Air lebih: cek meter masuk atau kalibrasi level."}`, neraca.selisih_l);
    else await selesaikanPeringatan(n.id, "neraca_harian");
  }
}, { timezone: "Asia/Jakarta" });

console.log("Backend monitoring toren berjalan");
