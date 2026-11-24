-- Datos para el motero calculados al trazar la ruta: altimetría, ripio y curvas.
-- { ascentM, descentM, minEle, maxEle, unpavedKm, unpaved: [[desde, hasta], ...], curvature }
-- Las rutas guardadas antes quedan con {} (se completan al editarlas y volver a guardar).
alter table public.routes
  add column stats jsonb not null default '{}'::jsonb,
  add constraint routes_stats_ok check (jsonb_typeof(stats) = 'object');
