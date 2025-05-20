import supabase from './supabase'

/**
 * Obtener comentarios de un post, con datos del perfil del autor.
 * @param {string} postId
 * @returns {Promise<Array>}
 */
export async function getCommentsByPost(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user_profiles:profile_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[comments.js getCommentsByPost] Error:', error)
    throw error
  }

  return data
}

export async function getCommentsByPostId(postId) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user_profiles (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[comments.js getCommentsByPostId] Error:', error)
    throw error
  }

  return data
}

/**
 * Crear un nuevo comentario
 * @param {{
 *   post_id: string,
 *   user_id: string,
 *   profile_id: string,
 *   content: string
 * }} comment
 */
export async function createComment({ post_id, content }) {
  const { data: session } = await supabase.auth.getSession()
  const user = session?.session?.user

  if (!user) throw new Error('Usuario no autenticado')

  const { error } = await supabase.from('comments').insert({
    post_id,
    content,
    user_id: user.id,
    profile_id: user.id // si usás esto también como FK
  })

  if (error) {
    console.error('[comments.js createComment] Error al guardar el comentario:', error)
    throw error
  }
}

/**
 * Escuchar nuevos comentarios de un post en tiempo real
 * @param {string} postId
 * @param {(comment: object) => void} callback
 */
export function subscribeToNewComments(postId, callback) {
  const channel = supabase.channel('comments')

  channel
    .on(
      'postgres_changes',
      {
        schema: 'public',
        table: 'comments',
        event: 'INSERT',
        filter: `post_id=eq.${postId}`
      },
      async payload => {
        // hacemos una consulta a Supabase para traer el comentario con perfil
        const { data, error } = await supabase
          .from('comments')
          .select(`
            *,
            user_profiles:profile_id (
              id,
              first_name,
              last_name,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single()

        if (error) {
          console.error('[subscribeToNewComments] Error al traer comentario con perfil:', error)
          return
        }

        callback(data)
      }
    )
    .subscribe()
}

/**
 * Eliminar un comentario (si es del autor)
 * @param {string} commentId
 */
export async function deleteComment(commentId) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('[comments.js deleteComment] Error al eliminar comentario:', error)
    throw error
  }
}

export async function getCommentCounts() {
  const { data, error } = await supabase
    .from('comments')
    .select('post_id', { count: 'exact', head: false })

  if (error) {
    console.error('[comments.js getCommentCounts] Error:', error)
    throw error
  }

  // Agrupamos las cantidades por post_id
  const counts = {}

  data.forEach(row => {
    counts[row.post_id] = (counts[row.post_id] || 0) + 1
  })

  return counts
}
