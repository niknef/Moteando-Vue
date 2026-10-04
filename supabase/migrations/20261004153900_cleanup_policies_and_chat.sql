drop table if exists public.global_chat;

drop view if exists public.post_comment_counts;
drop view if exists public.post_like_counts;

drop policy if exists "insert owns route" on public.routes;
drop policy if exists "user can set active bike" on public.user_profiles;

drop policy if exists "limit 5 bikes" on public.user_bikes;
drop policy if exists "limit max 5 bikes" on public.user_bikes;

create policy "max 5 bikes per user" on public.user_bikes
    as restrictive
    for insert
    to authenticated
    with check (
        (select count(*) from public.user_bikes where user_id = auth.uid()) < 5
    );
