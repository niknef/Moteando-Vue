/* ────────────────────────────────────────────────────────────────
 *  services/posts.js
 *  Funciones CRUD + Realtime para la tabla `posts`
 *  (Vue 3 Options API – Supabase JS v2)
 * ──────────────────────────────────────────────────────────────── */
import supabase from './supabase'

/* util ─────────────────────────────────────────────────────────── */
const toPointWKT = ([lng, lat]) => `SRID=4326;POINT(${lng} ${lat})`

/* ──────────────── 1. Queries sincrónicas ─────────────────────── */
/**
 * Traer un post por ID con datos del autor y la geometría
 */
export async function getPostById (id) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user_profiles!user_id (
        id,
        first_name,
        last_name,
        avatar_url,
        bio,
        bike_model
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[posts.js getPostById]', error)
    throw error
  }
  return data
}

/**
 * Traer los últimos N posteos (default 20)
 */
export async function getLastPosts (limit = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user_profiles!user_id (
        id,
        first_name,
        last_name,
        avatar_url,
        bio
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[posts.js getLastPosts]', error)
    throw error
  }
  return data
}

/**
 * Traer posts dentro de un bounding-box.
 * @param {number[]} bbox [west, south, east, north]
 */
export async function getPostsBBOX (bbox) {
  const [w, s, e, n] = bbox
  const polygon = `SRID=4326;POLYGON((${w} ${s},${e} ${s},${e} ${n},${w} ${n},${w} ${s}))`

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user_profiles!user_id(
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .filter('geometry', 'st_intersects', polygon)

  if (error) {
    console.error('[posts.js getPostsBBOX]', error)
    throw error
  }
  return data
}

/* ───────────── 2. Mutaciones (insert / delete) ────────────────── */
/**
 * Crear un post.
 * Si llega `coordinates: [lng,lat]` se convierte a geometry(Point,4326)
 */
export async function createPost (post) {
  const payload = { ...post }

  if (payload.coordinates?.length === 2) {
    payload.geometry = toPointWKT(payload.coordinates)
    delete payload.coordinates        // limpiamos el helper
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .single()

  if (error) {
    console.error('[posts.js createPost]', error)
    throw error
  }
  return data
}

/**
 * Eliminar un post (solo si sos el autor desde RLS)
 */
export async function deletePost (postId) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    console.error('[posts.js deletePost]', error)
    throw error
  }
}

/* ──────────── 3. Realtime – INSERT listener ──────────────────── */
/* Canal único compartido por toda la app */
let postsChannel = null
let listeners = new Map()   // eventId → callback

/**
 * Suscribirse a nuevos posteos.
 * @param {(post:Object)=>void} callback
 * @returns {() => void} función para desuscribirse
 */
export function subscribeToNewPosts (callback) {
  // 1) Creamos el canal solo la primera vez
  if (!postsChannel) {
    postsChannel = supabase.channel('public:posts')
    postsChannel.subscribe()            // ✅ solo una vez
  }

  // 2) Registramos este listener y guardamos su ID
  const { eventId } = postsChannel.on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'posts' },
    payload => callback(payload.new)
  )
  listeners.set(eventId, callback)

  // 3) Devolvemos función cleanup SOLO para este listener
  return () => {
    if (!postsChannel) return
    postsChannel.off(eventId)
    listeners.delete(eventId)

    // Si no queda nadie escuchando, cerramos el canal
    if (listeners.size === 0) {
      supabase.removeChannel(postsChannel)
      postsChannel = null
    }
  }
}
