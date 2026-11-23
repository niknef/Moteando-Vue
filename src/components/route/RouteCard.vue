<script setup>
import { computed } from 'vue'
import RoutePreview from '@/components/route/RoutePreview.vue'
import { formatDuration, formatKm } from '@/lib/format'

// Tarjeta de una ruta pública (Explorar, perfiles): lleva a su página /r/:id.

const props = defineProps({
  // fila de `routes`, con `author` opcional ({ first_name, last_name, avatar_url })
  route: { type: Object, required: true },
  showAuthor: { type: Boolean, default: true },
})

const stops = computed(() => Math.max(props.route.waypoints.length - 2, 0))
const authorName = computed(() =>
  [props.route.author?.first_name, props.route.author?.last_name].filter(Boolean).join(' '),
)
</script>

<template>
  <router-link
    :to="`/r/${route.id}`"
    class="flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
  >
    <RoutePreview :geometry="route.geometry" class="size-20 shrink-0 rounded-lg" />
    <div class="min-w-0 flex-1">
      <p class="truncate font-medium">{{ route.name }}</p>
      <p class="mt-0.5 text-sm text-muted-foreground">
        {{ formatKm(route.distance_km) }} · {{ formatDuration(route.duration_min) }}
        <template v-if="stops"> · {{ stops === 1 ? '1 parada' : `${stops} paradas` }}</template>
      </p>
      <p
        v-if="showAuthor && authorName"
        class="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <img
          v-if="route.author.avatar_url"
          :src="route.author.avatar_url"
          alt=""
          class="size-4 rounded-full object-cover"
          @error="(e) => e.target.remove()"
        />
        {{ authorName }}
      </p>
    </div>
  </router-link>
</template>
