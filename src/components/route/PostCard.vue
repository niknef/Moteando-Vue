<script setup>
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import IconLucide from '@/components/ui/IconLucide.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import PostPhotos from '@/components/route/PostPhotos.vue'
import PostRouteCard from '@/components/route/PostRouteCard.vue'
import { usePostLike } from '@/composables/usePostLike'
import { formatDuration, formatKm } from '@/lib/format'
import { authorName, legacyDuration, legacyRouteQuery, postDateText, postTitle } from '@/lib/post'

// Tarjeta de una salida en el feed (Descubrir › Salidas). Toda la tarjeta lleva al detalle;
// autor, fotos, ruta y acciones quedan por encima del link.

const props = defineProps({
  // salida de getLastPosts (con user_profiles, routes, likes, comments, liked_by_me)
  post: { type: Object, required: true },
})

const { toggle, busy } = usePostLike()

const facts = computed(() => {
  const r = props.post.routes
  if (r) return `${formatKm(r.distance_km)} · ${formatDuration(r.duration_min)}`
  return legacyDuration(props.post.duration)
})
const legacyQuery = computed(() => (props.post.routes ? null : legacyRouteQuery(props.post)))
const detail = computed(() => `/comunidad/${props.post.id}`)
</script>

<template>
  <article
    class="relative overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-muted-foreground/40"
  >
    <!-- Autor y puntaje -->
    <header class="flex items-center gap-3 px-4 pt-4">
      <router-link
        :to="`/usuario/${post.user_profiles?.id}`"
        class="relative z-10 flex min-w-0 items-center gap-3 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <UserAvatar :profile="post.user_profiles" />
        <span class="min-w-0">
          <span class="block truncate text-sm font-medium hover:text-primary">
            {{ authorName(post) }}
          </span>
          <span class="block text-xs text-muted-foreground">{{ postDateText(post) }}</span>
        </span>
      </router-link>
      <span
        v-if="post.rating"
        class="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-sm"
        :aria-label="`Puntaje ${post.rating} de 5`"
      >
        <IconLucide name="Star" :size="14" class="fill-current text-rating" />
        {{ Number(post.rating).toLocaleString('es-AR') }}
      </span>
    </header>

    <!-- Fotos (sin fotos, la tarjeta de la ruta de abajo ya muestra el recorrido) -->
    <div v-if="post.photos?.length || post.image_url" class="relative z-10 mt-3 px-4">
      <PostPhotos
        :photos="post.photos"
        :image-url="post.image_url"
        :alt="`Foto de ${postTitle(post)}`"
      />
    </div>

    <!-- Título, datos y relato -->
    <div class="px-4 pt-3">
      <h3 class="text-lg leading-snug font-semibold tracking-tight">
        <router-link
          :to="detail"
          class="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {{ postTitle(post) }}
        </router-link>
      </h3>
      <p v-if="facts" class="mt-0.5 text-sm text-muted-foreground">{{ facts }}</p>
      <p
        v-if="post.description"
        class="mt-2 line-clamp-3 text-[15px] whitespace-pre-line text-foreground/85"
      >
        {{ post.description }}
      </p>
    </div>

    <!-- Ruta vinculada -->
    <PostRouteCard v-if="post.routes" :route="post.routes" class="relative z-10 mx-4 mt-3" />

    <!-- Acciones -->
    <footer class="relative z-10 mt-2 flex items-center gap-1 px-2 pb-2">
      <Button
        variant="ghost"
        class="h-11 gap-1.5 px-3"
        :class="post.liked_by_me ? 'text-primary hover:text-primary' : 'text-muted-foreground'"
        :aria-pressed="post.liked_by_me"
        :aria-label="post.liked_by_me ? 'Quitar me gusta' : 'Me gusta'"
        :disabled="busy"
        @click="toggle(post)"
      >
        <IconLucide name="Heart" :size="18" :class="{ 'fill-current': post.liked_by_me }" />
        {{ post.likes }}
      </Button>
      <Button as-child variant="ghost" class="h-11 gap-1.5 px-3 text-muted-foreground">
        <router-link :to="`${detail}#comentarios`" :aria-label="`${post.comments} comentarios`">
          <IconLucide name="MessageCircle" :size="18" />
          {{ post.comments }}
        </router-link>
      </Button>
      <Button
        v-if="legacyQuery"
        as-child
        variant="ghost"
        class="ml-auto h-11 gap-1.5 px-3 text-muted-foreground"
      >
        <router-link :to="{ path: '/rutas/nueva', query: legacyQuery }">
          <IconLucide name="Copy" :size="16" />
          Armar esta ruta
        </router-link>
      </Button>
    </footer>
  </article>
</template>
