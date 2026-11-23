<script setup>
import { computed } from 'vue'
import RoutePreview from '@/components/route/RoutePreview.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import { formatDuration, formatKm } from '@/lib/format'

// Tarjeta de una ruta pública (Descubrir, perfiles): toda la tarjeta lleva a /r/:id.
// El slot "actions" queda por encima del link (por ejemplo, el botón Guardar).

const props = defineProps({
  // fila de `routes`, con opcionales `author`, `rides` (salidas) y `rating` (promedio)
  route: { type: Object, required: true },
  showAuthor: { type: Boolean, default: true },
})

const stops = computed(() => Math.max(props.route.waypoints.length - 2, 0))
const authorName = computed(() =>
  [props.route.author?.first_name, props.route.author?.last_name].filter(Boolean).join(' '),
)
const avoidsHighways = computed(() => props.route.options?.avoid?.includes('highways'))
</script>

<template>
  <div
    class="relative flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/40"
  >
    <RoutePreview :geometry="route.geometry" class="size-20 shrink-0 rounded-lg" />
    <div class="min-w-0 flex-1">
      <router-link
        :to="`/r/${route.id}`"
        class="block truncate font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
      >
        {{ route.name }}
      </router-link>
      <p class="mt-0.5 text-sm text-muted-foreground">
        {{ formatKm(route.distance_km) }} · {{ formatDuration(route.duration_min) }}
        <template v-if="stops"> · {{ stops === 1 ? '1 parada' : `${stops} paradas` }}</template>
      </p>
      <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span v-if="route.rating" class="flex items-center gap-1">
          <IconLucide name="Star" :size="12" class="fill-current text-rating" />
          {{ route.rating.toLocaleString('es-AR') }}
        </span>
        <span v-if="route.rides" class="flex items-center gap-1">
          <IconLucide name="Users" :size="12" />
          {{ route.rides === 1 ? '1 salida' : `${route.rides} salidas` }}
        </span>
        <span v-if="avoidsHighways">Sin autopista</span>
        <span v-if="showAuthor && authorName" class="flex items-center gap-1.5">
          <img
            v-if="route.author.avatar_url"
            :src="route.author.avatar_url"
            alt=""
            class="size-4 rounded-full object-cover"
            @error="(e) => e.target.remove()"
          />
          {{ authorName }}
        </span>
      </p>
    </div>
    <div v-if="$slots.actions" class="relative z-10 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
