import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon, FancyArrowPatch, Rectangle
import matplotlib.dates as mdates
import matplotlib.ticker
from datetime import date

TEAL = "#0F6E56"; TEAL_F = "#E1F5EE"
PURPLE = "#534AB7"; PURPLE_F = "#EEEDFE"
CORAL = "#993C1D"; CORAL_F = "#FAECE7"
AMBER = "#854F0B"; AMBER_F = "#FAEEDA"
GRAY = "#5F5E5A"; GRAY_F = "#F1EFE8"
INK = "#2C2C2A"

def box(ax, cx, cy, w, h, title, sub=None, fc=TEAL_F, ec=TEAL, bold=True, fs=10.5):
    p = FancyBboxPatch((cx - w/2, cy - h/2), w, h, boxstyle="round,pad=0,rounding_size=0.25",
                       fc=fc, ec=ec, lw=1.2)
    ax.add_patch(p)
    if sub:
        ax.text(cx, cy + 0.22, title, ha="center", va="center", fontsize=fs, fontweight="bold" if bold else "normal", color=INK)
        ax.text(cx, cy - 0.25, sub, ha="center", va="center", fontsize=fs - 1.5, color=GRAY)
    else:
        ax.text(cx, cy, title, ha="center", va="center", fontsize=fs, fontweight="bold" if bold else "normal", color=INK)

def diamond(ax, cx, cy, w, h, text, fs=10.5):
    ax.add_patch(Polygon([(cx, cy + h/2), (cx + w/2, cy), (cx, cy - h/2), (cx - w/2, cy)],
                         closed=True, fc=AMBER_F, ec=AMBER, lw=1.2))
    ax.text(cx, cy, text, ha="center", va="center", fontsize=fs, fontweight="bold", color=INK)

def arrow(ax, p1, p2, label=None, lpos=None, color=GRAY):
    a = FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=14, lw=1.2, color=color,
                        shrinkA=0, shrinkB=0)
    ax.add_patch(a)
    if label:
        ax.text(*lpos, label, fontsize=9, color=GRAY, ha="center", va="center")

def elbow(ax, pts, color=GRAY):
    for i in range(len(pts) - 2):
        ax.plot([pts[i][0], pts[i+1][0]], [pts[i][1], pts[i+1][1]], color=color, lw=1.2)
    arrow(ax, pts[-2], pts[-1], color=color)

def setup(w, h, xlim, ylim):
    fig, ax = plt.subplots(figsize=(w, h), dpi=200)
    ax.set_xlim(*xlim); ax.set_ylim(*ylim); ax.axis("off")
    fig.subplots_adjust(0, 0, 1, 1)
    return fig, ax

# ---------- Gambar 1: flowchart node (perangkat) ----------
fig, ax = setup(7.5, 9.2, (0, 10), (0, 12.3))
BW, BH = 4.2, 1.0
cx = 4.2
ys = {"mulai": 11.4, "init": 9.9, "baca": 8.4, "hitung": 6.9, "dec": 5.3, "kirim": 3.6, "tunda": 2.1}
box(ax, cx, ys["mulai"], BW, 0.75, "Mulai (perangkat dinyalakan)", fc=GRAY_F, ec=GRAY)
box(ax, cx, ys["init"], BW, BH, "Inisialisasi perangkat", "ESP32, sensor, modul komunikasi")
box(ax, cx, ys["baca"], BW, BH, "Baca pulsa water meter", "reed switch, interrupt counter")
box(ax, cx, ys["hitung"], BW, BH, "Hitung debit dan volume", "1 pulsa = 10 L, akumulasi")
diamond(ax, cx, ys["dec"], 4.0, 1.3, "Koneksi tersedia?")
box(ax, cx, ys["kirim"], BW, BH, "Kirim data ke server", "MQTT, JSON + timestamp")
box(ax, cx, ys["tunda"], BW, BH, "Tunda interval kirim", "15 menit, deep sleep", fc=GRAY_F, ec=GRAY)
box(ax, 8.2, ys["dec"], 2.9, BH, "Simpan buffer lokal", "microSD, kirim ulang")
for a, b in [("mulai", "init"), ("init", "baca"), ("baca", "hitung")]:
    arrow(ax, (cx, ys[a] - (0.375 if a == "mulai" else BH/2)), (cx, ys[b] + BH/2))
arrow(ax, (cx, ys["hitung"] - BH/2), (cx, ys["dec"] + 0.65))
arrow(ax, (cx, ys["dec"] - 0.65), (cx, ys["kirim"] + BH/2), "Ya", (cx + 0.35, ys["dec"] - 0.95))
arrow(ax, (cx + 2.0, ys["dec"]), (8.2 - 1.45, ys["dec"]), "Tidak", (cx + 2.3, ys["dec"] + 0.3))
arrow(ax, (cx, ys["kirim"] - BH/2), (cx, ys["tunda"] + BH/2))
elbow(ax, [(8.2, ys["dec"] - BH/2), (8.2, ys["tunda"]), (cx + BW/2, ys["tunda"])])
ax.text(cx, 1.1, "kembali ke baca pulsa water meter", ha="center", fontsize=9.5, color=GRAY, style="italic")
elbow(ax, [(cx, ys["tunda"] - BH/2), (cx, 1.4), (0.6, 1.4), (0.6, ys["baca"]), (cx - BW/2, ys["baca"])])
fig.savefig("flowchart_node.png"); plt.close(fig)

