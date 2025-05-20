import supabase from './supabase'

/**
 * Obtener comentarios de un post, con datos del perfil del autor.
 * @param {string} postId
 * @returns {Promise}
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

/**
 * Obtiene todos los comentarios con perfil del autor por ID de post.
 * 
 * @param {string} postId - ID del post.
 * @returns {Promise} - Lista de comentarios.
 */
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
 * Crea un nuevo comentario en Supabase.
 * 
 * @param {Object} comment - Comentario a crear.
 * @param {string} comment.post_id - ID del post relacionado.
 * @param {string} comment.content - Contenido del comentario.
 * @returns {Promise}
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
 * Suscribe a eventos de nuevos comentarios en tiempo real.
 * 
 * @param {string} postId - ID del post.
 * @param {(comment: object) => void} callback - Función que se ejecuta cuando llega un nuevo comentario.
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
 * Elimina un comentario si pertenece al usuario actual.
 * 
 * @param {string} commentId - ID del comentario.
 * @returns {Promise}
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


/**
 * Obtiene la cantidad de comentarios por post.
 * 
 * @returns {Promise} - Objeto con claves como post_id y valores como cantidad.
 */
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
