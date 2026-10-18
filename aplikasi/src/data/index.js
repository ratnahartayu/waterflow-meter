// Pilih sumber data: Firebase sungguhan, atau data contoh bila alamat memuat ?contoh
const pakaiContoh = new URLSearchParams(location.search).has("contoh") || import.meta.env.VITE_CONTOH === "1";

export const muatData = () => (pakaiContoh ? import("./contoh.js") : import("./firebase.js"));
