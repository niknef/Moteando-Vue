/* ------------------------------------------------------------------ */
/*  services/posts.js                                                 */
/* ------------------------------------------------------------------ */
import supabase from './supabase'

/* -------------------------- CRUD post ----------------------------- */
export async function createPost(payload) {
  const { error } = await supabase.from('posts').insert(payload)
  if (error) throw new Error(error.message)
}

// Datos de la ruta vinculada que muestran el feed y el detalle (null si no hay o es privada)
const ROUTE_EMBED = 'routes ( id, name, geometry, distance_km, duration_min, is_public )'

/**
 * Devuelve los últimos `limit` posts con:
 *  – perfil del autor (`user_profiles`)
 *  – nº de comentarios (`comments(count)`)
 *  – nº de likes      (`post_likes(count)`)
 */
export async function getLastPosts(limit = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      user_profiles!inner ( id, first_name, last_name, avatar_url ),
      ${ROUTE_EMBED},
      comments             ( count ),
      post_likes           ( count )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data.map((p) => ({
    ...p,
    comments: p.comments?.[0]?.count ?? 0,
    likes: p.post_likes?.[0]?.count ?? 0,
  }))
}

/* --------------------- like / unlike helpers ---------------------- */
export const likePost = (postId) => supabase.rpc('like_post', { p_post_id: postId })
export const unlikePost = (postId) => supabase.rpc('unlike_post', { p_post_id: postId })

/* ----------------------- realtime feed ---------------------------- */
export function subscribeToNewPosts(cb) {
  return supabase
    .channel('posts-feed')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) =>
      cb(payload.new),
    )
    .subscribe()
}

export async function getPostById(id) {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      user_profiles!inner ( id, first_name, last_name, avatar_url ),
      ${ROUTE_EMBED},
      comments (
        id,
        content,
        created_at,
        user_profiles ( id, first_name, last_name, avatar_url )
      )
    `,
    )
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    ...data,
    comments: data.comments ?? [],
  }
}

/**
 * Salidas (posts) de un usuario, la más nueva primero, con su ruta si es visible.
 */
export async function listUserPosts(userId) {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `id, route_name, rating, description, created_at, ride_date, photos, image_url,
       routes ( id, name, geometry, distance_km, duration_min )`,
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error('No se pudieron cargar las salidas: ' + error.message)
  return data
}
