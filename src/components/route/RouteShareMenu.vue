<script setup>
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import IconLucide from '@/components/ui/IconLucide.vue'
import { downloadGpx, openInGoogleMaps } from '@/lib/share'

// Menú "Compartir" de una ruta: Google Maps, GPX y (opcional) publicar en la comunidad.
// El botón que lo abre va en el slot.

defineProps({
  // { name, description?, waypoints, options?, geometry? }
  route: { type: Object, required: true },
  canPublish: { type: Boolean, default: false },
})
const emit = defineEmits(['publish'])
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-56">
      <DropdownMenuItem @select="openInGoogleMaps(route)">
        <IconLucide name="ExternalLink" :size="16" />
        Abrir en Google Maps
      </DropdownMenuItem>
      <DropdownMenuItem @select="downloadGpx(route)">
        <IconLucide name="Download" :size="16" />
        Descargar GPX
      </DropdownMenuItem>
      <template v-if="canPublish">
        <DropdownMenuSeparator />
        <DropdownMenuItem @select="emit('publish')">
          <IconLucide name="Newspaper" :size="16" />
          Publicar en la comunidad
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
