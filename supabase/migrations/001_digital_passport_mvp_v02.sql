-- Digital Passport MVP v0.2: run once in a NEW Supabase project, SQL Editor.
-- Schema foundation: verification, scoring and estimation RPCs are future migrations.
-- No comparison table; comparison lives in frontend state.
-- Six public tables; no production payments; no destructive reset.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id),
  full_name text not null default '',
  avatar_url text,
  phone text,
  role text not null default 'user' check (role in ('user','mitra')),
  created_at timestamptz not null default now()
);
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id),
  passport_code text not null unique default ('DSP-' || gen_random_uuid()::text),
  category text not null check (category in ('smartphone','laptop')),
  brand text not null check (btrim(brand) <> ''),
  model text not null check (btrim(model) <> ''),
  variant text,
  serial_number text,
  imei text check (imei is null or imei ~ '^[0-9]{15}$'),
  specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications) = 'object'),
  purchase_date date,
  purchase_price numeric(14,0) check (purchase_price >= 0),
  battery_health integer check (battery_health between 0 and 100),
  physical_condition text not null default 'unknown' check (physical_condition in ('unknown','like_new','light_wear','damaged')),
  photo_url text,
  lock_status text not null default 'unknown' check (lock_status in ('unknown','claimed_unlocked','claimed_locked')),
  trust_score integer not null default 0 check (trust_score between 0 and 100),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (nullif(btrim(serial_number),'') is not null or imei is not null)
);
create unique index devices_serial_unique on public.devices (lower(btrim(brand)), upper(btrim(serial_number))) where nullif(btrim(serial_number),'') is not null;
create unique index devices_imei_unique on public.devices (imei) where imei is not null;
create index devices_owner_idx on public.devices(owner_id);

create table public.history_records (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id),
  created_by uuid not null default auth.uid() references public.profiles(id),
  type text not null check (type in ('purchase','service','part_replacement','battery','damage','condition','transfer')),
  title text not null check (btrim(title) <> ''),
  description text not null default '',
  event_date date not null default current_date,
  evidence_url text, -- private Storage object path, never a public URL
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  level smallint not null default 1 check (level between 1 and 3),
  part_original boolean,
  verification_status text not null default 'not_requested' check (verification_status in ('not_requested','pending','verified','rejected')),
  verifier_id uuid references public.profiles(id),
  verification_note text,
  requested_at timestamptz,
  verified_at timestamptz,
  is_public boolean not null default false, -- opt in to publishing non-sensitive title/description only
  created_at timestamptz not null default now(),
  check (level = 1 or evidence_url is not null),
  check ((level = 3) = (verification_status = 'verified')),
  check (verification_status = 'not_requested' or (requested_at is not null and verifier_id is not null and evidence_url is not null)),
  check (verification_status <> 'verified' or verified_at is not null),
  check (verification_status <> 'rejected' or nullif(btrim(verification_note),'') is not null),
  check (verifier_id is null or verifier_id <> created_by)
);
create index histories_verifier_idx on public.history_records(verifier_id, verification_status);
create index histories_device_idx on public.history_records(device_id, event_date desc);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id),
  seller_id uuid not null references public.profiles(id),
  title text not null check (btrim(title) <> ''),
  description text not null default '',
  price numeric(14,0) not null check (price > 0),
  estimated_min numeric(14,0),
  estimated_max numeric(14,0),
  estimated_base_price numeric(14,0) check (estimated_base_price > 0),
  passport_premium numeric(14,0) check (passport_premium >= 0),
  ai_explanation jsonb check (jsonb_typeof(ai_explanation) = 'object'),
  price_label text generated always as (case when estimated_min is null or estimated_max is null then null when price < estimated_min then 'cheap' when price > estimated_max then 'expensive' else 'fair' end) stored,
  estimated_at timestamptz,
  estimation_snapshot jsonb check (jsonb_typeof(estimation_snapshot) = 'object'),
  photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array'),
  status text not null default 'active' check (status in ('active','sold','withdrawn')),
  created_at timestamptz not null default now(),
  check ((estimated_min is null and estimated_max is null) or (estimated_min is not null and estimated_max is not null and estimated_min > 0 and estimated_max >= estimated_min))
);
create unique index listings_one_active on public.listings(device_id) where status = 'active';
create index listings_seller_idx on public.listings(seller_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  buyer_id uuid not null references public.profiles(id),
  seller_id uuid not null references public.profiles(id),
  total_price numeric(14,0) not null check (total_price > 0),
  listing_snapshot jsonb not null,
  status text not null default 'completed' check (status = 'completed'),
  is_simulation boolean not null default true check (is_simulation),
  created_at timestamptz not null default now(),
  completed_at timestamptz not null default now(),
  unique (listing_id),
  check (buyer_id <> seller_id)
);
create index transactions_buyer_idx on public.transactions(buyer_id);
create index transactions_seller_idx on public.transactions(seller_id);

