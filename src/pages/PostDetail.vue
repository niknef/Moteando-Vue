<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import PostPhotos from '@/components/route/PostPhotos.vue'
import PostRouteCard from '@/components/route/PostRouteCard.vue'
import { getPostById } from '@/services/posts'
import {
  createComment,
  deleteComment,
  getCommentsByPost,
  subscribeToNewComments,
} from '@/services/comments'
import { usePostLike } from '@/composables/usePostLike'
import { useAuthStore } from '@/stores/auth'
import { formatDuration, formatKm, formatRelative } from '@/lib/format'
import { authorName, legacyDuration, legacyRouteQuery, postDateText, postTitle } from '@/lib/post'

// Detalle de una salida: fotos, relato, ruta, me gusta y comentarios en tiempo real.

const MAX_COMMENT = 500

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { toggle, busy: likeBusy, error: likeError } = usePostLike()

const post = ref(null)
const comments = ref([])
const loading = ref(true)
const error = ref('')

const draft = ref('')
const sending = ref(false)
const commentError = ref('')
const commentsEl = ref(null)

let channel = null

const facts = computed(() => {
  const r = post.value?.routes
  if (r) return `${formatKm(r.distance_km)} · ${formatDuration(r.duration_min)}`
  return legacyDuration(post.value?.duration)
})
const legacyQuery = computed(() =>
  post.value && !post.value.routes ? legacyRouteQuery(post.value) : null,
)

// Volver a donde estaba (Descubrir, un perfil…); si entró directo por link, a Salidas
function goBack() {
  if (window.history.state?.back) router.back()
  else router.push({ path: '/descubrir', query: { tab: 'salidas' } })
}

function addComment(c) {
  if (!comments.value.some((x) => x.id === c.id)) comments.value.push(c)
}

async function submitComment() {
  const content = draft.value.trim()
  if (!content || sending.value) return
  sending.value = true
  commentError.value = ''
  try {
    addComment(await createComment({ post_id: post.value.id, content }))
    draft.value = ''
    await nextTick()
    commentsEl.value?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } catch (e) {
    commentError.value = e.message
  } finally {
    sending.value = false
  }
}

// Enter envía; Shift+Enter hace un salto de línea
function onComposerKey(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    submitComment()
  }
}

async function removeComment(c) {
  if (!window.confirm('¿Borrar tu comentario?')) return
  try {
    await deleteComment(c.id)
    comments.value = comments.value.filter((x) => x.id !== c.id)
  } catch {
    commentError.value = 'No se pudo borrar el comentario'
  }
}

