-- Migration 003: Verification Lifecycle, Authorized Storage, Safe Public Passport, and Authoritative Trust Score.
-- Non-destructive: preserves all existing tables and data.
-- Pre-requisite: 001_digital_passport_mvp_v02.sql and 002_c2c_role_guards.sql.

begin;

-- Ensure is_mitra helper is present (defined in 002)
create or replace function public.is_mitra()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'mitra'
  );
$$;

--------------------------------------------------------------------------------
-- 1. HISTORY RECORD CONSTRAINTS REFINEMENT
--------------------------------------------------------------------------------
-- Remove legacy unnamed constraint requiring verifier_id when status != 'not_requested'.
-- In the refined lifecycle:
-- - 'not_requested': verified_at and verifier_id are null.
-- - 'pending': requested_at and evidence_url are required; verifier_id is null until reviewed.
-- - 'verified' / 'rejected': verifier_id, verified_at, requested_at, and evidence_url are required.
do $$
declare r record;
begin
  for r in (
    select conname
    from pg_constraint
    where conrelid = 'public.history_records'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%verifier_id is not null%'
  ) loop
    execute 'alter table public.history_records drop constraint ' || quote_ident(r.conname);
  end loop;
end $$;

alter table public.history_records add constraint history_records_verification_check
  check (
    (verification_status = 'not_requested' and verified_at is null)
    or (verification_status = 'pending' and requested_at is not null and evidence_url is not null and verified_at is null)
    or (verification_status in ('verified','rejected') and requested_at is not null and verifier_id is not null and verified_at is not null and evidence_url is not null)
  );

--------------------------------------------------------------------------------
-- 2. VERIFICATION LIFECYCLE RPCS
--------------------------------------------------------------------------------