create table public.market_prices (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('smartphone','laptop')),
  brand text not null, model text not null, variant text not null default '',
  retail_price numeric(14,0) check (retail_price > 0),
  used_price_1y numeric(14,0) check (used_price_1y > 0),
  used_price_2y numeric(14,0) check (used_price_2y > 0),
  used_price_3y numeric(14,0) check (used_price_3y > 0),
  source text not null,
  is_demo boolean not null default true,
  updated_at timestamptz not null default now()
);
create unique index market_prices_model_unique on public.market_prices(category,lower(btrim(brand)),lower(btrim(model)),lower(btrim(variant)));

-- Create an app profile for new and already existing Auth users.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
insert into public.profiles(id,full_name) select id,coalesce(raw_user_meta_data->>'full_name','') from auth.users on conflict(id) do nothing;

-- RLS is row-level; column grants also protect ownership and system fields.
alter table public.profiles enable row level security;
alter table public.devices enable row level security;
alter table public.history_records enable row level security;
alter table public.listings enable row level security;
alter table public.transactions enable row level security;
alter table public.market_prices enable row level security;
revoke all on public.profiles,public.devices,public.history_records,public.listings,public.transactions,public.market_prices from public,anon,authenticated;
grant select on public.profiles,public.devices,public.history_records,public.listings,public.transactions to authenticated;
grant select on public.market_prices to anon,authenticated;
grant update(full_name,avatar_url,phone) on public.profiles to authenticated;
grant insert(category,brand,model,variant,serial_number,imei,specifications,purchase_date,purchase_price,battery_health,physical_condition,photo_url,lock_status) on public.devices to authenticated;
grant update(variant,specifications,purchase_date,purchase_price,battery_health,physical_condition,photo_url,lock_status) on public.devices to authenticated;
grant insert(device_id,type,title,description,event_date,evidence_url,details,is_public,part_original) on public.history_records to authenticated;

create policy profile_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profile_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy devices_read_own on public.devices for select to authenticated using (owner_id = (select auth.uid()));
create policy devices_insert_own on public.devices for insert to authenticated with check (owner_id = (select auth.uid()));
create policy devices_update_own on public.devices for update to authenticated using (owner_id = (select auth.uid()) and not exists (select 1 from public.listings l where l.device_id = devices.id and l.status = 'active')) with check (owner_id = (select auth.uid()));
create policy histories_read_own on public.history_records for select to authenticated using (exists (select 1 from public.devices d where d.id = history_records.device_id and d.owner_id = (select auth.uid())));
create policy histories_insert_own on public.history_records for insert to authenticated with check (created_by = (select auth.uid()) and type <> 'transfer' and exists (select 1 from public.devices d where d.id = history_records.device_id and d.owner_id = (select auth.uid())) and not exists (select 1 from public.listings l where l.device_id = history_records.device_id and l.status = 'active') and (evidence_url is null or split_part(evidence_url,'/',1) = (select auth.uid())::text));
create policy listings_read_seller on public.listings for select to authenticated using (seller_id = (select auth.uid()));
create policy transactions_read_parties on public.transactions for select to authenticated using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()));
create policy market_prices_read on public.market_prices for select to anon,authenticated using (true);

