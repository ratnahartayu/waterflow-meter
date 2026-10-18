// Sumber data sungguhan: Firebase Auth (PIN) + Firestore (data dari backend).
import { initializeApp } from "firebase/app";
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from "firebase/auth";
import {
  initializeFirestore, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, query, where, orderBy, onSnapshot, getDocs, updateDoc, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { CONFIG } from "../config.js";

let auth, db;
const ms = (t) => (t?.toMillis ? t.toMillis() : t ?? null);
const password = (pin) => CONFIG.awalanPassword + pin;

async function konfigurasi() {
  const e = import.meta.env;
  if (e.VITE_EMULATOR === "1") return { apiKey: "demo", projectId: "demo-toren", authDomain: "localhost" };
  if (e.VITE_FIREBASE_API_KEY) {
    return { apiKey: e.VITE_FIREBASE_API_KEY, authDomain: e.VITE_FIREBASE_AUTH_DOMAIN, projectId: e.VITE_FIREBASE_PROJECT_ID, appId: e.VITE_FIREBASE_APP_ID };
  }
  // Firebase Hosting menyediakan konfigurasi proyek di alamat ini
  const r = await fetch("/__/firebase/init.json");
  if (!r.ok) throw new Error("Konfigurasi Firebase tidak ditemukan. Isi aplikasi/.env atau buka lewat Firebase Hosting.");
  return r.json();
}

export const contoh = false;

export async function mulai() {
  const app = initializeApp(await konfigurasi());
  auth = getAuth(app);
  auth.languageCode = "id";
  // simpan data di HP supaya layar tetap terisi saat sinyal hilang
  if (import.meta.env.VITE_EMULATOR === "1") {
    // firebase emulators:start --project demo-toren
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    db = initializeFirestore(app, {});
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    return;
  }
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
}

export function pantauLogin(cb) {
  return onAuthStateChanged(auth, async (u) => {
    if (!u) return cb(null);
    const token = await u.getIdTokenResult();
    cb(token.claims.operator ? { uid: u.uid } : null);
    if (!token.claims.operator) await signOut(auth);
  });
}

function pesanGagal(e) {
  const k = e?.code ?? "";
  if (k.includes("invalid-credential") || k.includes("wrong-password") || k.includes("user-not-found")) return "PIN salah. Coba lagi.";
  if (k.includes("too-many-requests")) return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
  if (k.includes("network")) return "Tidak ada sinyal internet. Coba lagi sebentar.";
  return "Belum bisa masuk. Coba lagi sebentar.";
}

export async function masuk(pin) {
  try { await signInWithEmailAndPassword(auth, CONFIG.emailOperator, password(pin)); }
  catch (e) { throw new Error(pesanGagal(e)); }
}

export const keluar = () => signOut(auth);

export async function gantiPin(lama, baru) {
  const u = auth.currentUser;
  try {
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(CONFIG.emailOperator, password(lama)));
    await updatePassword(u, password(baru));
  } catch (e) {
    throw new Error(e?.code?.includes("invalid-credential") ? "PIN lama salah." : pesanGagal(e));
  }
}

export function pantauNode(cb) {
  return onSnapshot(query(collection(db, "node"), orderBy("urutan")), (s) => {
    cb(s.docs.map((d) => {
      const n = d.data();
      return { id: d.id, ...n, terakhir: n.terakhir ? { ...n.terakhir, ts: ms(n.terakhir.ts) } : null };
    }));
  }, (e) => console.error("node:", e));
}

// Peringatan aktif ditambah yang selesai sejak waktu tertentu
export function pantauPeringatan(sejakMs, cb) {
  let aktif = [], selesai = [];
  const ubah = (d) => { const p = d.data(); return { id: d.id, ...p, ts: ms(p.ts) ?? Date.now(), selesai: ms(p.selesai) }; };
  const kirim = () => cb([...aktif, ...selesai]);
  const a = onSnapshot(query(collection(db, "peringatan"), where("selesai", "==", null)), (s) => { aktif = s.docs.map(ubah); kirim(); }, (e) => console.error("peringatan:", e));
  const b = onSnapshot(query(collection(db, "peringatan"), where("selesai", ">=", Timestamp.fromMillis(sejakMs))), (s) => { selesai = s.docs.map(ubah); kirim(); }, (e) => console.error("peringatan:", e));
  return () => { a(); b(); };
}

export async function ambilBacaan(nodeId, sejakMs) {
  const s = await getDocs(query(collection(db, "node", nodeId, "bacaan"), where("ts", ">=", Timestamp.fromMillis(sejakMs)), orderBy("ts")));
  return s.docs.map((d) => ({ ...d.data(), ts: ms(d.data().ts) }));
}

export async function ambilHarian(nodeId, dari, sampai) {
  const s = await getDocs(query(collection(db, "node", nodeId, "harian"), where("tanggal", ">=", dari), where("tanggal", "<=", sampai), orderBy("tanggal")));
  return s.docs.map((d) => d.data());
}

export function tandaiDitangani(id, oleh, catatan) {
  return updateDoc(doc(db, "peringatan", id), { selesai: serverTimestamp(), ditangani_oleh: oleh, catatan });
}
