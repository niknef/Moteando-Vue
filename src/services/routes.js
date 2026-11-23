/* ------------------------------------------------------------------ */
/*  services/routes.js · rutas diseñadas (tabla `routes`)             */
/* ------------------------------------------------------------------ */
import supabase from './supabase'

const COLUMNS =
  'id, user_id, name, description, is_public, waypoints, options, geometry, distance_km, duration_min, created_at, updated_at'

/**
 * Trae una ruta por id. RLS deja ver las propias y las públicas.
 */
export async function getRouteById(id) {
  const { data, error } = await supabase.from('routes').select(COLUMNS).eq('id', id).maybeSingle()

  if (error) throw new Error('No se pudo cargar la ruta: ' + error.message)
  if (!data) throw new Error('No encontramos esa ruta')
  return data
}

/**
 * Crea una ruta del usuario logueado. `route` sale de routeDraft.toRow().
 * Devuelve la fila creada.
 */
export async function saveRoute(route) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Iniciá sesión para guardar la ruta')

  const { data, error } = await supabase
    .from('routes')
    .insert({ ...route, user_id: user.id })
    .select(COLUMNS)
    .single()

  if (error) throw new Error('No se pudo guardar la ruta: ' + error.message)
  return data
}

/**
 * Actualiza una ruta propia. Devuelve la fila actualizada.
 */
export async function updateRoute(id, route) {
  const { data, error } = await supabase
    .from('routes')
    .update(route)
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle()

  if (error) throw new Error('No se pudo actualizar la ruta: ' + error.message)
  // sin fila: no existe o no es del usuario (RLS)
  if (!data) throw new Error('No se pudo actualizar la ruta: no existe o no es tuya')
  return data
}
