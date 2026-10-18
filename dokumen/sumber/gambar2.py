import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Rectangle, Circle

TEAL = "#0F6E56"; TEAL_F = "#E1F5EE"
PURPLE = "#534AB7"; PURPLE_F = "#EEEDFE"
CORAL = "#993C1D"; CORAL_F = "#FAECE7"
AMBER = "#854F0B"; AMBER_F = "#FAEEDA"
GRAY = "#5F5E5A"; GRAY_F = "#F1EFE8"
INK = "#2C2C2A"; BLUE = "#378ADD"; DBLUE = "#185FA5"; WATER = "#B5D4F4"

def box(ax, cx, cy, w, h, title, sub=None, fc=TEAL_F, ec=TEAL, fs=10.5):
    ax.add_patch(FancyBboxPatch((cx - w/2, cy - h/2), w, h, boxstyle="round,pad=0,rounding_size=0.25", fc=fc, ec=ec, lw=1.2))
    if sub:
        ax.text(cx, cy + 0.22, title, ha="center", va="center", fontsize=fs, fontweight="bold", color=INK)
        ax.text(cx, cy - 0.25, sub, ha="center", va="center", fontsize=fs - 1.5, color=GRAY)
    else:
        ax.text(cx, cy, title, ha="center", va="center", fontsize=fs, fontweight="bold", color=INK)

def arrow(ax, p1, p2, color=GRAY, lw=1.2):
    ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=14, lw=lw, color=color, shrinkA=0, shrinkB=0))

def elbow(ax, pts, color=GRAY):
    for i in range(len(pts) - 2):
        ax.plot([pts[i][0], pts[i+1][0]], [pts[i][1], pts[i+1][1]], color=color, lw=1.2)
    arrow(ax, pts[-2], pts[-1], color=color)

def setup(w, h, xlim, ylim):
    fig, ax = plt.subplots(figsize=(w, h), dpi=200)
    ax.set_xlim(*xlim); ax.set_ylim(*ylim); ax.axis("off"); fig.subplots_adjust(0, 0, 1, 1)
    return fig, ax

# ---------- Gambar: neraca air toren ----------
fig, ax = setup(8.2, 4.9, (0, 12.6), (0, 7.3))
ax.add_patch(FancyBboxPatch((4.6, 1.6), 2.8, 3.6, boxstyle="round,pad=0,rounding_size=0.35", fc="none", ec=GRAY, lw=1.4))
ax.add_patch(Rectangle((4.65, 1.65), 2.7, 2.0, fc=WATER, ec="none"))
ax.plot([4.65, 7.35], [3.65, 3.65], color=BLUE, lw=1.5)
ax.text(6.0, 5.55, "Toren 2.000 L", ha="center", va="center", fontsize=11, fontweight="bold", color=INK)
# sensor level di nipel bawah
ax.add_patch(FancyBboxPatch((7.45, 1.75), 0.55, 0.3, boxstyle="round,pad=0,rounding_size=0.12", fc=TEAL_F, ec=TEAL, lw=1.2))
ax.text(8.1, 1.9, "sensor level (ΔV toren)", fontsize=9.5, color=INK, va="center")
# pipa masuk dari pompa (kiri atas)
ax.plot([0.9, 4.6], [4.6, 4.6], color=DBLUE, lw=3)
ax.add_patch(FancyBboxPatch((2.2, 4.25), 1.1, 0.7, boxstyle="round,pad=0,rounding_size=0.12", fc=TEAL_F, ec=TEAL, lw=1.2))
ax.text(2.75, 4.6, "meter\nmasuk", ha="center", va="center", fontsize=8.5, color=INK)
ax.add_patch(FancyBboxPatch((0.3, 4.2), 0.9, 0.8, boxstyle="round,pad=0,rounding_size=0.12", fc=GRAY_F, ec=GRAY, lw=1))
ax.text(0.75, 4.6, "pompa\nPLN", ha="center", va="center", fontsize=8.5, color=INK)
arrow(ax, (3.5, 4.6), (4.5, 4.6), DBLUE, 2)
ax.text(2.75, 5.3, "V masuk", ha="center", fontsize=10.5, fontweight="bold", color=INK)
# pipa keluar ke warga (kanan bawah)
ax.plot([7.4, 11.2], [2.4, 2.4], color=DBLUE, lw=3)
ax.add_patch(FancyBboxPatch((8.6, 2.05), 1.1, 0.7, boxstyle="round,pad=0,rounding_size=0.12", fc=TEAL_F, ec=TEAL, lw=1.2))
ax.text(9.15, 2.4, "meter\nkeluar", ha="center", va="center", fontsize=8.5, color=INK)
arrow(ax, (10.3, 2.4), (11.1, 2.4), DBLUE, 2)
ax.text(11.55, 2.4, "warga", fontsize=9.5, color=INK, va="center")
ax.text(9.15, 3.05, "V keluar", ha="center", fontsize=10.5, fontweight="bold", color=INK)
# rumus
ax.add_patch(FancyBboxPatch((1.2, 0.3), 9.6, 0.8, boxstyle="round,pad=0,rounding_size=0.2", fc=AMBER_F, ec=AMBER, lw=1.2))
ax.text(6.0, 0.7, "V masuk  −  V keluar  −  ΔV toren  =  selisih   (bocor, luber, atau meteran bermasalah)", ha="center", va="center", fontsize=10.5, fontweight="bold", color=INK)
ax.text(6.3, 6.6, "Tiga titik ukur per toren menutup neraca air harian", ha="center", fontsize=11.5, fontweight="bold", color=INK)
fig.savefig("neraca_air.png"); plt.close(fig)

