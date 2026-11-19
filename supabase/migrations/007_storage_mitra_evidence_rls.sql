-- Storage RLS expressions that query history_records directly are subject to
-- history_records RLS, which hides other owners' rows from Mitra. Check the
-- narrowly scoped evidence relationship inside a SECURITY DEFINER function.
create or replace function public.can_read_device_evidence(p_object_name text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.history_records h
    join public.devices d on d.id = h.device_id
    where h.evidence_url = p_object_name
      and (
        d.owner_id = auth.uid()
        or (
          exists (
            select 1
            from public.profiles p
            where p.id = auth.uid()
              and p.role = 'mitra'
          )
          and (
            h.verification_status = 'pending'
            or h.verifier_id = auth.uid()
          )
        )
      )
  );
$$;

revoke all on function public.can_read_device_evidence(text) from public, anon, authenticated;
grant execute on function public.can_read_device_evidence(text) to authenticated;

drop policy if exists evidence_read_authorized on storage.objects;
create policy evidence_read_authorized on storage.objects for select to authenticated
using (
  bucket_id = 'device-evidence'
  and (
    -- Uploaders can access their own evidence files.
    (storage.foldername(name))[1] = (select auth.uid())::text
    -- Current owners and Mitra reviewers use the scoped database check above.
    or public.can_read_device_evidence(name)
  )
);
