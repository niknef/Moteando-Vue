-- Fase 2: un post puede apuntar a una ruta guardada (la línea real, no solo salida y llegada).

alter table public.posts
  add column route_id uuid references public.routes (id) on delete set null;

create index posts_route_idx on public.posts using btree (route_id);

-- Solo se puede vincular una ruta propia (se suma a las policies que ya existen)
create policy "posts link only own routes" on public.posts
  as restrictive
  for all
  to authenticated
  with check (
    route_id is null
    or exists (
      select 1 from public.routes r where r.id = route_id and r.user_id = (select auth.uid())
    )
  );
