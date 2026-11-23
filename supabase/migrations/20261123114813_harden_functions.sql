-- Seguridad de funciones (advisors de Supabase).
-- PostGIS queda en public: se usa en posts.start_geom/end_geom y no se puede mover
-- de schema sin reinstalarlo. Sus avisos (spatial_ref_sys, st_estimatedextent) se aceptan.

-- handle_new_user solo la usa el trigger on_auth_user_created: nadie la llama por la API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- search_path fijo y nombres calificados
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.like_post(p_post_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  insert into public.post_likes (post_id, user_id)
  values (p_post_id, auth.uid())
  on conflict do nothing;
end;
$$;

create or replace function public.unlike_post(p_post_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  delete from public.post_likes
  where post_id = p_post_id
    and user_id = auth.uid();
end;
$$;

-- Dar o quitar like: solo con sesión
revoke execute on function public.like_post(uuid) from public, anon;
revoke execute on function public.unlike_post(uuid) from public, anon;
grant execute on function public.like_post(uuid) to authenticated;
grant execute on function public.unlike_post(uuid) to authenticated;
