import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Rectangle, FancyBboxPatch, FancyArrowPatch
import numpy as np

INK="#2C2C2A"; GRAY="#5F5E5A"; BLUE="#378ADD"; DBLUE="#185FA5"
fig, ax = plt.subplots(figsize=(8.2, 5.8), dpi=200)
ax.set_xlim(0, 680); ax.set_ylim(480, 0); ax.axis("off"); fig.subplots_adjust(0,0,1,1)

def arrow(p1, p2, c=BLUE, lw=1.5):
    ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=12, lw=lw, color=c))
def leader(p1, p2):
    ax.plot([p1[0], p2[0]], [p1[1], p2[1]], color=GRAY, lw=0.6, ls=(0,(3,3)))

ax.add_patch(Rectangle((40,330),380,70, fc="#B5D4F4", ec=GRAY, lw=1))
ax.add_patch(Circle((230,330),64, fc="#D9ECFB", ec=GRAY, lw=1))
ax.add_patch(Circle((230,330),46, fc="none", ec="#888780", lw=0.8, ls=(0,(3,3))))
for p1,p2 in [((272,298),(252,310)),((282,340),(262,336)),((256,384),(246,366)),((188,362),(208,350)),((178,320),(198,324)),((204,276),(214,294))]:
    arrow(p1,p2)
for ang in range(0,360,60):
    a=np.deg2rad(ang); ax.plot([230,230+36*np.cos(a)],[330,330+36*np.sin(a)],color=GRAY,lw=2.5,solid_capstyle="round")
ax.add_patch(Circle((230,330),6, fc=GRAY))
arrow((60,365),(110,365),DBLUE,2); arrow((350,365),(400,365),DBLUE,2)
ax.add_patch(Rectangle((150,238),160,10, fc="#B4B2A9", ec=GRAY, lw=0.8))
ax.add_patch(Rectangle((222,252),16,12, fc="#E24B4A")); ax.add_patch(Rectangle((222,222),16,12, fc="#E24B4A"))
ax.plot([230,230],[264,294],color=GRAY,lw=2)
ax.add_patch(FancyBboxPatch((150,96),160,142, boxstyle="round,pad=0,rounding_size=8", fc="#F1EFE8", ec=GRAY, lw=1))
ax.plot([230,230],[222,186],color=GRAY,lw=2); ax.add_patch(Rectangle((222,222),16,12, fc="#E24B4A"))
for c,r in [((230,186),12),((200,168),16),((262,168),16)]:
    ax.add_patch(Circle(c,r, fc="#D3D1C7", ec=GRAY, lw=0.8))
ax.add_patch(Rectangle((268,162),10,8, fc="#E24B4A"))
ax.add_patch(FancyBboxPatch((282,160),34,12, boxstyle="round,pad=0,rounding_size=6", fc="#E1F5EE", ec="#0F6E56", lw=1.2))
ax.plot([316,348],[166,166],color="#0F6E56",lw=1.5)
ax.add_patch(FancyBboxPatch((164,108),132,30, boxstyle="round,pad=0,rounding_size=4", fc="#FBFBF8", ec=GRAY, lw=0.8))
ax.text(230,124,"0 0 1 2 3 4",ha="center",va="center",fontsize=10.5,fontweight="bold",color=INK)
labels=[((296,123),(396,110),["Register kering, tera ISO 4064 kelas B"]),
        ((348,166),(396,160),["Reed switch + magnet pada roda angka,","menutup kontak tiap 10 liter"]),
        ((238,243),(396,226),["Kopling magnet melewati pelat pemisah;","air tidak masuk ke register"]),
        ((294,330),(396,296),["Beberapa nozel tangensial (multi-jet)","memutar rotor dari banyak arah"]),
        ((246,376),(396,430),["Rotor berputar sebanding volume air"]),
        ((330,400),(396,456),["Pipa 1,5 inci (DN40), air masuk dari kiri"])]
for p1,p2,lines in labels:
    leader(p1,p2)
    for i,l in enumerate(lines):
        ax.text(402,p2[1]+4+i*16,l,fontsize=8.5,color=INK,va="center")
ax.text(40,440,"bodi kuningan; bagian basah di bawah pelat pemisah",ha="left",va="center",fontsize=8.5,color=GRAY,style="italic")
fig.savefig("water_meter_potongan.png"); print("ok")
