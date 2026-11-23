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

/**
 * Lista las rutas del usuario logueado, la última modificada primero.
 */
export async function listMyRoutes() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Iniciá sesión para ver tus rutas')

  const { data, error } = await supabase
    .from('routes')
    .select(COLUMNS)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('No se pudieron cargar tus rutas: ' + error.message)
  return data
}

/**
 * Borra una ruta propia.
 */
export async function deleteRoute(id) {
  const { data, error } = await supabase.from('routes').delete().eq('id', id).select('id')

  if (error) throw new Error('No se pudo borrar la ruta: ' + error.message)
  if (!data.length) throw new Error('No se pudo borrar la ruta: no existe o no es tuya')
}

/**
 * Rutas públicas para explorar, la última modificada primero, con el autor de cada una.
 * userId: solo las de ese usuario (perfil) · search: filtra por nombre.
 */
export async function listPublicRoutes({ userId, search, limit = 30 } = {}) {
  let query = supabase
    .from('routes')
    .select(COLUMNS)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (userId) query = query.eq('user_id', userId)
  if (search?.trim()) query = query.ilike('name', `%${search.trim()}%`)

  const { data, error } = await query
  if (error) throw new Error('No se pudieron cargar las rutas: ' + error.message)

  // routes apunta a auth.users (no a user_profiles): los autores se traen aparte
  const ids = [...new Set(data.map((r) => r.user_id))]
  if (!ids.length) return []
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, avatar_url')
    .in('id', ids)
  const byId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  return data.map((r) => ({ ...r, author: byId[r.user_id] ?? null }))
}
