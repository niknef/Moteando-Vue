-- B5: el perfil de otro usuario no podía mostrar su moto activa ("own bikes read" solo deja ver
-- las propias). Los usuarios logueados pueden ver, además, la moto activa de cada perfil.
-- El resto del garaje sigue siendo privado.
create policy "read active bikes" on public.user_bikes
  for select
  to authenticated
  using (
    exists (select 1 from public.user_profiles p where p.active_bike_id = user_bikes.id)
  );
