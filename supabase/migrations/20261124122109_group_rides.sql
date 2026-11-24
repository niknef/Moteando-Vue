-- Rodadas: salidas grupales sobre una ruta pública, con fecha, punto de encuentro y "Voy".
-- Se comparten por link (/s/:id) y se puede anotar gente sin cuenta.

create table public.group_rides (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  organizer_id uuid not null references auth.users (id) on delete cascade,
  -- nombre del organizador al crearla: los perfiles no se leen sin cuenta y el link es público
  organizer_name text not null check (char_length(organizer_name) between 1 and 80),
  starts_at timestamptz not null,
  meeting_point text not null check (char_length(meeting_point) between 1 and 120),
  notes text check (char_length(notes) <= 500),
  cancelled boolean not null default false,
  created_at timestamptz not null default now()
);

create index group_rides_starts_idx on public.group_rides (starts_at);
create index group_rides_route_idx on public.group_rides (route_id);

create table public.ride_attendees (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.group_rides (id) on delete cascade,
  -- null = se anotó sin cuenta desde el link
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  with_passenger boolean not null default false,
  created_at timestamptz not null default now()
);

create index ride_attendees_ride_idx on public.ride_attendees (ride_id);
create unique index ride_attendees_one_per_user on public.ride_attendees (ride_id, user_id)
  where user_id is not null;

alter table public.group_rides enable row level security;
alter table public.ride_attendees enable row level security;

-- Rodadas: las ve cualquiera (se comparten por link); las maneja quien organiza.
create policy "anyone reads rides" on public.group_rides
  for select to anon, authenticated using (true);

create policy "organizer creates rides" on public.group_rides
  for insert to authenticated
  with check (
    organizer_id = (select auth.uid())
    and exists (
      select 1 from public.routes r
      where r.id = route_id and (r.is_public or r.user_id = (select auth.uid()))
    )
  );

create policy "organizer updates rides" on public.group_rides
  for update to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));

create policy "organizer deletes rides" on public.group_rides
  for delete to authenticated using (organizer_id = (select auth.uid()));

-- Anotados: visibles para quien abre la rodada.
create policy "anyone reads attendees" on public.ride_attendees
  for select to anon, authenticated using (true);

-- "Voy": sin cuenta va sin user_id; con cuenta, con el propio. Solo en rodadas vigentes.
create policy "anyone joins open rides" on public.ride_attendees
  for insert to anon, authenticated
  with check (
    (user_id is null or user_id = (select auth.uid()))
    and exists (
      select 1 from public.group_rides g
      where g.id = ride_id and not g.cancelled and g.starts_at > now() - interval '12 hours'
    )
  );

-- Tope de anotados por rodada (frena el spam del "Voy" sin cuenta)
create policy "max 100 attendees" on public.ride_attendees
  as restrictive
  for insert to anon, authenticated
  with check (
    (select count(*) from public.ride_attendees a where a.ride_id = ride_attendees.ride_id) < 100
  );

-- Bajarse: cada uno lo suyo; el organizador puede sacar a cualquiera de su rodada.
create policy "leave or organizer removes" on public.ride_attendees
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.group_rides g
      where g.id = ride_id and g.organizer_id = (select auth.uid())
    )
  );

revoke truncate, references, trigger on public.group_rides, public.ride_attendees from anon, authenticated;
revoke update, delete on public.group_rides, public.ride_attendees from anon;
