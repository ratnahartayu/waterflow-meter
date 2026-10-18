/*
 * Node monitoring toren desa (Kabupaten Tuban)
 * ESP32 + 2 water meter reed switch (masuk dari pompa, keluar ke warga)
 *       + sensor level tekanan 4-20 mA + SIM7600 (4G, IM3) + microSD + RTC DS3231
 * Catu daya: adaptor 12 V dari PLN di rumah pompa, aki 7 Ah cadangan.
 *
 * Alur: hitung pulsa dua meter lewat interrupt -> baca level -> tiap INTERVAL_KIRIM
 *       kirim JSON ke MQTT (TLS) -> gagal kirim: simpan ke microSD, kirim ulang nanti.
 *
 * Library: TinyGSM, PubSubClient, RTClib, ArduinoJson, SD, SPI, Wire
 */

#define TINY_GSM_MODEM_SIM7600
#define TINY_GSM_RX_BUFFER 1024

#include <TinyGsmClient.h>
#include <PubSubClient.h>
#include <RTClib.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <SD.h>
#include <Wire.h>
#include <Preferences.h>

#include "config.h"

// ---------- pin ----------
const int PIN_PULSA_KELUAR = 27;   // reed meter keluar -> GND
const int PIN_PULSA_MASUK  = 26;   // reed meter masuk  -> GND
const int PIN_MODEM_RX     = 16;
const int PIN_MODEM_TX     = 17;
const int PIN_MODEM_PWR    = 4;
const int PIN_SD_CS        = 5;
const int PIN_ADC_AKI      = 34;   // pembagi 100k/27k dari aki 12 V
const int PIN_ADC_LEVEL    = 35;   // shunt 150 ohm pada loop 4-20 mA

// ---------- objek ----------
HardwareSerial SerialAT(1);
TinyGsm              modem(SerialAT);
TinyGsmClientSecure  gsmClient(modem);
PubSubClient         mqtt(gsmClient);
RTC_DS3231           rtc;
Preferences          prefs;

// ---------- penghitung pulsa ----------
struct Pulsa { volatile uint32_t baru = 0, total = 0, tAkhir = 0; };
Pulsa keluar, masuk;
const uint32_t DEBOUNCE_MS = 20;

void IRAM_ATTR isrKeluar() { uint32_t t = millis(); if (t - keluar.tAkhir >= DEBOUNCE_MS) { keluar.baru++; keluar.total++; keluar.tAkhir = t; } }
void IRAM_ATTR isrMasuk()  { uint32_t t = millis(); if (t - masuk.tAkhir  >= DEBOUNCE_MS) { masuk.baru++;  masuk.total++;  masuk.tAkhir  = t; } }

// ---------- util ----------
String topikData   = String("flowmeter/") + ID_NODE + "/data";
String topikStatus = String("flowmeter/") + ID_NODE + "/status";
const char* FILE_BUFFER = "/buffer.jsonl";

float bacaAdcVolt(int pin) {
  uint32_t akum = 0;
  for (int i = 0; i < 32; i++) { akum += analogRead(pin); delay(2); }
  return (akum / 32.0f) * 3.3f / 4095.0f;
}
float bacaTeganganAki()  { return bacaAdcVolt(PIN_ADC_AKI) * 4.70f; }

float bacaLevelCm() {
  float v  = bacaAdcVolt(PIN_ADC_LEVEL);
  float mA = v / LEVEL_SHUNT_OHM * 1000.0f;
  if (mA < 3.5f) return -1;                                  // loop putus / sensor lepas
  float cm = (mA - 4.0f) / 16.0f * LEVEL_RENTANG_CM + LEVEL_OFFSET_CM;
  return cm < 0 ? 0 : cm;
}
float levelKeLiter(float cm) { return cm < 0 ? -1 : cm * TOREN_LITER_PER_CM; }

uint32_t waktuUnix() { return rtc.now().unixtime(); }

bool modemNyala() {
  if (modem.testAT(1000)) return true;
  pinMode(PIN_MODEM_PWR, OUTPUT);
  digitalWrite(PIN_MODEM_PWR, HIGH); delay(1200); digitalWrite(PIN_MODEM_PWR, LOW);
  delay(8000);                                               // SIM7600 butuh waktu boot lebih lama
  return modem.testAT(10000);
}

bool sambungJaringan() {
  if (!modemNyala()) return false;
  modem.setNetworkMode(38);                                  // 38 = LTE only; 2 = otomatis
  if (!modem.waitForNetwork(90000L)) { Serial.println("Tidak ada jaringan"); return false; }
  if (!modem.isGprsConnected() && !modem.gprsConnect(APN, APN_USER, APN_PASS)) { Serial.println("Data gagal"); return false; }
  return true;
}

bool sambungMqtt() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(512);
  for (int i = 0; i < 3 && !mqtt.connected(); i++) {
    if (mqtt.connect(ID_NODE, MQTT_USER, MQTT_PASS, topikStatus.c_str(), 1, true, "offline")) {
      mqtt.publish(topikStatus.c_str(), "online", true);
      return true;
    }
    delay(2000);
  }
  return false;
}

