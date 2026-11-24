import { ref } from 'vue'
import { likePost, unlikePost } from '@/services/posts'

// Me gusta de una salida: cambia al toque y, si el servidor falla, vuelve atrás.
// `post` es reactivo y trae { id, likes, liked_by_me }.
export function usePostLike() {
  const busy = ref(false)
  const error = ref('')

  async function toggle(post) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    const liked = !post.liked_by_me
    post.liked_by_me = liked
    post.likes += liked ? 1 : -1
    try {
      await (liked ? likePost(post.id) : unlikePost(post.id))
    } catch (e) {
      post.liked_by_me = !liked
      post.likes += liked ? -1 : 1
      error.value = e.message
    } finally {
      busy.value = false
    }
  }

  return { toggle, busy, error }
}