-- Request verification: owner requests Mitra review on a documented record (level >= 2).
create or replace function public.request_verification(p_history_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_record public.history_records%rowtype;
  v_device public.devices%rowtype;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if public.is_mitra() then raise exception 'Mitra accounts cannot request verification'; end if;

  select * into v_record from public.history_records where id = p_history_id for update;
  if not found then raise exception 'History record not found'; end if;

  select * into v_device from public.devices where id = v_record.device_id for update;
  if not found or v_device.owner_id is distinct from auth.uid() then
    raise exception 'Device unavailable or not owned by caller';
  end if;

  if exists (select 1 from public.listings where device_id = v_device.id and status = 'active') then
    raise exception 'Withdraw listing before requesting verification';
  end if;

  if v_record.evidence_url is null or btrim(v_record.evidence_url) = '' then
    raise exception 'Cannot request verification without evidence attachment';
  end if;

  if v_record.verification_status = 'verified' or v_record.level = 3 then
    raise exception 'Record is already verified and immutable';
  end if;

  if v_record.verification_status = 'pending' then
    raise exception 'Verification request is already pending';
  end if;

  update public.history_records
  set verification_status = 'pending',
      requested_at = now(),
      verifier_id = null,
      verified_at = null,
      verification_note = null
  where id = p_history_id;
end; $$;

-- Pending queue: only Mitra accounts can query pending verification requests.
create or replace function public.pending_verifications()
returns table (
  record_id uuid,
  device_id uuid,
  device_model text,
  device_brand text,
  device_category text,
  passport_code text,
  serial_number text,
  imei text,
  record_type text,
  record_title text,
  record_description text,
  event_date date,
  evidence_url text,
  requested_at timestamptz,
  owner_id uuid,
  created_by uuid
)
language sql stable security definer set search_path = '' as $$
  select
    h.id as record_id,
    d.id as device_id,
    d.model as device_model,
    d.brand as device_brand,
    d.category as device_category,
    d.passport_code as passport_code,
    d.serial_number as serial_number,
    d.imei as imei,
    h.type as record_type,
    h.title as record_title,
    h.description as record_description,
    h.event_date as event_date,
    h.evidence_url as evidence_url,
    h.requested_at as requested_at,
    d.owner_id as owner_id,
    h.created_by as created_by
  from public.history_records h
  join public.devices d on d.id = h.device_id
  where public.is_mitra()
    and h.verification_status = 'pending'
    and d.owner_id = h.created_by -- Exclude stale requests where ownership transferred
    and h.created_by <> auth.uid() -- Prevent self-verification queue pollution
  order by h.requested_at asc;
$$;

-- Review verification: Mitra approves (L3) or rejects with mandatory note.
create or replace function public.review_verification(
  p_history_id uuid,
  p_approve boolean,
  p_note text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_record public.history_records%rowtype;
  v_device public.devices%rowtype;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if not public.is_mitra() then raise exception 'Only Mitra accounts can review verification'; end if;

  select * into v_record from public.history_records where id = p_history_id for update;
  if not found then raise exception 'History record not found'; end if;

  select * into v_device from public.devices where id = v_record.device_id for update;
  if not found then raise exception 'Associated device not found'; end if;

  -- Invariant: prevent self-verification
  if v_record.created_by = auth.uid() then
    raise exception 'Self-verification not allowed';
  end if;

  -- Invariant: prevent reviewing stale records after ownership transfer
  if v_device.owner_id is distinct from v_record.created_by then
    raise exception 'Device ownership has transferred; pending verification invalidated';
  end if;

  if v_record.verification_status <> 'pending' then
    raise exception 'Record is not currently pending verification';
  end if;

  if not p_approve and (p_note is null or btrim(p_note) = '') then
    raise exception 'Rejection note required';
  end if;

  if p_approve then
    update public.history_records
    set verification_status = 'verified',
        level = 3,
        verifier_id = auth.uid(),
        verified_at = now(),
        verification_note = p_note
    where id = p_history_id;
  else
    update public.history_records
    set verification_status = 'rejected',
        level = case when evidence_url is not null then 2 else 1 end,
        verifier_id = auth.uid(),
        verified_at = now(),
        verification_note = p_note
    where id = p_history_id;
  end if;
end; $$;

--------------------------------------------------------------------------------
-- 3. INVALIDATE STALE PENDING REQUESTS ON PURCHASE / OWNERSHIP TRANSFER
--------------------------------------------------------------------------------
-- Re-declare buy_listing to ensure stale pending verifications are canceled atomically.
create or replace function public.buy_listing(p_listing_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_device uuid;
  v_owner uuid;
  v_listing public.listings%rowtype;
  v_id uuid;
  v_snapshot jsonb;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if public.is_mitra() then raise exception 'Mitra accounts cannot purchase'; end if;

  select device_id into v_device from public.listings where id=p_listing_id;
  if not found then raise exception 'Listing unavailable'; end if;

  select owner_id into v_owner from public.devices where id=v_device for update;
  select * into v_listing from public.listings where id=p_listing_id for update;

  if v_listing.status <> 'active' then
    select id into v_id from public.transactions where listing_id=p_listing_id and buyer_id=auth.uid();
    if found then return v_id; end if;
    raise exception 'Listing unavailable';
  end if;

  if v_owner is distinct from v_listing.seller_id or v_owner=auth.uid() then
    raise exception 'Purchase not allowed';
  end if;

  select to_jsonb(m) into v_snapshot from public.marketplace_feed(p_listing_id) m;

  insert into public.transactions(listing_id,buyer_id,seller_id,total_price,listing_snapshot)
  values(p_listing_id,auth.uid(),v_listing.seller_id,v_listing.price,v_snapshot)
  returning id into v_id;

  update public.listings set status='sold' where id=p_listing_id;
  update public.devices set owner_id=auth.uid() where id=v_device;

  -- Cancel any unreviewed pending verification requests from the previous owner
  update public.history_records
  set verification_status = 'not_requested',
      requested_at = null,
      verifier_id = null
  where device_id = v_device
    and verification_status = 'pending';

  insert into public.history_records(device_id,created_by,type,title,description,is_public)
  values(v_device,auth.uid(),'transfer','Transfer kepemilikan (simulasi)','Paspor berpindah melalui pembelian simulasi.',true);

  return v_id;
end; $$;

--------------------------------------------------------------------------------
-- 4. AUTHORIZED STORAGE RLS POLICY (SCOPED EVIDENCE ACCESS)
--------------------------------------------------------------------------------
-- Restricts evidence reading to:
-- 1. The original uploader.
-- 2. Current device owner (transferred records).
-- 3. Mitra accounts ONLY if the evidence is attached to a pending verification request
--    or a record that was reviewed by this Mitra. Mitra CANNOT access all storage arbitrarily.
drop policy if exists evidence_read_own on storage.objects;
drop policy if exists evidence_read_authorized on storage.objects;

create policy evidence_read_authorized on storage.objects for select to authenticated
using (
  bucket_id = 'device-evidence'
  and (
    -- Uploader access
    (storage.foldername(name))[1] = (select auth.uid())::text
    -- Scoped Mitra access: only objects explicitly submitted for verification or verified by caller
    or (
      public.is_mitra()
      and exists (
        select 1 from public.history_records h
        where h.evidence_url = name
          and (
            h.verification_status = 'pending'
            or h.verifier_id = (select auth.uid())
          )
      )
    )
    -- Current owner access for purchased devices
    or exists (
      select 1 from public.history_records h
      join public.devices d on d.id = h.device_id
      where h.evidence_url = name
        and d.owner_id = (select auth.uid())
    )
  )
);

--------------------------------------------------------------------------------
-- 5. PUBLIC PASSPORT RESOLUTION RPC (FOR EXTERNAL & QR SCANNERS)
--------------------------------------------------------------------------------
create or replace function public.public_passport(p_key text)
returns table (
  device_id uuid,
  passport_code text,
  category text,
  brand text,
  model text,
  variant text,
  battery_health integer,
  physical_condition text,
  lock_status text,
  trust_score integer,
  photo_url text,
  purchase_year integer,
  specifications jsonb,
  histories jsonb
)
language sql stable security definer set search_path = '' as $$
  select
    d.id as device_id,
    d.passport_code as passport_code,
    d.category as category,
    d.brand as brand,
    d.model as model,
    d.variant as variant,
    d.battery_health as battery_health,
    d.physical_condition as physical_condition,
    d.lock_status as lock_status,
    d.trust_score as trust_score,
    d.photo_url as photo_url,
    extract(year from d.purchase_date)::integer as purchase_year,
    -- Sanitize specs: strip internal and sensitive keys, never expose purchase price or location
    jsonb_strip_nulls(jsonb_build_object(
      'storage', d.specifications->>'storage',
      'ram', d.specifications->>'ram',
      'cpu', d.specifications->>'cpu',
      'gpu', d.specifications->>'gpu',
      'os', d.specifications->>'os'
    )) as specifications,
    -- Sanitize histories: never expose private evidence path or private notes
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'type', h.type,
          'title', h.title,
          'description', h.description,
          'event_date', h.event_date,
          'evidence_reported', h.evidence_url is not null,
          'level', case when h.type = 'transfer' then null else h.level end,
          'verification_simulated', h.level = 3,
          'source', case when h.type = 'transfer' then 'system_simulation' else 'owner_reported' end
        )
        order by h.event_date desc, h.created_at desc
      )
      from public.history_records h
      where h.device_id = d.id and h.is_public
    ), '[]'::jsonb) as histories
  from public.devices d
  where d.passport_code = p_key
     or (p_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and d.id = p_key::uuid);
