-- Session 04 pricing package.
-- Repository policy keeps schema changes managed through Lovable/Supabase SQL Editor;
-- apply this idempotent script there after the existing base migrations.
begin;

-- 18 clearly-labelled demo reference models. Re-running this block updates values without
-- creating duplicate rows.
create temporary table _session04_prices (
  category text, brand text, model text, variant text, retail_price numeric,
  used_price_1y numeric, used_price_2y numeric, used_price_3y numeric
) on commit drop;
insert into _session04_prices values
 ('smartphone','Apple','iPhone 13','128 GB',12999000,8500000,7200000,6100000),
 ('smartphone','Apple','iPhone 14','128 GB',14999000,10200000,8700000,7400000),
 ('smartphone','Apple','iPhone 15','128 GB',16999000,12200000,10500000,9000000),
 ('smartphone','Apple','iPhone 15 Pro','256 GB',20999000,15500000,13700000,11800000),
 ('smartphone','Apple','iPhone 12','128 GB',11999000,7000000,5900000,5000000),
 ('smartphone','Samsung','Galaxy S22','128 GB',11999000,6800000,5600000,4700000),
 ('smartphone','Samsung','Galaxy S23','256 GB',13999000,8800000,7400000,6300000),
 ('smartphone','Samsung','Galaxy S24','256 GB',15999000,11200000,9500000,8200000),
 ('smartphone','Google','Pixel 7','128 GB',8999000,5600000,4600000,3800000),
 ('smartphone','Xiaomi','Redmi Note 12','128 GB',3299000,2100000,1700000,1400000),
 ('laptop','Apple','MacBook Air M1','8 GB / 256 GB',15999000,10500000,8600000,7200000),
 ('laptop','Apple','MacBook Air M2','8 GB / 256 GB',17999000,12900000,10800000,9200000),
 ('laptop','Apple','MacBook Pro 14 M1 Pro','16 GB / 512 GB',29999000,21300000,18500000,16000000),
 ('laptop','Lenovo','ThinkPad X1 Carbon Gen 9','16 GB / 512 GB',23999000,14500000,12200000,10300000),
 ('laptop','ASUS','ROG Zephyrus G14','16 GB / 1 TB',24999000,16400000,13900000,11800000),
 ('laptop','Dell','XPS 13 9310','16 GB / 512 GB',21999000,13200000,11100000,9400000),
 ('laptop','HP','Pavilion Aero 13','16 GB / 512 GB',13999000,8200000,6800000,5700000),
 ('laptop','Acer','Swift 3','8 GB / 512 GB',9999000,5700000,4700000,3900000);

insert into public.market_prices (category,brand,model,variant,retail_price,used_price_1y,used_price_2y,used_price_3y,source,is_demo)
select category,brand,model,variant,retail_price,used_price_1y,used_price_2y,used_price_3y,'Paspor Digital demo sample 2026',true
from _session04_prices p
where not exists (select 1 from public.market_prices m where m.category=p.category and lower(btrim(m.brand))=lower(btrim(p.brand)) and lower(btrim(m.model))=lower(btrim(p.model)) and lower(btrim(m.variant))=lower(btrim(p.variant)));

create or replace function public.refresh_listing_estimate(p_listing_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  listing_row public.listings%rowtype;
  device_row public.devices%rowtype;
  market_row public.market_prices%rowtype;
  age integer;
  age_used numeric;
  base_price numeric;
  adjusted numeric;
  premium numeric;
  mid_price numeric;
  battery_factor numeric := 1;
  physical_factor numeric := 1;
  part_factor numeric := 1;
  warnings jsonb := '[]'::jsonb;
  reasons jsonb;
begin
  select * into listing_row from public.listings where id=p_listing_id and status='active' for update;
  if not found then raise exception 'listing_not_active' using errcode='P0001'; end if;
  if listing_row.seller_id <> auth.uid() and not public.is_mitra() then raise exception 'not_listing_owner' using errcode='42501'; end if;
  select * into device_row from public.devices where id=listing_row.device_id;
  select * into market_row from public.market_prices where lower(category)=lower(device_row.category) and lower(btrim(brand))=lower(btrim(device_row.brand)) and lower(btrim(model))=lower(btrim(device_row.model)) order by is_demo desc, updated_at desc limit 1;
  if not found then raise exception 'unsupported_model' using errcode='P0001'; end if;
  age := extract(year from current_date)::integer - coalesce(extract(year from device_row.purchase_date)::integer, extract(year from current_date)::integer);
  if age < 0 then raise exception 'purchase_date_in_future' using errcode='P0001'; end if;
  age_used := least(age,3);
  base_price := case when age_used <= 1 then market_row.retail_price + (market_row.used_price_1y-market_row.retail_price)*age_used when age_used <= 2 then market_row.used_price_1y + (market_row.used_price_2y-market_row.used_price_1y)*(age_used-1) else market_row.used_price_2y + (market_row.used_price_3y-market_row.used_price_2y)*(age_used-2) end;
  if device_row.battery_health is null then warnings := warnings || jsonb_build_array('battery_missing'); elsif device_row.battery_health >= 90 then battery_factor := 1; elsif device_row.battery_health >= 80 then battery_factor := .95; else battery_factor := .88; end if;
  if device_row.physical_condition='light_wear' then physical_factor := .96; elsif device_row.physical_condition='damaged' then physical_factor := .85; elsif device_row.physical_condition='unknown' then warnings := warnings || jsonb_build_array('physical_condition_missing'); end if;
  select power(.92,count(*)::numeric) into part_factor from public.history_records where device_id=device_row.id and type='part_replacement' and part_original=false;
  adjusted := base_price*battery_factor*physical_factor*part_factor;
  premium := adjusted * least(.10, greatest(0,device_row.trust_score)::numeric/1000);
  mid_price := adjusted+premium;
  reasons := jsonb_build_array(format('Harga dasar diinterpolasi dari data pasar usia %s tahun.',least(age,3)),format('Faktor kondisi baterai/fisik %.0f%% diterapkan.',battery_factor*physical_factor*100),format('Trust Score %s memberi premi paspor Rp%s.',device_row.trust_score,to_char(round(premium),'FM999G999G999')));
  if age > 3 then warnings := warnings || jsonb_build_array('age_clamped_to_3y'); end if;
  update public.listings set estimated_base_price=round(base_price), estimated_min=round(mid_price*.93), estimated_max=round(mid_price*1.07), passport_premium=round(premium), estimated_at=now(), estimation_snapshot=jsonb_build_object('age',age,'age_used',age_used,'battery_factor',battery_factor,'physical_factor',physical_factor,'part_factor',part_factor,'warnings',warnings), ai_explanation=jsonb_build_object('source','deterministic_template','summary','Rentang dihitung dari data pasar sampel dan kondisi paspor.','reasons',reasons,'warnings',warnings) where id=p_listing_id;
end; $$;

create or replace function public.save_listing_explanation(p_listing_id uuid, p_explanation jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.listings set ai_explanation=jsonb_build_object('source',coalesce(p_explanation->>'source','llm'),'summary',coalesce(p_explanation->>'summary',''),'reasons',coalesce(p_explanation->'reasons','[]'::jsonb),'min',p_explanation->'min','max',p_explanation->'max') where id=p_listing_id and (seller_id=auth.uid() or public.is_mitra());
  if not found then raise exception 'not_listing_owner' using errcode='42501'; end if;
end; $$;
grant execute on function public.refresh_listing_estimate(uuid) to authenticated;
grant execute on function public.save_listing_explanation(uuid,jsonb) to authenticated;
commit;
