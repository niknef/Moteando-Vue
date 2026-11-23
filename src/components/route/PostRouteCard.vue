<script setup>
import RoutePreview from '@/components/route/RoutePreview.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import { formatDuration, formatKm } from '@/lib/format'

// Ruta vinculada a un post: vista previa y link a su página pública.

defineProps({
  // { id, name, geometry, distance_km, duration_min }
  route: { type: Object, required: true },
})
</script>

<template>
  <router-link
    :to="`/r/${route.id}`"
    class="flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3 transition-colors hover:bg-accent/40"
  >
    <RoutePreview :geometry="route.geometry" class="size-16 shrink-0 rounded-lg" />
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{{ route.name }}</p>
      <p class="text-xs text-muted-foreground">
        {{ formatKm(route.distance_km) }} · {{ formatDuration(route.duration_min) }}
      </p>
    </div>
    <span class="flex shrink-0 items-center gap-1 text-sm text-primary">
      Ver ruta
      <IconLucide name="ExternalLink" :size="14" />
    </span>
  </router-link>
</template>