# ---------- Gambar 2: flowchart server ----------
fig, ax = setup(7.5, 6.3, (0, 10), (0, 8.4))
ys = {"terima": 7.5, "simpan": 6.0, "dec": 4.4, "dash": 2.7}
box(ax, cx, ys["terima"], BW, BH, "Terima data dari perangkat", "broker MQTT", fc=PURPLE_F, ec=PURPLE)
box(ax, cx, ys["simpan"], BW, BH, "Validasi dan simpan", "database time-series", fc=PURPLE_F, ec=PURPLE)
diamond(ax, cx, ys["dec"], 4.0, 1.3, "Nilai di luar ambang?")
box(ax, 8.2, ys["dec"], 2.9, BH, "Kirim notifikasi", "Telegram, SMS", fc=PURPLE_F, ec=PURPLE)
box(ax, cx, ys["dash"], BW, BH, "Tampilkan di dashboard", "grafik per jam, rekap harian", fc=PURPLE_F, ec=PURPLE)
arrow(ax, (cx, ys["terima"] - BH/2), (cx, ys["simpan"] + BH/2))
arrow(ax, (cx, ys["simpan"] - BH/2), (cx, ys["dec"] + 0.65))
arrow(ax, (cx + 2.0, ys["dec"]), (8.2 - 1.45, ys["dec"]), "Ya", (cx + 2.3, ys["dec"] + 0.3))
arrow(ax, (cx, ys["dec"] - 0.65), (cx, ys["dash"] + BH/2), "Tidak", (cx + 0.5, ys["dec"] - 0.95))
elbow(ax, [(8.2, ys["dec"] - BH/2), (8.2, ys["dash"]), (cx + BW/2, ys["dash"])])
ax.text(cx, 1.5, "menunggu data berikutnya", ha="center", fontsize=9.5, color=GRAY, style="italic")
elbow(ax, [(cx, ys["dash"] - BH/2), (cx, 1.8), (0.6, 1.8), (0.6, ys["terima"]), (cx - BW/2, ys["terima"])])
fig.savefig("flowchart_server.png"); plt.close(fig)

# ---------- Gambar 3: arsitektur 4 lapisan ----------
fig, ax = setup(8.2, 8.6, (0, 12), (0, 12.6))
layers = [
    ("Lapisan perangkat (di tandon)", [("Water meter DN40", "modul pulsa, 1 pulsa = 10 L"), ("ESP32", "hitung pulsa, buffer microSD"), ("Catu daya surya", "panel 20 Wp, aki 12 V 7 Ah")], TEAL_F, TEAL, True),
    ("Lapisan jaringan (dipilih GSM)", [("WiFi", "bila ada internet"), ("GSM / 4G", "SIM800L atau SIM7600"), ("LoRa", "bila tanpa seluler")], GRAY_F, GRAY, False),
    ("Lapisan server (cloud)", [("Broker MQTT", "HiveMQ Cloud / Mosquitto"), ("Backend + alarm", "Node.js / Python"), ("Database", "Supabase / InfluxDB")], PURPLE_F, PURPLE, True),
    ("Lapisan pengguna", [("Dashboard web", "grafik per jam, per hari"), ("Ponsel pengelola", "ringkasan harian"), ("Notifikasi", "Telegram / SMS")], CORAL_F, CORAL, False),
]
top = 12.0; LH = 2.6; gap = 0.5
xs = [2.2, 6.0, 9.8]
for i, (name, items, fc, ec, arrows_in) in enumerate(layers):
    y0 = top - i * (LH + gap)
    ax.add_patch(Rectangle((0.3, y0 - LH), 11.4, LH, fc="none", ec=GRAY, lw=1, ls=(0, (4, 3))))
    ax.text(0.55, y0 - 0.35, name, fontsize=10.5, fontweight="bold", color=INK, va="center")
    cy = y0 - LH + 1.0
    for j, (t, s) in enumerate(items):
        main = (i == 1 and j == 1)
        box(ax, xs[j], cy, 3.4, 1.25, t, s, fc=(AMBER_F if main else fc), ec=(AMBER if main else ec))
        if arrows_in and j < 2:
            arrow(ax, (xs[j] + 1.7, cy), (xs[j+1] - 1.7, cy))
    if i < 3:
        arrow(ax, (6.0, y0 - LH), (6.0, y0 - LH - gap))