onMounted(async () => {
  const id = route.params.id
  try {
    ;[post.value, comments.value] = await Promise.all([getPostById(id), getCommentsByPost(id)])
    channel = subscribeToNewComments(id, addComment)
    // desde el feed, "comentarios" lleva directo a la conversación
    if (route.hash === '#comentarios') {
      await nextTick()
      document.getElementById('comentarios')?.scrollIntoView()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => channel?.unsubscribe())
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 pt-3 pb-6 lg:pt-8">
    <Button variant="ghost" class="-ml-3 h-11 text-muted-foreground" @click="goBack">
      <IconLucide name="ArrowLeft" :size="18" />
      Volver
    </Button>

    <div v-if="loading" class="grid place-items-center py-20"><Loader size="lg" /></div>
    <BaseAlert v-else-if="error" :message="error" type="error" class="mt-4" />

    <template v-else>
      <article class="mt-2">
        <!-- Autor -->
        <header class="flex items-center gap-3">
          <router-link
            :to="`/usuario/${post.user_profiles?.id}`"
            class="flex min-w-0 items-center gap-3"
          >
            <UserAvatar :profile="post.user_profiles" size="size-11 text-sm" />
            <span class="min-w-0">
              <span class="block truncate font-medium hover:text-primary">
                {{ authorName(post) }}
              </span>
              <span class="block text-sm text-muted-foreground">{{ postDateText(post) }}</span>
            </span>
          </router-link>
          <span
            v-if="post.rating"
            class="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5"
            :aria-label="`Puntaje ${post.rating} de 5`"
          >
            <IconLucide name="Star" :size="16" class="fill-current text-rating" />
            {{ Number(post.rating).toLocaleString('es-AR') }}
          </span>
        </header>

        <h1 class="mt-5 text-2xl leading-tight font-semibold tracking-tight lg:text-3xl">
          {{ postTitle(post) }}
        </h1>
        <p v-if="facts" class="mt-1 text-muted-foreground">{{ facts }}</p>

        <!-- Fotos (sin fotos, la tarjeta de la ruta de abajo ya muestra el recorrido) -->
        <PostPhotos
          v-if="post.photos?.length || post.image_url"
          :photos="post.photos"
          :image-url="post.image_url"
          :alt="`Foto de ${postTitle(post)}`"
          class="mt-4"
        />

        <p
          v-if="post.description"
          class="mt-4 text-[17px] leading-relaxed whitespace-pre-line text-foreground/90"
        >
          {{ post.description }}
        </p>

        <!-- La ruta: la guardada, o salida y llegada en los posts viejos -->
        <PostRouteCard v-if="post.routes" :route="post.routes" class="mt-5" />
        <div v-else-if="post.start_point || post.end_point" class="mt-5 rounded-xl bg-muted p-4">
          <ul class="space-y-2 text-sm">
            <li class="flex gap-2">
              <span
                class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-teal text-[10px] font-bold"
                >A</span
              >
              <span class="min-w-0 break-words">{{ post.start_point }}</span>
            </li>
            <li class="flex gap-2">
              <span
                class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                >B</span
              >
              <span class="min-w-0 break-words">{{ post.end_point }}</span>
            </li>
          </ul>
          <Button v-if="legacyQuery" as-child variant="outline" class="mt-3 w-full">
            <router-link :to="{ path: '/rutas/nueva', query: legacyQuery }">
              <IconLucide name="Copy" :size="16" />
              Armar esta ruta
            </router-link>
          </Button>
        </div>

        <!-- Me gusta -->
        <div class="mt-4 flex items-center gap-1 border-y border-border py-1">
          <Button
            variant="ghost"
            class="h-11 gap-1.5 px-3"
            :class="post.liked_by_me ? 'text-primary hover:text-primary' : 'text-muted-foreground'"
            :aria-pressed="post.liked_by_me"
            :disabled="likeBusy"
            @click="toggle(post)"
          >
            <IconLucide name="Heart" :size="18" :class="{ 'fill-current': post.liked_by_me }" />
            {{ post.likes === 1 ? '1 me gusta' : `${post.likes} me gusta` }}
          </Button>
          <span class="ml-auto pr-3 text-sm text-muted-foreground">
            {{ comments.length === 1 ? '1 comentario' : `${comments.length} comentarios` }}
          </span>
        </div>
        <p v-if="likeError" class="mt-2 text-sm text-destructive">{{ likeError }}</p>
      </article>

      <!-- Comentarios -->
      <section id="comentarios" class="mt-6 scroll-mt-4" aria-label="Comentarios">
        <h2 class="text-lg font-semibold">Comentarios</h2>

        <p v-if="!comments.length" class="mt-3 text-sm text-muted-foreground">
          Todavía no hay comentarios. ¿Hiciste esta ruta? Contá cómo te fue.
        </p>
        <ul v-else ref="commentsEl" class="mt-3 space-y-4">
          <li v-for="c in comments" :key="c.id" class="flex gap-3">
            <router-link :to="`/usuario/${c.user_profiles?.id}`" class="shrink-0">
              <UserAvatar :profile="c.user_profiles" size="size-9 text-xs" />
            </router-link>
            <div class="min-w-0 flex-1">
              <p class="flex items-baseline gap-2 text-sm">
                <router-link
                  :to="`/usuario/${c.user_profiles?.id}`"
                  class="truncate font-medium hover:text-primary"
                >
                  {{ authorName(c) }}
                </router-link>
                <time :datetime="c.created_at" class="shrink-0 text-xs text-muted-foreground">
                  {{ formatRelative(c.created_at) }}
                </time>
                <button
                  v-if="c.user_id === auth.user?.id"
                  type="button"
                  class="-my-2 ml-auto grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-destructive"
                  aria-label="Borrar mi comentario"
                  @click="removeComment(c)"
                >
                  <IconLucide name="Trash2" :size="14" />
                </button>
              </p>
              <p class="mt-0.5 text-[15px] break-words whitespace-pre-line">{{ c.content }}</p>
            </div>
          </li>
        </ul>
      </section>

      <!-- Escribir: queda abajo mientras se lee -->
      <form
        class="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-background/95 px-4 pt-3 pb-3 backdrop-blur"
        @submit.prevent="submitComment"
      >
        <div class="flex items-end gap-2">
          <UserAvatar :profile="auth.profile" size="size-9 text-xs" class="mb-1 hidden sm:grid" />
          <Textarea
            v-model="draft"
            rows="1"
            :maxlength="MAX_COMMENT"
            placeholder="Escribí un comentario…"
            aria-label="Escribí un comentario"
            class="max-h-32 min-h-11 flex-1 resize-none py-2.5"
            @keydown="onComposerKey"
          />
          <Button
            type="submit"
            size="icon"
            class="size-11 shrink-0 rounded-full"
            :disabled="!draft.trim() || sending"
            aria-label="Enviar comentario"
          >
            <IconLucide
              :name="sending ? 'LoaderCircle' : 'SendHorizontal'"
              :size="18"
              :class="{ 'animate-spin': sending }"
            />
          </Button>
        </div>
        <p v-if="commentError" class="mt-2 text-sm text-destructive" role="alert">
          {{ commentError }}
        </p>
      </form>
    </template>
  </div>
</template>