$$;

--------------------------------------------------------------------------------
-- 6. AUTHORITATIVE DATABASE TRUST SCORE CALCULATION & TRIGGER
--------------------------------------------------------------------------------
-- Approved standard formula (docs/requirement.md Section 5.1):
-- 1. Complete Identity: 20 pts (Serial/IMEI + photo)
-- 2. Purchase Proof: 15 pts (Purchase record with evidence L2+)
-- 3. Battery Health: 15 pts (Battery record with evidence L2+)
-- 4. Documented Service History: 20 pts max (5 pts per service/part/damage record with evidence L2+, max 4)
-- 5. Mitra Verification: 20 pts max (10 pts per L3 record, max 2)
-- 6. Clean Lock Declaration: 10 pts (claimed_unlocked)
-- Total = 100 points maximum.
create or replace function public.calculate_trust_score(p_device_id uuid)
returns integer language plpgsql stable security definer set search_path = '' as $$
declare
  v_score integer := 0;
  v_serial text;
  v_imei text;
  v_photo text;
  v_lock text;
  v_has_purchase boolean;
  v_has_battery boolean;
  v_service_count integer;
  v_verified_count integer;
begin
  select serial_number, imei, photo_url, lock_status
  into v_serial, v_imei, v_photo, v_lock
  from public.devices where id = p_device_id;

  if not found then return 0; end if;

  -- 1. Complete identity: 20 pts
  if (nullif(btrim(v_serial), '') is not null or nullif(btrim(v_imei), '') is not null)
     and nullif(btrim(v_photo), '') is not null then
    v_score := v_score + 20;
  end if;

  -- 2. Purchase proof (L2+): 15 pts
  select exists (
    select 1 from public.history_records
    where device_id = p_device_id
      and type = 'purchase'
      and evidence_url is not null
      and level >= 2
  ) into v_has_purchase;
  if v_has_purchase then
    v_score := v_score + 15;
  end if;

  -- 3. Battery condition record (L2+): 15 pts
  select exists (
    select 1 from public.history_records
    where device_id = p_device_id
      and type = 'battery'
      and evidence_url is not null
      and level >= 2
  ) into v_has_battery;
  if v_has_battery then
    v_score := v_score + 15;
  end if;

  -- 4. Documented service history (L2+): 5 pts each, max 20 pts
  select coalesce(count(*), 0)
  into v_service_count
  from public.history_records
  where device_id = p_device_id
    and type in ('service', 'part_replacement', 'damage')
    and evidence_url is not null
    and level >= 2;
  v_score := v_score + least(20, v_service_count * 5);

  -- 5. Mitra verification (L3): 10 pts each, max 20 pts
  select coalesce(count(*), 0)
  into v_verified_count
  from public.history_records
  where device_id = p_device_id
    and level = 3
    and verification_status = 'verified';
  v_score := v_score + least(20, v_verified_count * 10);

  -- 6. Clean lock status: 10 pts
  if v_lock = 'claimed_unlocked' then
    v_score := v_score + 10;
  end if;

  return least(100, v_score);
