-- Skema database monitoring toren desa, Kabupaten Tuban (PostgreSQL / Supabase)

create table if not exists node (
  id            text primary key,          -- "tuban-mander"
  nama          text not null,
  desa          text, kecamatan text, kabupaten text default 'Tuban',
  toren_l       numeric default 2000,      -- kapasitas toren
  dn_masuk      integer, dn_keluar integer,
  lpp_masuk     numeric default 10,        -- liter per pulsa meter masuk
  lpp_keluar    numeric default 10,
  dibuat        timestamptz default now()
);

create table if not exists bacaan (
  id        bigserial primary key,
  node_id   text not null references node(id),
  ts        timestamptz not null,
  diterima  timestamptz not null default now(),
  vol_l     numeric not null,              -- keluar ke warga, liter dalam interval
  kum_l     numeric not null,
  q_lpm     numeric not null,
  vol_in_l  numeric default 0,             -- masuk dari pompa, liter dalam interval
  kum_in_l  numeric,
  q_in_lpm  numeric default 0,
  level_cm  numeric,                       -- -1 bila sensor putus
  toren_l   numeric,                       -- isi toren hasil konversi level
  pompa     boolean default false,
  v_aki     numeric,
  rssi      integer,
  unique (node_id, ts)
);
create index if not exists bacaan_node_ts on bacaan (node_id, ts desc);

create table if not exists peringatan (
  id        bigserial primary key,
  node_id   text not null references node(id),
  jenis     text not null,  -- aliran_malam | lonjakan_harian | aliran_nol | aki_rendah | offline
                            -- neraca_harian | toren_bocor | luber | pompa_tanpa_hasil | sensor_level
  pesan     text not null,
  nilai     numeric,
  ts        timestamptz not null default now(),
  selesai   timestamptz
);
create index if not exists peringatan_aktif on peringatan (node_id, jenis) where selesai is null;

-- Rekap per jam (WIB)
create or replace view rekap_jam as
select node_id,
       date_trunc('hour', ts at time zone 'Asia/Jakarta') as jam,
       sum(vol_l)    as vol_l,
       sum(vol_in_l) as vol_in_l,
       avg(q_lpm)    as q_lpm_rata,
       max(q_lpm)    as q_lpm_maks,
       avg(toren_l)  as toren_l
from bacaan group by 1, 2;

-- Rekap harian (WIB)
create or replace view rekap_hari as
select node_id,
       (ts at time zone 'Asia/Jakarta')::date as tanggal,
       sum(vol_l)                 as vol_l,
       sum(vol_l) / 1000.0        as vol_m3,
       sum(vol_in_l) / 1000.0     as vol_in_m3,
       max(q_lpm)                 as q_lpm_puncak,
       count(*) filter (where pompa) * 0.25 as jam_pompa,   -- paket 15 menit
       min(v_aki)                 as v_aki_min,
       count(*)                   as jumlah_paket
from bacaan group by 1, 2;

-- Neraca air harian: masuk - keluar - perubahan isi toren = selisih
create or replace view neraca_hari as
with h as (
  select node_id, (ts at time zone 'Asia/Jakarta')::date as tanggal,
         sum(vol_in_l) as masuk_l, sum(vol_l) as keluar_l,
         (array_agg(toren_l order by ts))[1]                      as toren_awal_l,
         (array_agg(toren_l order by ts desc))[1]                 as toren_akhir_l
  from bacaan where toren_l is not null and toren_l >= 0
  group by 1, 2)
select *,
       masuk_l - keluar_l - (toren_akhir_l - toren_awal_l)                        as selisih_l,
       case when masuk_l > 0 then (masuk_l - keluar_l - (toren_akhir_l - toren_awal_l)) / masuk_l * 100 end as selisih_persen
from h;

-- Uji malam (01.00 sampai 04.00 WIB): pompa mati dan tidak ada aliran keluar, level seharusnya datar
create or replace view uji_malam as
select node_id, (ts at time zone 'Asia/Jakarta')::date as tanggal,
       max(toren_l) - min(toren_l) as turun_l,
       sum(vol_l) as keluar_l, bool_or(pompa) as pompa_hidup,
       avg(q_lpm) as q_lpm_malam
from bacaan
where extract(hour from ts at time zone 'Asia/Jakarta') between 1 and 3
group by 1, 2;

insert into node (id, nama, desa, kecamatan, dn_masuk, dn_keluar) values
  ('tuban-mander',   'Toren Mander',       'Mander',       'Tambakboyo', 20, 40),
  ('tuban-bader',    'Toren Bader',        'Bader',        'Jatirogo',   25, 40),
  ('tuban-tuwiri',   'Toren Tuwiri Kulon', 'Tuwiri Kulon', 'Merakurak',  25, 15),
  ('tuban-kabluan',  'Toren Kabluan',      'Kabluan',      'Bangilan',   20, 40),
  ('tuban-ngulahan', 'Toren Ngulahan',     'Ngulahan',     'Tambakboyo', 25, 40)
on conflict (id) do nothing;
