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

// Lo que necesita una tarjeta de salida: autor, ruta, contadores y si le di like
const CARD_SELECT = `
  *,
  user_profiles!inner ( id, first_name, last_name, avatar_url ),
  ${ROUTE_EMBED},
  comments ( count ),
  post_likes ( count ),
  my_like:post_likes ( user_id )
`

// Id del usuario logueado sin ir al servidor (funciona sin señal)
async function currentUserId() {
  return (await supabase.auth.getSession()).data.session?.user.id ?? null
}

// Sin usuario, el filtro de my_like usa un id que no existe: nunca hay like propio
const NO_USER = '00000000-0000-0000-0000-000000000000'

function toCard(p) {
  const { my_like, post_likes, comments, ...rest } = p
  return {
    ...rest,
    comments: comments?.[0]?.count ?? 0,
    likes: post_likes?.[0]?.count ?? 0,
    // B3: antes nunca se calculaba y el corazón quedaba siempre vacío
    liked_by_me: (my_like?.length ?? 0) > 0,
    // posts viejos guardaron [""] cuando no tenían foto
    photos: (p.photos ?? []).filter(Boolean),
  }
}

/**
 * Últimas `limit` salidas para el feed, con autor, ruta, comentarios, likes y like propio.
 */
export async function getLastPosts(limit = 20) {
  const uid = (await currentUserId()) ?? NO_USER
  const { data, error } = await supabase
    .from('posts')
    .select(CARD_SELECT)
    .eq('my_like.user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error('No se pudieron cargar las salidas: ' + error.message)
  return data.map(toCard)
}

/**
 * Una salida con lo mismo que la tarjeta (B4: el detalle no traía los likes).
 */
export async function getPostById(id) {
  const uid = (await currentUserId()) ?? NO_USER
  const { data, error } = await supabase
    .from('posts')
    .select(CARD_SELECT)
    .eq('id', id)
    .eq('my_like.user_id', uid)
    .maybeSingle()

  if (error) throw new Error('No se pudo cargar la salida: ' + error.message)
  if (!data) throw new Error('No encontramos esa salida')
  return toCard(data)
}

/* --------------------- like / unlike ------------------------------ */
// rpc no lanza: devuelve { error }. Se lanza para que la pantalla pueda deshacer el cambio
export async function likePost(postId) {
  const { error } = await supabase.rpc('like_post', { p_post_id: postId })
  if (error) throw new Error('No se pudo dar me gusta')
}
export async function unlikePost(postId) {
  const { error } = await supabase.rpc('unlike_post', { p_post_id: postId })
  if (error) throw new Error('No se pudo sacar el me gusta')
}

/* ----------------------- realtime feed ---------------------------- */
// El evento trae la fila sola: se pide la salida completa antes de mostrarla
export function subscribeToNewPosts(cb) {
  return supabase
    .channel('posts-feed')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload) =>
      getPostById(payload.new.id)
        .then(cb)
        .catch(() => {}),
    )
    .subscribe()
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
