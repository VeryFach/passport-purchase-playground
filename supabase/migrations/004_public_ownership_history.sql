-- Expose an anonymized ownership chain from completed transactions.
-- Transaction rows are the durable source of ownership transfers; legacy
-- history_records are used only for devices without transaction rows so the
-- same purchase is not shown twice.
create or replace function public.ownership_transfer_histories(p_device_id uuid)
returns jsonb
language sql stable security definer set search_path = '' as $$
  with transaction_events as (
    select
      coalesce(t.completed_at, t.created_at)::date as event_date,
      coalesce(t.completed_at, t.created_at) as occurred_at,
      t.id
    from public.transactions t
    join public.listings l on l.id = t.listing_id
    where l.device_id = p_device_id
      and t.status = 'completed'
  ),
  ownership_events as (
    select event_date, occurred_at, id
    from transaction_events

    union all

    select h.event_date, h.created_at, h.id
    from public.history_records h
    where h.device_id = p_device_id
      and h.type = 'transfer'
      and h.is_public
      and not exists (select 1 from transaction_events)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'type', 'transfer',
        'title', 'Transfer kepemilikan',
        'description', 'Kepemilikan perangkat berpindah melalui transaksi marketplace.',
        'event_date', event_date,
        'evidence_reported', false,
        'level', null,
        'verification_simulated', false,
        'source', 'transaction'
      )
      order by event_date, occurred_at, id
    ),
    '[]'::jsonb
  )
  from ownership_events;
$$;

revoke all on function public.ownership_transfer_histories(uuid) from public, anon, authenticated;

-- Keep the existing marketplace_feed payload and replace its transfer rows
-- with the anonymized transaction-derived chain.
create or replace function public.marketplace_feed(p_listing_id uuid default null)
returns table(
  listing_id uuid,
  device_id uuid,
  title text,
  description text,
  price numeric,
  estimated_min numeric,
  estimated_max numeric,
  photos jsonb,
  passport jsonb,
  histories jsonb,
  created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select
    l.id,
    d.id,
    l.title,
    l.description,
    l.price,
    l.estimated_min,
    l.estimated_max,
    l.photos,
    jsonb_build_object(
      'passport_code', d.passport_code,
      'category', d.category,
      'brand', d.brand,
      'model', d.model,
      'variant', d.variant,
      'battery_health', d.battery_health,
      'physical_condition', d.physical_condition,
      'trust_score', d.trust_score,
      'lock_status', d.lock_status,
      'photo_url', d.photo_url,
      'specifications', jsonb_strip_nulls(jsonb_build_object(
        'storage', d.specifications->>'storage',
        'ram', d.specifications->>'ram',
        'cpu', d.specifications->>'cpu',
        'gpu', d.specifications->>'gpu',
        'os', d.specifications->>'os'
      )),
      'source', 'owner_reported',
      'verification_is_demo', true,
      'price_label', l.price_label,
      'passport_premium', l.passport_premium,
      'ai_explanation', l.ai_explanation
    ),
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
      where h.device_id = d.id
        and h.is_public
        and h.type <> 'transfer'
    ), '[]'::jsonb) || public.ownership_transfer_histories(d.id),
    l.created_at
  from public.listings l
  join public.devices d on d.id = l.device_id
  where l.status = 'active'
    and (p_listing_id is null or l.id = p_listing_id)
  order by l.created_at desc;
$$;

-- QR/public passport lookup uses the same sanitized chain as marketplace_feed.
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
    d.passport_code,
    d.category,
    d.brand,
    d.model,
    d.variant,
    d.battery_health,
    d.physical_condition,
    d.lock_status,
    d.trust_score,
    d.photo_url,
    extract(year from d.purchase_date)::integer as purchase_year,
    jsonb_strip_nulls(jsonb_build_object(
      'storage', d.specifications->>'storage',
      'ram', d.specifications->>'ram',
      'cpu', d.specifications->>'cpu',
      'gpu', d.specifications->>'gpu',
      'os', d.specifications->>'os'
    )) as specifications,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'type', h.type,
          'title', h.title,
          'description', h.description,
          'event_date', h.event_date,
          'evidence_reported', h.evidence_url is not null,
          'level', h.level,
          'verification_simulated', h.level = 3,
          'source', 'owner_reported'
        )
        order by h.event_date desc, h.created_at desc
      )
      from public.history_records h
      where h.device_id = d.id
        and h.is_public
        and h.type <> 'transfer'
    ), '[]'::jsonb) || public.ownership_transfer_histories(d.id) as histories
  from public.devices d
  where d.passport_code = p_key
     or (p_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and d.id = p_key::uuid);
$$;

grant execute on function public.marketplace_feed(uuid) to anon, authenticated;
grant execute on function public.public_passport(text) to anon, authenticated;
