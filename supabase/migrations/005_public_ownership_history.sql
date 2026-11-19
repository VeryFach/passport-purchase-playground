-- Keep ownership transfers anonymous, but show the current owner's display
-- name when this device has no recorded transfer history.
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
  ),
  transfer_payload as (
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
    ) as histories
    from ownership_events
  )
  select case
    when jsonb_array_length(transfer_payload.histories) > 0 then transfer_payload.histories
    else jsonb_build_array(jsonb_build_object(
      'type', 'owner_fallback',
      'owner_name', coalesce(nullif(btrim(profiles.full_name), ''), 'Pemilik saat ini')
    ))
  end
  from transfer_payload
  join public.devices on devices.id = p_device_id
  left join public.profiles on profiles.id = devices.owner_id;
$$;

revoke all on function public.ownership_transfer_histories(uuid) from public, anon, authenticated;

-- Detail pages call this safe wrapper. It returns transfer dates and anonymous
-- labels, or the current owner's display name only when no transfer exists.
create or replace function public.public_ownership_history(p_key text)
returns table(histories jsonb)
language sql stable security definer set search_path = '' as $$
  select public.ownership_transfer_histories(d.id)
  from public.devices d
  where d.passport_code = p_key
     or (p_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' and d.id = p_key::uuid)
  limit 1;
$$;

revoke all on function public.public_ownership_history(text) from public;
grant execute on function public.public_ownership_history(text) to anon, authenticated;
