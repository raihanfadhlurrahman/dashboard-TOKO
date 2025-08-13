create table public.menu (
  id uuid not null default gen_random_uuid (),
  nama text not null,
  harga integer not null,
  toko_id uuid not null,
  created_at timestamp with time zone null default now(),
  kategori_id uuid null,
  constraint menu_pkey primary key (id),
  constraint menu_kategori_id_fkey foreign KEY (kategori_id) references kategori (id) on delete set null,
  constraint menu_toko_id_fkey foreign KEY (toko_id) references toko (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists menu_toko_id_idx on public.menu using btree (toko_id) TABLESPACE pg_default;

create table public.toko (
  id uuid not null default gen_random_uuid (),
  nama_toko text null,
  created_at timestamp with time zone null default now(),
  ai_prompt_preset text null,
  ai_prompt_custom text null,
  social_media text null,
  whatsapp_number text null,
  constraint toko_pkey primary key (id)
) TABLESPACE pg_default;

create table public.transaksi (
  id uuid not null default gen_random_uuid (),
  toko_id uuid not null,
  user_id uuid not null,
  total integer not null,
  created_at timestamp with time zone null default now(),
  nama_pembeli character varying null,
  no_hp_pembeli character varying null,
  pelanggan_id uuid null,
  constraint transaksi_pkey primary key (id),
  constraint transaksi_pelanggan_id_fkey foreign KEY (pelanggan_id) references pelanggan (id) on delete set null,
  constraint transaksi_toko_id_fkey foreign KEY (toko_id) references toko (id) on delete CASCADE,
  constraint transaksi_user_id_fkey foreign KEY (user_id) references profile (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists transaksi_toko_id_idx on public.transaksi using btree (toko_id) TABLESPACE pg_default;

create index IF not exists transaksi_user_id_idx on public.transaksi using btree (user_id) TABLESPACE pg_default;

create index IF not exists transaksi_pelanggan_id_idx on public.transaksi using btree (pelanggan_id) TABLESPACE pg_default;

create table public.transaksi_detail (
  id uuid not null default gen_random_uuid (),
  transaksi_id uuid not null,
  menu_id uuid null,
  qty integer not null,
  harga_satuan integer not null,
  variasi_id uuid null,
  nama_menu text null,
  constraint transaksi_detail_pkey primary key (id),
  constraint transaksi_detail_menu_id_fkey foreign KEY (menu_id) references menu (id) on delete set null,
  constraint transaksi_detail_transaksi_id_fkey foreign KEY (transaksi_id) references transaksi (id) on delete CASCADE,
  constraint transaksi_detail_variasi_id_fkey foreign KEY (variasi_id) references menu_variasi (id)
) TABLESPACE pg_default;

create index IF not exists transaksi_detail_transaksi_id_idx on public.transaksi_detail using btree (transaksi_id) TABLESPACE pg_default;

create index IF not exists idx_transaksi_detail_variasi_id on public.transaksi_detail using btree (variasi_id) TABLESPACE pg_default;

create trigger transaksi_detail_fill_nama_menu BEFORE INSERT on transaksi_detail for EACH row
execute FUNCTION fill_nama_menu ();