-- Marketplace exposes only explicitly selected fields, never full IMEI/serial,
-- owner contact, purchase price, evidence path, private history, or raw specs JSON.
create function public.marketplace_feed(p_listing_id uuid default null)
returns table(listing_id uuid, device_id uuid, title text, description text, price numeric, estimated_min numeric, estimated_max numeric, photos jsonb, passport jsonb, histories jsonb, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.id,d.id,l.title,l.description,l.price,l.estimated_min,l.estimated_max,l.photos,
    jsonb_build_object('passport_code',d.passport_code,'category',d.category,'brand',d.brand,'model',d.model,'variant',d.variant,'battery_health',d.battery_health,'physical_condition',d.physical_condition,'trust_score',d.trust_score,'lock_status',d.lock_status,'photo_url',d.photo_url,'specifications',jsonb_strip_nulls(jsonb_build_object('storage',d.specifications->>'storage','ram',d.specifications->>'ram','cpu',d.specifications->>'cpu','gpu',d.specifications->>'gpu','os',d.specifications->>'os')),'source','owner_reported','verification_is_demo',true,'price_label',l.price_label,'passport_premium',l.passport_premium,'ai_explanation',l.ai_explanation),
    coalesce((select jsonb_agg(jsonb_build_object('type',h.type,'title',h.title,'description',h.description,'event_date',h.event_date,'evidence_reported',h.evidence_url is not null,'level',case when h.type='transfer' then null else h.level end,'verification_simulated',h.level=3,'source',case when h.type='transfer' then 'system_simulation' else 'owner_reported' end) order by h.event_date desc,h.created_at desc) from public.history_records h where h.device_id=d.id and h.is_public),'[]'::jsonb),l.created_at
  from public.listings l join public.devices d on d.id=l.device_id
  where l.status='active' and (p_listing_id is null or l.id=p_listing_id)
  order by l.created_at desc;
$$;

-- Lock the device for all listing/purchase operations; only its current owner can publish.
create function public.publish_listing(p_device_id uuid,p_title text,p_price numeric,p_description text default '',p_photos jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select owner_id into v_owner from public.devices where id=p_device_id for update;
  if not found or v_owner is distinct from auth.uid() then raise exception 'Device unavailable'; end if;
  insert into public.listings(device_id,seller_id,title,price,description,photos) values(p_device_id,auth.uid(),p_title,p_price,p_description,p_photos) returning id into v_id;
  return v_id;
end; $$;

create function public.withdraw_listing(p_listing_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_device uuid; v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select device_id into v_device from public.listings where id=p_listing_id;
  if not found then raise exception 'Listing unavailable'; end if;
  select owner_id into v_owner from public.devices where id=v_device for update;
  if v_owner is distinct from auth.uid() then raise exception 'Listing unavailable'; end if;
  update public.listings set status='withdrawn' where id=p_listing_id and seller_id=auth.uid() and status='active';
  if not found then raise exception 'Listing unavailable'; end if;
end; $$;

-- Entire simulated purchase is atomic. No money is charged or held.
create function public.buy_listing(p_listing_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_device uuid; v_owner uuid; v_listing public.listings%rowtype; v_id uuid; v_snapshot jsonb;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select device_id into v_device from public.listings where id=p_listing_id;
  if not found then raise exception 'Listing unavailable'; end if;
  select owner_id into v_owner from public.devices where id=v_device for update;
  select * into v_listing from public.listings where id=p_listing_id for update;
  if v_listing.status <> 'active' then
    select id into v_id from public.transactions where listing_id=p_listing_id and buyer_id=auth.uid();
    if found then return v_id; end if;
    raise exception 'Listing unavailable';
  end if;
  if v_owner is distinct from v_listing.seller_id or v_owner=auth.uid() then raise exception 'Purchase not allowed'; end if;
  select to_jsonb(m) into v_snapshot from public.marketplace_feed(p_listing_id) m;
  insert into public.transactions(listing_id,buyer_id,seller_id,total_price,listing_snapshot) values(p_listing_id,auth.uid(),v_listing.seller_id,v_listing.price,v_snapshot) returning id into v_id;
  update public.listings set status='sold' where id=p_listing_id;
  update public.devices set owner_id=auth.uid() where id=v_device;
  insert into public.history_records(device_id,created_by,type,title,description,is_public) values(v_device,auth.uid(),'transfer','Transfer kepemilikan (simulasi)','Paspor berpindah melalui pembelian simulasi.',true);
  return v_id;
end; $$;

revoke all on function public.handle_new_user(),public.marketplace_feed(uuid),public.publish_listing(uuid,text,numeric,text,jsonb),public.withdraw_listing(uuid),public.buy_listing(uuid) from public,anon,authenticated;
grant execute on function public.marketplace_feed(uuid) to anon,authenticated;
grant execute on function public.publish_listing(uuid,text,numeric,text,jsonb),public.withdraw_listing(uuid),public.buy_listing(uuid) to authenticated;

-- Private evidence bucket: path <uploader UUID>/<random filename>.
-- Evidence originals stay with their uploader even after passport transfer.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('device-evidence','device-evidence',false,5242880,array['image/jpeg','image/png']) on conflict(id) do nothing;
create policy evidence_upload_own on storage.objects for insert to authenticated with check (bucket_id='device-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy evidence_read_own on storage.objects for select to authenticated using (bucket_id='device-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
-- Separate public bucket: only non-sensitive product images deliberately published.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('product-photos','product-photos',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy product_photo_upload_own on storage.objects for insert to authenticated with check (bucket_id='product-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- Serialize history creation with publish/purchase, including concurrent requests.
create function public.guard_history_insert() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_owner uuid;
begin
  if new.type = 'transfer' then return new; end if; -- only trusted RPC can insert this type (RLS)
  select owner_id into v_owner from public.devices where id=new.device_id for update;
  if not found or v_owner is distinct from new.created_by then raise exception 'Device unavailable'; end if;
  if exists (select 1 from public.listings where device_id=new.device_id and status='active') then raise exception 'Withdraw listing before changing history'; end if;
  if new.evidence_url is not null and not exists (select 1 from storage.objects where bucket_id='device-evidence' and name=new.evidence_url and split_part(name,'/',1)=new.created_by::text) then raise exception 'Evidence object unavailable'; end if;
  new.level := case when new.evidence_url is null then 1 else 2 end;
  return new;
end; $$;
create trigger guard_history_insert before insert on public.history_records for each row execute function public.guard_history_insert();
create function public.guard_device_update() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if new.owner_id is distinct from old.owner_id then return new; end if; -- owner_id not writable by clients
  if exists (select 1 from public.listings where device_id=old.id and status='active') then raise exception 'Withdraw listing before editing device'; end if;
  return new;
end; $$;
create trigger guard_device_update before update on public.devices for each row execute function public.guard_device_update();
revoke all on function public.guard_history_insert(),public.guard_device_update() from public,anon,authenticated;

-- Role assignment: run separately in SQL Editor after creating the demo account.
-- update public.profiles set role='mitra' where id='YOUR_AUTH_USER_UUID';
-- Only trusted SQL/admin may assign role. Never accept role from signup metadata.
-- Next migration: verification request/review RPCs, scoped evidence policy,
-- score calculation, pricing function and QR/public passport endpoint.
-- Until then, trust_score stays at 0 and price estimates remain NULL.
commit;
