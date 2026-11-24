-- Agregar una moto fallaba con "infinite recursion detected in policy for relation user_bikes".
-- La policy restrictiva "máx. 5" cuenta con una subconsulta sobre user_bikes; desde que
-- "read active bikes" (B5) tiene su propia subconsulta, Postgres lo detecta como recursión.
-- El conteo pasa a una función security definer: cuenta sin disparar las policies.

create or replace function public.my_bike_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.user_bikes where user_id = (select auth.uid())
$$;

revoke all on function public.my_bike_count() from public, anon;
grant execute on function public.my_bike_count() to authenticated;

drop policy if exists "max 5 bikes per user" on public.user_bikes;

create policy "max 5 bikes per user" on public.user_bikes
  as restrictive
  for insert
  to authenticated
  with check ((select public.my_bike_count()) < 5);
