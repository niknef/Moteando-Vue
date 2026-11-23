-- "Contá tu salida": un post es la crónica de una salida sobre una ruta.
-- Varias fotos (hasta 6) y la fecha en que se hizo. image_url queda como la primera foto
-- para los posts viejos y para lo que todavía la lee.
alter table public.posts
  add column photos text[] not null default '{}',
  add column ride_date date;

alter table public.posts
  add constraint posts_photos_max check (cardinality(photos) <= 6);

-- Los posts viejos con imagen pasan a tenerla también en photos
update public.posts set photos = array[image_url] where image_url is not null and photos = '{}';
