<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import Loader from '@/components/ui/Loader.vue'
import IconLucide from '@/components/ui/IconLucide.vue'

import {
  getLastPosts,
  subscribeToNewPosts,
  likePost,
  unlikePost
} from '@/services/posts'

const posts = ref([])
const loading = ref(true)
const error = ref('')
let channel = null

onMounted(async () => {
  try {
    posts.value = await getLastPosts()
    channel = subscribeToNewPosts(p => posts.value.unshift(p))
  } catch (e) {
    console.error('[PostList]', e)
    error.value = 'No se pudieron cargar las rutas.'
  } finally { loading.value = false }
})

onBeforeUnmount(() => channel?.unsubscribe())

const router = useRouter()

function copyRoute(p) {
  const [lngA, latA] = p.start_geom.coordinates
  const [lngB, latB] = p.end_geom.coordinates

  const texto = `Origen: ${p.start_point} - Destino: ${p.end_point}`
  navigator.clipboard.writeText(texto)
    .then(() => console.log('Ruta copiada:', texto))
    .catch(err => console.error('Error al copiar', err))

  router.push({
    path: '/map',
    query: {
      originLat: latA,
      originLng: lngA,
      destLat: latB,
      destLng: lngB
    }
  })
}

function formatDuration(duration) {
  if (!duration) return '-'

  const parts = duration.split(':')
  const hours = parseInt(parts[0])
  const minutes = parseInt(parts[1])

  let result = ''
  if (hours > 0) result += `${hours} h `
  if (minutes > 0) result += `${minutes} min`
  if (result === '') result = 'Menos de 1 min'
  return result.trim()
}

async function toggleLike(p) {
  try {
    if (p.liked_by_me) {
      await unlikePost(p.id)
      p.likes--; p.liked_by_me = false
    } else {
      await likePost(p.id)
      p.likes++; p.liked_by_me = true
    }
  } catch (e) { console.error('[toggleLike]', e) }
}
</script>

<template>
  <section class="max-w-4xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md">
    <!-- encabezado -->
    <div class="flex justify-between items-center mb-6">
      <BaseHeading1>Posts recientes</BaseHeading1>
      <router-link to="/create-post">
        <BaseButton type="orange" size="sm">
          <template #icon><IconLucide name="Plus" :size="18" /></template>
          Nueva
        </BaseButton>
      </router-link>
    </div>

    <!-- loader / error -->
    <Loader v-if="loading" class="w-16 h-16 border-4 mx-auto my-10" />
    <BaseAlert v-else-if="error" :message="error" type="error" />

    <!-- listado -->
    <template v-else>
      <p v-if="!posts.length" class="text-center text-gray-300">Aún no hay rutas.</p>

      <article v-for="p in posts" :key="p.id"
        class="bg-neutral-700/40 rounded-lg p-5 mb-6 shadow-md flex flex-col gap-4">

        <!-- Datos del usuario -->
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer" @click="router.push(`/usuario/${p.user_profiles?.id}`)">
            <img :src="p.user_profiles?.avatar_url || '/assets/user.jpg'"
              class="w-10 h-10 rounded-full object-cover border" />
            <div>
              <p class="font-semibold hover:text-orange-400">
                {{ p.user_profiles?.first_name }} {{ p.user_profiles?.last_name }}
              </p>
              <p class="text-xs text-gray-400">
                {{ new Date(p.created_at).toLocaleDateString() }}
              </p>
            </div>
          </div>

          <router-link :to="`/posts/${p.id}`">
            <BaseButton type="gray" size="xs">
              <template #icon><IconLucide name="Eye" :size="16" /></template>
              Ver
            </BaseButton>
          </router-link>
        </header>

        <!-- Cuerpo con datos e imagen -->
        <div class="flex flex-col sm:flex-row sm:gap-6">
          <!-- Datos de la ruta -->
          <div class="flex-1">
            <p class="font-medium text-orange-400 flex items-center gap-1 mb-1">
              <IconLucide name="MapPinned" :size="18" /> {{ p.route_name }}
            </p>
            <p class="text-sm text-gray-300 flex items-center gap-1 mb-1">
              <IconLucide name="Clock" :size="18" /> {{ formatDuration(p.duration) }}
            </p>
            <p class="text-sm text-gray-300 flex items-center gap-1 mb-3">
              <IconLucide name="Star" :size="18" class="text-yellow-400" /> {{ p.rating }}/5
            </p>

            <p class="bg-neutral-800/60 p-3 rounded border-l-4 border-orange-500 mb-4">
              {{ p.description }}
            </p>
          </div>

          <!-- Imagen de la ruta -->
          <div v-if="p.image_url" class="sm:w-1/3 flex justify-center sm:justify-end">
            <img :src="p.image_url" alt="Imagen de la ruta"
              class="max-h-60 rounded border cursor-pointer hover:opacity-90 transition w-full object-cover"
              @click="router.push(`/user/${p.user_profiles?.id}`)" />
          </div>
        </div>

        <!-- Acciones -->
        <div class="flex flex-wrap justify-end gap-4 text-sm mt-4">
          <button class="flex items-center gap-1 hover:underline" @click="copyRoute(p)">
            <IconLucide name="Copy" :size="16" /> Copiar ruta
          </button>

          <span class="flex items-center gap-1 text-gray-400">
            <IconLucide name="MessageCircle" :size="16" /> {{ p.comments }}
          </span>

          <button class="flex items-center gap-1"
            :class="p.liked_by_me ? 'text-rose-400' : 'text-gray-400'"
            @click="toggleLike(p)">
            <IconLucide :name="p.liked_by_me ? 'Heart' : 'Heart'" :size="16" :fill="p.liked_by_me ? 'currentColor' : 'none'" />
            {{ p.likes }}
          </button>
        </div>
      </article>
    </template>
  </section>
</template>