end; $$;

-- Adjust guard_device_update to avoid trigger recursion and allow score sync on actively listed devices
create or replace function public.guard_device_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();

  -- If only trust_score and/or updated_at is changing (system score recalculation), allow update even if listed
  if (
    new.variant is not distinct from old.variant
    and new.specifications is not distinct from old.specifications
    and new.purchase_date is not distinct from old.purchase_date
    and new.purchase_price is not distinct from old.purchase_price
    and new.battery_health is not distinct from old.battery_health
    and new.physical_condition is not distinct from old.physical_condition
    and new.photo_url is not distinct from old.photo_url
    and new.lock_status is not distinct from old.lock_status
    and new.serial_number is not distinct from old.serial_number
    and new.imei is not distinct from old.imei
    and new.category is not distinct from old.category
    and new.brand is not distinct from old.brand
    and new.model is not distinct from old.model
    and new.owner_id is not distinct from old.owner_id
  ) then
    return new;
  end if;

  -- For user edits: owner_id is immutable from client updates
  if new.owner_id is distinct from old.owner_id then
    return new;
  end if;

  -- Block client user edits while active listing exists
  if exists (select 1 from public.listings where device_id = old.id and status = 'active') then
    raise exception 'Withdraw listing before editing device';
  end if;

  return new;
