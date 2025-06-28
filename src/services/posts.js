/* ------------------------------------------------------------------ */
/*  services/posts.js                                                 */
/* ------------------------------------------------------------------ */
import supabase from './supabase'

/* ---------- subida de imagen al bucket `posts` -------------------- */
const BUCKET = 'posts'

export async function uploadPostPhoto (file) {
  const uid  = (await supabase.auth.getUser()).data.user.id
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const name = `${crypto.randomUUID()}.${ext}`
  const path = `${uid}/${name}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

/* -------------------------- CRUD post ----------------------------- */
export async function createPost (payload) {
  const { error } = await supabase.from('posts').insert(payload)
  if (error) throw error
}

/**
 * Devuelve los últimos `limit` posts con:
 *  – perfil del autor (`user_profiles`)
 *  – nº de comentarios (`comments(count)`)
 *  – nº de likes      (`post_likes(count)`)
 */
export async function getLastPosts (limit = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user_profiles!inner ( id, first_name, last_name, avatar_url ),
      comments             ( count ),
      post_likes           ( count )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data.map(p => ({
    ...p,
    comments:   p.comments?.[0]?.count    ?? 0,
    likes:      p.post_likes?.[0]?.count  ?? 0
  }))
}

/* --------------------- like / unlike helpers ---------------------- */
export const likePost   = postId => supabase.rpc('like_post',   { p_post_id: postId })
export const unlikePost = postId => supabase.rpc('unlike_post', { p_post_id: postId })

/* ----------------------- realtime feed ---------------------------- */
export function subscribeToNewPosts (cb) {
  return supabase
    .channel('posts-feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts' },
      payload => cb(payload.new)
    )
    .subscribe()
}

export async function getPostById(id) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user_profiles!inner ( id, first_name, last_name, avatar_url ),
      comments (
        id,
        content,
        created_at,
        user_profiles ( id, first_name, last_name, avatar_url )
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return {
    ...data,
    comments: data.comments ?? []
  }
}