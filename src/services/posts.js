import supabase from './supabase'
/**
 * Obtener un post por su ID con los datos del autor
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function getPostById(id) {
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
    .single() // esperamos solo un resultado

  if (error) {
    console.error('[posts.js getPostById] Error al obtener post:', error)
    throw error
  }

  return data
}

/**
 * Obtener los últimos posteos con datos del autor (de user_profiles)
 */
export async function getLastPosts(limit = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user_profiles!user_id(
        id,
        first_name,
        last_name,
        avatar_url,
        bio,
        bike_model
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[posts.js getLastPosts] Error:', error)
    throw error
  }

  return data
}

/**
 * Crea un nuevo post en la base de datos.
 * 
 * @param {Object} post - Objeto con los datos del post.
 * @param {string} post.user_id - ID del autor.
 * @param {string} post.start_point - Punto de partida.
 * @param {string} post.end_point - Punto de llegada.
 * @param {string} post.duration - Duración estimada.
 * @param {number} post.rating - Valoración (1 a 5).
 * @param {string} post.description - Descripción de la ruta.
 *  
 */
export async function createPost(post) {
  const { error } = await supabase
    .from('posts')
    .insert(post)

  if (error) {
    console.error('[posts.js createPost] Error al guardar el post:', error)
    throw error
  }
}

/**
 * Escuchar nuevos posteos en tiempo real
 * @param {(post: object) => void} callback
 */
export function subscribeToNewPosts(callback) {
  const channel = supabase.channel('posts')

  channel
    .on(
      'postgres_changes',
      {
        schema: 'public',
        table: 'posts',
        event: 'INSERT'
      },
      payload => {
        callback(payload.new)
      }
    )
    .subscribe()
}

/**
 * Eliminar un post si sos el autor
 * @param {string} postId
 */
export async function deletePost(postId) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    console.error('[posts.js deletePost] Error al eliminar el post:', error)
    throw error
  }
}