end; $$;

-- Recalculate score upon history record changes
create or replace function public.trigger_sync_trust_score_from_history()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_device_id uuid;
begin
  v_device_id := coalesce(new.device_id, old.device_id);
  update public.devices
  set trust_score = public.calculate_trust_score(v_device_id)
  where id = v_device_id;
  return null;
end; $$;

drop trigger if exists sync_trust_score_from_history on public.history_records;
create trigger sync_trust_score_from_history
after insert or update or delete on public.history_records
for each row execute function public.trigger_sync_trust_score_from_history();

-- Recalculate score directly on device attribute changes (serial, imei, photo, lock_status)
create or replace function public.trigger_sync_trust_score_from_device()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_score integer := 0;
  v_has_purchase boolean;
  v_has_battery boolean;
  v_service_count integer;
  v_verified_count integer;
begin
  -- 1. Complete identity: 20 pts
  if (nullif(btrim(new.serial_number), '') is not null or nullif(btrim(new.imei), '') is not null)
     and nullif(btrim(new.photo_url), '') is not null then
    v_score := v_score + 20;
  end if;

  -- 6. Clean lock status: 10 pts
  if new.lock_status = 'claimed_unlocked' then
    v_score := v_score + 10;
  end if;

  -- If updating an existing device, also factor in its documented histories
  if tg_op = 'UPDATE' then
    select exists (
      select 1 from public.history_records
      where device_id = new.id
        and type = 'purchase'
        and evidence_url is not null
        and level >= 2
    ) into v_has_purchase;
    if v_has_purchase then
      v_score := v_score + 15;
    end if;

    select exists (
      select 1 from public.history_records
      where device_id = new.id
        and type = 'battery'
        and evidence_url is not null
        and level >= 2
    ) into v_has_battery;
    if v_has_battery then
      v_score := v_score + 15;
    end if;

    select coalesce(count(*), 0)
    into v_service_count
    from public.history_records
    where device_id = new.id
      and type in ('service', 'part_replacement', 'damage')
      and evidence_url is not null
      and level >= 2;
    v_score := v_score + least(20, v_service_count * 5);

    select coalesce(count(*), 0)
    into v_verified_count
    from public.history_records
    where device_id = new.id
      and level = 3
      and verification_status = 'verified';
    v_score := v_score + least(20, v_verified_count * 10);
  end if;

  new.trust_score := least(100, v_score);
  return new;
end; $$;

drop trigger if exists sync_trust_score_from_device on public.devices;
create trigger sync_trust_score_from_device
before insert or update of serial_number, imei, photo_url, lock_status on public.devices
for each row execute function public.trigger_sync_trust_score_from_device();

-- Backfill all existing devices with authoritative trust score
update public.devices set trust_score = public.calculate_trust_score(id);

--------------------------------------------------------------------------------
-- 7. FUNCTION PERMISSIONS & GRANTS
--------------------------------------------------------------------------------
revoke all on function
  public.request_verification(uuid),
  public.pending_verifications(),
  public.review_verification(uuid, boolean, text),
  public.public_passport(text),
  public.calculate_trust_score(uuid),
  public.trigger_sync_trust_score_from_history(),
  public.trigger_sync_trust_score_from_device()
from public, anon, authenticated;

grant execute on function public.public_passport(text) to anon, authenticated;
grant execute on function public.request_verification(uuid) to authenticated;
grant execute on function public.pending_verifications() to authenticated;
grant execute on function public.review_verification(uuid, boolean, text) to authenticated;
grant execute on function public.calculate_trust_score(uuid) to authenticated;

commit;
