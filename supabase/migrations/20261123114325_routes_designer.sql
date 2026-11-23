-- Fase 1: la tabla routes pasa a guardar lo que arma el diseñador de rutas.

-- La línea de la ruta (GeoJSON LineString), antes llamada data
alter table public.routes rename column data to geometry;

alter table public.routes
  add column waypoints jsonb not null default '[]'::jsonb, -- [{lng, lat, label}], en orden
  add column options jsonb not null default '{}'::jsonb; -- { avoid: ['highways', 'tollways'] }

update public.routes set is_public = false where is_public is null;

alter table public.routes
  alter column is_public set not null,
  add constraint routes_name_len check (char_length(name) between 1 and 80),
  add constraint routes_geometry_ok check (geometry ->> 'type' = 'LineString'),
  add constraint routes_waypoints_ok check (
    jsonb_typeof(waypoints) = 'array'
    and jsonb_array_length(waypoints) between 2 and 25
  ),
  add constraint routes_options_ok check (jsonb_typeof(options) = 'object'),
  add constraint routes_distance_ok check (distance_km is null or distance_km >= 0),
  add constraint routes_duration_ok check (duration_min is null or duration_min >= 0);

-- Policies: el dueño maneja sus rutas (solo logueado); las públicas las lee cualquiera
drop policy if exists "owner full access" on public.routes;
drop policy if exists "read public routes" on public.routes;

create policy "owner manages own routes" on public.routes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "anyone reads public routes" on public.routes
  for select
  to anon, authenticated
  using (is_public);

-- anon solo lee
revoke insert, update, delete, truncate, references, trigger on public.routes from anon;
