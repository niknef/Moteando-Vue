<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'

import { getPostById, likePost, unlikePost } from '@/services/posts'
import { getCommentsByPost, createComment, subscribeToNewComments } from '@/services/comments'

import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import Loader from '@/components/ui/Loader.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import PostRouteCard from '@/components/route/PostRouteCard.vue'
import PostPhotos from '@/components/route/PostPhotos.vue'
import { formatShortDate } from '@/lib/format'

const route = useRoute()

const post = ref(null)
const comments = ref([])
const newComment = ref('')

const loading = ref(true)
const error = ref(null)

const commentLoading = ref(false)
const commentSuccess = ref(false)
const commentError = ref(null)

const commentsContainer = ref(null)

let channel = null

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

function scrollToBottom() {
  if (commentsContainer.value) {
    commentsContainer.value.scrollTo({
      top: commentsContainer.value.scrollHeight,
      behavior: 'smooth',
    })
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return

  commentLoading.value = true
  commentSuccess.value = false
  commentError.value = null

  try {
    await createComment({
      post_id: post.value.id,
      content: newComment.value.trim(),
    })

    newComment.value = ''
    commentSuccess.value = true
    setTimeout(() => (commentSuccess.value = false), 2000)
  } catch (e) {
    commentError.value = 'No se pudo enviar el comentario.'
    console.error('[submitComment] Error:', e)
  } finally {
    commentLoading.value = false
  }
}

function copyRoute() {
  const texto = `Origen: ${post.value.start_point} - Destino: ${post.value.end_point}`
  navigator.clipboard
    .writeText(texto)
    .then(() => console.log('Ruta copiada:', texto))
    .catch((err) => console.error('Error al copiar', err))
}

async function toggleLike() {
  try {
    if (post.value.liked_by_me) {
      await unlikePost(post.value.id)
      post.value.likes--
      post.value.liked_by_me = false
    } else {
      await likePost(post.value.id)
      post.value.likes++
      post.value.liked_by_me = true
    }
  } catch (e) {
    console.error('[toggleLike]', e)
  }
}

onMounted(async () => {
  try {
    const id = route.params.id
    post.value = await getPostById(id)
    comments.value = await getCommentsByPost(id)

    await nextTick()
    scrollToBottom()

    // ✅ Suscripción real-time corregida
    channel = subscribeToNewComments(id, async (comment) => {
      comments.value.push(comment)
      await nextTick()
      scrollToBottom()
    })
  } catch (e) {
    error.value = 'No se pudo cargar el post.'
    console.error('[PostDetail] Error:', e)
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  channel?.unsubscribe()
})
</script>

<template>
  <section class="max-w-4xl mx-auto mt-8 px-4 text-foreground">
    <div class="mb-6 flex justify-between items-center">
      <BaseHeading1>Detalle del Post</BaseHeading1>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-40">
      <Loader class="w-10 h-10" />
    </div>

    <div v-else-if="error" class="text-destructive text-center">{{ error }}</div>

    <div v-else class="bg-card p-6 rounded-lg shadow space-y-4">
      <!-- Usuario -->
      <div class="flex items-center gap-4 mb-3">
        <img
          :src="post.user_profiles?.avatar_url || '/assets/user.jpg'"
          alt="Avatar"
          class="w-10 h-10 rounded-full object-cover border"
        />
        <div>
          <router-link
            :to="`/usuario/${post.user_profiles?.id}`"
            class="font-semibold hover:underline hover:text-primary"
          >
            {{ post.user_profiles?.first_name }} {{ post.user_profiles?.last_name }}
          </router-link>
          <p class="text-sm text-muted-foreground">
            {{
              post.ride_date
                ? `Salió el ${formatShortDate(post.ride_date + 'T12:00')}`
                : formatShortDate(post.created_at)
            }}
          </p>
        </div>
      </div>
      <!-- Nombre de la ruta -->
      <h2 class="text-2xl font-bold text-primary mb-4">{{ post.route_name }}</h2>

      <PostRouteCard v-if="post.routes" :route="post.routes" class="mb-4" />

      <!-- Info + Imagen -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="md:col-span-2 space-y-2">
          <!-- los posts viejos guardaban coordenadas como nombre: se muestran como dato secundario -->
          <p class="flex items-center gap-2 text-sm text-foreground/80">
            <IconLucide name="MapPin" :size="18" class="text-brand-teal" />
            <span class="text-muted-foreground">Salida:</span> {{ post.start_point }}
          </p>
          <p class="flex items-center gap-2 text-sm text-foreground/80">
            <IconLucide name="MapPin" :size="18" class="text-primary" />
            <span class="text-muted-foreground">Llegada:</span> {{ post.end_point }}
          </p>
          <p class="text-sm text-foreground/80 flex items-center gap-2">
            <IconLucide name="Clock" :size="18" /> {{ formatDuration(post.duration) }}
          </p>
          <p class="text-sm text-foreground/80 flex items-center gap-2">
            <IconLucide name="Star" :size="18" class="text-rating" /> {{ post.rating }}/5
          </p>
          <p
            class="bg-muted text-foreground p-3 rounded-r-lg border-l-4 border-primary italic shadow-sm"
          >
            {{ post.description }}
          </p>
        </div>

        <PostPhotos
          :photos="post.photos"
          :image-url="post.image_url"
          :alt="`Foto de ${post.route_name}`"
        />
      </div>

      <!-- Acciones -->
      <div class="flex flex-wrap gap-4 justify-end text-sm mb-4">
        <button class="flex items-center gap-1 hover:underline" @click="copyRoute">
          <IconLucide name="Copy" :size="16" /> Copiar ruta
        </button>

        <button
          class="flex items-center gap-1"
          :class="post.liked_by_me ? 'text-primary' : 'text-muted-foreground'"
          @click="toggleLike"
        >
          <IconLucide :name="post.liked_by_me ? 'Heart' : 'Heart'" :size="16" />
          {{ post.likes }}
        </button>
      </div>

      <!-- Comentarios -->
      <h2 class="text-xl font-semibold text-primary mb-4">Comentarios</h2>
      <div ref="commentsContainer" class="max-h-60 overflow-y-auto pr-2 space-y-4 mb-6">
        <div v-for="c in comments" :key="c.id" class="bg-muted p-3 rounded-lg">
          <div class="flex items-start gap-3">
            <img
              :src="c.user_profiles?.avatar_url || '/assets/user.jpg'"
              class="w-8 h-8 rounded-full object-cover border"
              alt="Avatar"
            />
            <div class="flex-1">
              <p class="text-sm font-semibold text-primary">
                <router-link :to="`/usuario/${c.user_profiles?.id}`" class="hover:underline">
                  {{ c.user_profiles?.first_name || 'Sin nombre' }}
                  {{ c.user_profiles?.last_name || '' }}
                </router-link>
                <span class="text-xs text-muted-foreground ml-2">{{
                  new Date(c.created_at).toLocaleString()
                }}</span>
              </p>
              <p class="text-sm text-foreground mt-1">{{ c.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <div>
        <textarea
          v-model="newComment"
          class="w-full p-3 bg-muted rounded-lg text-foreground"
          placeholder="Escribí tu comentario..."
        ></textarea>
        <div class="flex justify-end gap-4 mt-2">
          <!-- router-link y no <a href>: volver sin recargar toda la app (bug B9) -->
          <router-link
            :to="{ path: '/descubrir', query: { tab: 'salidas' } }"
            class="flex items-center gap-2 text-sm bg-secondary hover:bg-accent px-4 py-2 rounded-lg"
          >
            <IconLucide name="ArrowLeft" :size="20" /> Volver
          </router-link>
          <button
            :disabled="commentLoading"
            class="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm transition"
            @click="submitComment"
          >
            <template v-if="commentLoading">
              <Loader class="w-4 h-4 border-2 inline" /> Enviando...
            </template>
            <template v-else> Enviar comentario </template>
          </button>
        </div>
        <div class="mt-2">
          <BaseAlert v-if="commentSuccess" type="success" message="Comentario enviado con éxito." />
          <BaseAlert v-if="commentError" type="error" :message="commentError" />
        </div>
      </div>
    </div>
  </section>
</template>
