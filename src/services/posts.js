import supabase from './supabase'

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
 * Crear un nuevo post
 * @param {{
 *   user_id: string,
 *   start_point: string,
 *   end_point: string,
 *   duration: string,
 *   rating: number,
 *   description: string
 * }} post
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