# ---------- Gambar: arsitektur 4 lapisan (3 titik ukur, PLN, 4G) ----------
fig, ax = setup(8.2, 8.6, (0, 12), (0, 12.6))
layers = [
    ("Lapisan perangkat (rumah pompa, tiap desa)", [("Meter masuk + keluar", "pulsa reed, 10 L/pulsa"), ("Sensor level toren", "tekanan 4–20 mA"), ("ESP32 + microSD", "adaptor PLN, aki cadangan")], TEAL_F, TEAL),
    ("Lapisan jaringan", [("4G LTE (SIM7600)", "kartu IM3, MQTT TLS"), ("WiFi", "cadangan bila ada"), ("LoRa", "tidak dipakai")], GRAY_F, GRAY),
    ("Lapisan server (cloud)", [("Broker MQTT", "HiveMQ Cloud"), ("Backend + neraca air", "Node.js, 10 alarm"), ("Database", "Supabase, 5 node")], PURPLE_F, PURPLE),
    ("Lapisan pengguna", [("Dashboard web", "per toren, Grafana"), ("Ponsel pengelola", "ringkasan harian"), ("Notifikasi", "Telegram grup 5 desa")], CORAL_F, CORAL),
]
top = 12.0; LH = 2.6; gap = 0.5; xs = [2.2, 6.0, 9.8]
for i, (name, items, fc, ec) in enumerate(layers):
    y0 = top - i * (LH + gap)
    ax.add_patch(Rectangle((0.3, y0 - LH), 11.4, LH, fc="none", ec=GRAY, lw=1, ls=(0, (4, 3))))
    ax.text(0.55, y0 - 0.35, name, fontsize=10.5, fontweight="bold", color=INK, va="center")
    cy = y0 - LH + 1.0
    for j, (t, s) in enumerate(items):
        main = (i == 1 and j == 0)
        box(ax, xs[j], cy, 3.4, 1.25, t, s, fc=(AMBER_F if main else fc), ec=(AMBER if main else ec))
        if i in (0, 2) and j < 2: arrow(ax, (xs[j] + 1.7, cy), (xs[j+1] - 1.7, cy))
    if i < 3: arrow(ax, (6.0, y0 - LH), (6.0, y0 - LH - gap))
fig.savefig("arsitektur.png"); plt.close(fig)

# ---------- Gambar: blok diagram ----------
fig, ax = setup(8.2, 7.4, (0, 12), (0, 10.9))
W, H = 2.55, 1.15
box(ax, 1.7, 10.1, W, H, "Adaptor PLN 12 V", "aki 7 Ah cadangan", fc=AMBER_F, ec=AMBER)
elbow(ax, [(1.7, 10.1 - H/2), (1.7, 9.4), (7.9, 9.4), (7.9, 8.1 + H/2)])
ax.add_patch(Rectangle((0.3, 6.4), 11.4, 2.5, fc="none", ec=GRAY, lw=1, ls=(0, (4, 3))))
ax.text(0.55, 6.55, "Node di rumah pompa", fontsize=9.5, color=GRAY, va="center")
box(ax, 1.7, 8.1, W, H, "Meter masuk", "reed, GPIO 26")
box(ax, 4.5, 8.1, W, H, "Meter keluar", "reed, GPIO 27")
box(ax, 7.3, 8.1, W, H, "ESP32", "hitung, buffer microSD")
box(ax, 10.1, 8.1, W, H, "Modul 4G SIM7600", "IM3, MQTT TLS")
box(ax, 4.5, 6.95, W, 0.9, "Sensor level 4–20 mA", "shunt 150 Ω, GPIO 35", fs=9.5)
elbow(ax, [(1.7 + W/2, 8.1), (3.05, 8.1), (3.05, 8.95), (6.7, 8.95), (6.7, 8.1 + H/2)])
arrow(ax, (4.5 + W/2, 8.1), (7.3 - W/2, 8.1))
elbow(ax, [(4.5 + W/2, 6.95), (6.4, 6.95), (6.4, 7.75), (7.3 - W/2, 7.75)])
arrow(ax, (7.3 + W/2, 8.1), (10.1 - W/2, 8.1))
ax.add_patch(Rectangle((5.75, 0.3), 5.95, 5.6, fc="none", ec=GRAY, lw=1, ls=(0, (4, 3))))
ax.text(6.0, 5.65, "Cloud dan pengguna", fontsize=9.5, color=GRAY, va="center")
arrow(ax, (10.1, 8.1 - H/2), (10.1, 4.9 + H/2))
box(ax, 10.1, 4.9, W, H, "Internet", "jaringan seluler 4G", fc=GRAY_F, ec=GRAY)
arrow(ax, (10.1, 4.9 - H/2), (10.1, 3.1 + H/2))
box(ax, 10.1, 3.1, W, H, "Server", "MQTT, database, neraca", fc=PURPLE_F, ec=PURPLE)
box(ax, 7.3, 3.1, W, H, "Dashboard", "per toren, 5 desa", fc=CORAL_F, ec=CORAL)
arrow(ax, (10.1 - W/2, 3.1), (7.3 + W/2, 3.1))
box(ax, 7.3, 1.2, W, H, "Notifikasi", "Telegram", fc=CORAL_F, ec=CORAL)
elbow(ax, [(10.1, 3.1 - H/2), (10.1, 1.2), (7.3 + W/2, 1.2)])
fig.savefig("blok_diagram.png"); plt.close(fig)
print("ok")
