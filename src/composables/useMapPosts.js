// composables/useMapPosts.js
import { ref, watchEffect } from 'vue'
import { getPostsBBOX } from '@/services/posts'

export function useMapPosts (mapRef) {
  const posts = ref([])

  /* cada vez que cambia el BBOX del mapa ⇒ fetch */
  watchEffect(async (onInvalidate) => {
    if (!mapRef.value) return
    const bbox = mapRef.value.getBounds().toArray().flat()
    const controller = new AbortController()
    onInvalidate(() => controller.abort())

    posts.value = await getPostsBBOX(bbox)
  })

  return { posts }
}