fig.savefig("arsitektur.png"); plt.close(fig)

# ---------- Gambar 4: blok diagram ----------
fig, ax = setup(8.2, 7.0, (0, 12), (0, 10.3))
W, H = 2.55, 1.15
ys1 = 7.9
xs1 = [1.7, 4.5, 7.3, 10.1]
box(ax, 7.3, 9.6, W, H, "Catu daya", "12 V, step-down", fc=AMBER_F, ec=AMBER)
arrow(ax, (7.3, 9.6 - H/2), (7.3, ys1 + H/2))
ax.add_patch(Rectangle((0.3, ys1 - 1.0), 11.4, 2.0, fc="none", ec=GRAY, lw=1, ls=(0, (4, 3))))
ax.text(0.55, ys1 - 0.85, "Node sensor (lapangan)", fontsize=9.5, color=GRAY, va="center")
for x, (t, s) in zip(xs1, [("Water meter", "pulsa reed, 10 L"), ("Pull-up + debounce", "10 kΩ, 20 ms"), ("ESP32", "hitung dan simpan"), ("Modul GSM", "SIM800L / SIM7600")]):
    box(ax, x, ys1, W, H, t, s)
for a, b in zip(xs1[:-1], xs1[1:]):
    arrow(ax, (a + W/2, ys1), (b - W/2, ys1))
ax.add_patch(Rectangle((5.75, 0.3), 5.95, 5.9, fc="none", ec=GRAY, lw=1, ls=(0, (4, 3))))
ax.text(6.0, 5.95, "Cloud dan pengguna", fontsize=9.5, color=GRAY, va="center")
arrow(ax, (10.1, ys1 - 1.0), (10.1, 5.2 + H/2))
box(ax, 10.1, 5.2, W, H, "Internet", "jaringan seluler", fc=GRAY_F, ec=GRAY)
arrow(ax, (10.1, 5.2 - H/2), (10.1, 3.4 + H/2))
box(ax, 10.1, 3.4, W, H, "Server", "MQTT, database, alarm", fc=PURPLE_F, ec=PURPLE)
box(ax, 7.3, 3.4, W, H, "Dashboard", "web / ponsel", fc=CORAL_F, ec=CORAL)
arrow(ax, (10.1 - W/2, 3.4), (7.3 + W/2, 3.4))
box(ax, 7.3, 1.4, W, H, "Notifikasi", "Telegram, SMS", fc=CORAL_F, ec=CORAL)
elbow(ax, [(10.1, 3.4 - H/2), (10.1, 1.4), (7.3 + W/2, 1.4)])
fig.savefig("blok_diagram.png"); plt.close(fig)

# ---------- Gambar 5: jadwal ----------
tasks = [
    ("Survei 5 lokasi, ukur pipa, cek sinyal", date(2026, 11, 2), date(2026, 11, 7)),
    ("Pengadaan komponen 5 node", date(2026, 11, 9), date(2026, 11, 28)),
    ("Perakitan dan uji 5 node di lab", date(2026, 11, 23), date(2026, 12, 12)),
    ("Setup server, 5 node, dashboard", date(2026, 11, 30), date(2026, 12, 12)),
    ("Pemasangan kunjungan 1 (3 lokasi)", date(2026, 12, 14), date(2026, 12, 16)),
    ("Pemasangan kunjungan 2 (2 lokasi)", date(2026, 12, 21), date(2026, 12, 23)),
    ("Uji coba dan kalibrasi level", date(2026, 12, 24), date(2027, 1, 10)),
    ("Pelatihan pengelola 5 desa", date(2027, 1, 11), date(2027, 1, 13)),
    ("Laporan kegiatan", date(2027, 1, 18), date(2027, 1, 24)),
]
fig, ax = plt.subplots(figsize=(8.2, 4.5), dpi=200)
for i, (name, s, e) in enumerate(tasks[::-1]):
    main = name.startswith("Pelatihan")
    ax.barh(i, (e - s).days + 1, left=s, height=0.55, color=(AMBER if main else TEAL), alpha=0.85)
ax.set_yticks(range(len(tasks))); ax.set_yticklabels([t[0] for t in tasks[::-1]], fontsize=9)
ax.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=0))
ax.xaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda x,p: (lambda d: f"{d.day} {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.month-1]}")(mdates.num2date(x))))
ax.grid(axis="x", color="#D3D1C7", lw=0.6); ax.set_axisbelow(True)
for sp in ["top", "right", "left"]: ax.spines[sp].set_visible(False)
ax.tick_params(axis="x", labelsize=8.5, rotation=0)
ax.set_xlim(date(2026, 11, 1), date(2027, 1, 26))
ax.set_title("Jadwal pelaksanaan per minggu, November 2026 sampai Januari 2027 (5 lokasi)", fontsize=10, color=INK, loc="left")
fig.tight_layout(); fig.savefig("jadwal.png"); plt.close(fig)
print("ok")
