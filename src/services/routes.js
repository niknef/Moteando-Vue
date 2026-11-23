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
 * Rutas públicas para descubrir, la última modificada primero, con el autor de cada una y
 * su señal social (cantidad de salidas publicadas y puntaje promedio).
 * userId: solo las de ese usuario (perfil) · search: filtra por nombre ·
 * minKm/maxKm: rango de distancia · noHighways: solo las que evitan autopistas.
 */
export async function listPublicRoutes({
  userId,
  search,
  minKm,
  maxKm,
  noHighways,
  limit = 30,
} = {}) {
  let query = supabase
    .from('routes')
    .select(COLUMNS)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (userId) query = query.eq('user_id', userId)
  if (search?.trim()) query = query.ilike('name', `%${search.trim()}%`)
  if (minKm != null) query = query.gte('distance_km', minKm)
  if (maxKm != null) query = query.lt('distance_km', maxKm)
  if (noHighways) query = query.filter('options->avoid', 'cs', '["highways"]')

  const { data, error } = await query
  if (error) throw new Error('No se pudieron cargar las rutas: ' + error.message)
  if (!data.length) return []

  // routes apunta a auth.users (no a user_profiles): autores y salidas se traen aparte
  const userIds = [...new Set(data.map((r) => r.user_id))]
  const routeIds = data.map((r) => r.id)
  const [{ data: profiles }, { data: posts }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', userIds),
    supabase.from('posts').select('route_id, rating').in('route_id', routeIds),
  ])
  const byId = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

  const stats = {}
  for (const { route_id: id, rating } of posts ?? []) {
    stats[id] ??= { count: 0, sum: 0, rated: 0 }
    stats[id].count++
    if (rating != null) {
      stats[id].sum += Number(rating)
      stats[id].rated++
    }
  }
  return data.map((r) => {
    const st = stats[r.id]
    return {
      ...r,
      author: byId[r.user_id] ?? null,
      rides: st?.count ?? 0,
      rating: st?.rated ? Math.round((st.sum / st.rated) * 10) / 10 : null,
    }
  })
}

/**
 * Copia una ruta (propia o pública de otro) a las rutas del usuario logueado, como privada.
 * Devuelve la ruta nueva.
 */
export async function copyRouteToMine(route) {
  return saveRoute({
    name: route.name.slice(0, 80),
    description: route.description,
    is_public: false,
    waypoints: route.waypoints,
    options: route.options,
    geometry: route.geometry,
    distance_km: route.distance_km,
    duration_min: route.duration_min,
  })
}
