// Salin file ini per lokasi, isi sesuai node. Jangan commit yang berisi password.
// Lima node: tuban-mander, tuban-bader, tuban-tuwiri, tuban-kabluan, tuban-ngulahan

#define ID_NODE               "tuban-mander"
#define INTERVAL_KIRIM_MS     (15UL * 60UL * 1000UL)   // 15 menit

// Meter keluar (ke warga) dan meter masuk (dari pompa): liter per pulsa sesuai modul pulsa
#define LITER_PER_PULSA_KELUAR  10.0f     // DN40 Onda: 10 L/pulsa (Tuwiri DN15: cek, biasanya 1 L)
#define LITER_PER_PULSA_MASUK   10.0f     // DN20/DN25: 10 L/pulsa, atau 1 L

// Sensor level tekanan hidrostatik 0..2 mH2O, keluaran 4..20 mA, shunt 150 ohm -> 0,6..3,0 V di ADC
#define LEVEL_SHUNT_OHM       150.0f
#define LEVEL_RENTANG_CM      200.0f    // 20 mA = 200 cm kolom air
#define LEVEL_OFFSET_CM       0.0f      // koreksi bila sensor sedikit di bawah dasar toren (isi saat kalibrasi)
#define TOREN_LITER_PER_CM    14.3f     // Hidro 2000 L, diameter ~1,35 m: pi*(67.5)^2/1000 = 14,3 L/cm
#define TOREN_TINGGI_CM       150.0f    // tinggi air saat penuh (ukur saat pemasangan)

// Kartu SIM IM3 (Indosat)
#define APN       "indosatgprs"
#define APN_USER  "indosat"
#define APN_PASS  "indosat"

// Broker MQTT dengan TLS (SIM7600 mendukung TLS 1.2)
#define MQTT_HOST "xxxxxxxx.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "node_tandon"
#define MQTT_PASS "ganti-password-ini"