// ---------- payload ----------
String buatPayload(uint32_t ts, uint32_t dKeluar, uint32_t dMasuk, uint32_t detik) {
  StaticJsonDocument<384> doc;
  float lKeluar = dKeluar * LITER_PER_PULSA_KELUAR;
  float lMasuk  = dMasuk  * LITER_PER_PULSA_MASUK;
  float menit   = detik / 60.0f;
  float cm      = bacaLevelCm();
  doc["id"]       = ID_NODE;
  doc["ts"]       = ts;
  doc["vol_l"]    = lKeluar;                                 // keluar ke warga, interval ini
  doc["kum_l"]    = keluar.total * LITER_PER_PULSA_KELUAR;
  doc["q_lpm"]    = menit > 0 ? round(lKeluar / menit * 100) / 100.0 : 0;
  doc["vol_in_l"] = lMasuk;                                  // masuk dari pompa, interval ini
  doc["kum_in_l"] = masuk.total * LITER_PER_PULSA_MASUK;
  doc["q_in_lpm"] = menit > 0 ? round(lMasuk / menit * 100) / 100.0 : 0;
  doc["level_cm"] = round(cm * 10) / 10.0;
  doc["toren_l"]  = round(levelKeLiter(cm));
  doc["pompa"]    = dMasuk > 0 ? 1 : 0;                      // pompa dianggap hidup bila ada aliran masuk
  doc["v_aki"]    = round(bacaTeganganAki() * 100) / 100.0;
  doc["rssi"]     = modem.getSignalQuality();
  String out; serializeJson(doc, out);
  return out;
}

// ---------- buffer microSD ----------
void simpanKeBuffer(const String& baris) {
  File f = SD.open(FILE_BUFFER, FILE_APPEND);
  if (!f) return;
  f.println(baris); f.close();
}

void kirimUlangBuffer() {
  if (!SD.exists(FILE_BUFFER)) return;
  File f = SD.open(FILE_BUFFER, FILE_READ); if (!f) return;
  File sisa = SD.open("/sisa.tmp", FILE_WRITE);
  int gagal = 0;
  while (f.available()) {
    String baris = f.readStringUntil('\n'); baris.trim();
    if (baris.isEmpty()) continue;
    if (gagal == 0 && mqtt.connected() && mqtt.publish(topikData.c_str(), baris.c_str(), false)) { mqtt.loop(); delay(50); }
    else { gagal++; sisa.println(baris); }
  }
  f.close(); sisa.close();
  SD.remove(FILE_BUFFER);
  if (gagal > 0) SD.rename("/sisa.tmp", FILE_BUFFER); else SD.remove("/sisa.tmp");
}

// ---------- setup ----------
void setup() {
  Serial.begin(115200); delay(300);
  Serial.println("\n== Node " ID_NODE " ==");

  prefs.begin("flow", false);
  keluar.total = prefs.getUInt("tot_out", 0);
  masuk.total  = prefs.getUInt("tot_in", 0);

  pinMode(PIN_PULSA_KELUAR, INPUT_PULLUP);
  pinMode(PIN_PULSA_MASUK,  INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_PULSA_KELUAR), isrKeluar, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_PULSA_MASUK),  isrMasuk,  FALLING);
  analogSetPinAttenuation(PIN_ADC_LEVEL, ADC_11db);
  analogSetPinAttenuation(PIN_ADC_AKI,   ADC_11db);

  Wire.begin(21, 22);
  if (!rtc.begin()) Serial.println("RTC tidak ditemukan");
  if (rtc.lostPower()) Serial.println("RTC perlu disetel (lihat README)");
  if (!SD.begin(PIN_SD_CS)) Serial.println("microSD tidak terbaca, buffer dimatikan");

  SerialAT.begin(115200, SERIAL_8N1, PIN_MODEM_RX, PIN_MODEM_TX);
  delay(3000);
  modem.restart();
  Serial.println("Modem: " + modem.getModemInfo());
}

// ---------- loop ----------
uint32_t tKirimTerakhir = 0;

void loop() {
  uint32_t sekarang = millis();
  if (tKirimTerakhir != 0 && sekarang - tKirimTerakhir < INTERVAL_KIRIM_MS) {
    esp_sleep_enable_timer_wakeup(1000000ULL);
    esp_sleep_enable_ext1_wakeup((1ULL << PIN_PULSA_KELUAR) | (1ULL << PIN_PULSA_MASUK), ESP_EXT1_WAKEUP_ALL_LOW);
    esp_light_sleep_start();
    return;
  }

  noInterrupts();
  uint32_t dK = keluar.baru; keluar.baru = 0;
  uint32_t dM = masuk.baru;  masuk.baru  = 0;
  interrupts();
  prefs.putUInt("tot_out", keluar.total);
  prefs.putUInt("tot_in",  masuk.total);

  uint32_t detik = tKirimTerakhir == 0 ? INTERVAL_KIRIM_MS / 1000 : (sekarang - tKirimTerakhir) / 1000;
  tKirimTerakhir = sekarang;

  String payload = buatPayload(waktuUnix(), dK, dM, detik);
  Serial.println(payload);

  bool ok = false;
  if (sambungJaringan() && sambungMqtt()) {
    kirimUlangBuffer();
    ok = mqtt.publish(topikData.c_str(), payload.c_str(), false);
    mqtt.loop(); delay(200); mqtt.disconnect();
  }
  if (!ok) simpanKeBuffer(payload);
  modem.gprsDisconnect();
  Serial.printf("Kirim %s\n", ok ? "OK" : "GAGAL, disimpan di buffer");
}
