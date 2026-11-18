-- C2C role guards. Non-destructive: no tables, columns, or user data are changed.
-- Account roles remain only 'user' and 'mitra'. Buying/selling is contextual
-- activity for 'user'; 'mitra' is restricted to verification workflows.
begin;

create or replace function public.is_mitra()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'mitra'
  );
$$;

create or replace function public.publish_listing(p_device_id uuid,p_title text,p_price numeric,p_description text default '',p_photos jsonb default '[]'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if public.is_mitra() then raise exception 'Mitra accounts cannot publish listings'; end if;
  select owner_id into v_owner from public.devices where id=p_device_id for update;
  if not found or v_owner is distinct from auth.uid() then raise exception 'Device unavailable'; end if;
  insert into public.listings(device_id,seller_id,title,price,description,photos) values(p_device_id,auth.uid(),p_title,p_price,p_description,p_photos) returning id into v_id;
  return v_id;
end; $$;

create or replace function public.withdraw_listing(p_listing_id uuid) returns void language plpgsql security definer set search_path = '' as $$
declare v_device uuid; v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if public.is_mitra() then raise exception 'Mitra accounts cannot manage listings'; end if;
  select device_id into v_device from public.listings where id=p_listing_id;
  if not found then raise exception 'Listing unavailable'; end if;
  select owner_id into v_owner from public.devices where id=v_device for update;
  if v_owner is distinct from auth.uid() then raise exception 'Listing unavailable'; end if;
  update public.listings set status='withdrawn' where id=p_listing_id and seller_id=auth.uid() and status='active';
  if not found then raise exception 'Listing unavailable'; end if;
end; $$;

create or replace function public.buy_listing(p_listing_id uuid) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_device uuid; v_owner uuid; v_listing public.listings%rowtype; v_id uuid; v_snapshot jsonb;
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
  if v_owner is distinct from v_listing.seller_id or v_owner=auth.uid() then raise exception 'Purchase not allowed'; end if;
  select to_jsonb(m) into v_snapshot from public.marketplace_feed(p_listing_id) m;
  insert into public.transactions(listing_id,buyer_id,seller_id,total_price,listing_snapshot) values(p_listing_id,auth.uid(),v_listing.seller_id,v_listing.price,v_snapshot) returning id into v_id;
  update public.listings set status='sold' where id=p_listing_id;
  update public.devices set owner_id=auth.uid() where id=v_device;
  insert into public.history_records(device_id,created_by,type,title,description,is_public) values(v_device,auth.uid(),'transfer','Transfer kepemilikan (simulasi)','Paspor berpindah melalui pembelian simulasi.',true);
  return v_id;
end; $$;

-- Mitra cannot create or edit passports/history. Normal users stay owner-scoped.
drop policy if exists devices_insert_own on public.devices;
create policy devices_insert_own on public.devices for insert to authenticated
  with check (owner_id = (select auth.uid()) and not public.is_mitra());
drop policy if exists devices_update_own on public.devices;
create policy devices_update_own on public.devices for update to authenticated
  using (owner_id = (select auth.uid()) and not public.is_mitra() and not exists (select 1 from public.listings l where l.device_id = devices.id and l.status = 'active'))
  with check (owner_id = (select auth.uid()) and not public.is_mitra());
drop policy if exists histories_insert_own on public.history_records;
create policy histories_insert_own on public.history_records for insert to authenticated
  with check (
    not public.is_mitra()
    and created_by = (select auth.uid())
    and type <> 'transfer'
    and exists (select 1 from public.devices d where d.id = history_records.device_id and d.owner_id = (select auth.uid()))
    and not exists (select 1 from public.listings l where l.device_id = history_records.device_id and l.status = 'active')
    and (evidence_url is null or split_part(evidence_url,'/',1) = (select auth.uid())::text)
  );

revoke all on function public.is_mitra(),public.publish_listing(uuid,text,numeric,text,jsonb),public.withdraw_listing(uuid),public.buy_listing(uuid) from public,anon,authenticated;
grant execute on function public.publish_listing(uuid,text,numeric,text,jsonb),public.withdraw_listing(uuid),public.buy_listing(uuid) to authenticated;
grant execute on function public.is_mitra() to authenticated;

commit;
