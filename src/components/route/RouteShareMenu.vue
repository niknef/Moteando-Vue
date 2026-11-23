<script setup>
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import IconLucide from '@/components/ui/IconLucide.vue'
import { downloadGpx, openInGoogleMaps, shareRouteWithLink } from '@/lib/share'

// Menú "Compartir" de una ruta: link público, Google Maps, GPX y (opcional) publicar en la comunidad.
// El botón que lo abre va en el slot.

const props = defineProps({
  // { id?, name, is_public?, description?, waypoints, options?, geometry? }
  route: { type: Object, required: true },
  canPublish: { type: Boolean, default: false },
})
// link-shared: { status, madePublic } · error: mensaje
// need-save: la ruta no está guardada; el padre la guarda y después ofrece el link
const emit = defineEmits(['publish', 'link-shared', 'error', 'need-save'])

async function shareLink() {
  if (!props.route.id) {
    emit('need-save')
    return
  }
  try {
    emit('link-shared', await shareRouteWithLink(props.route))
  } catch (e) {
    emit('error', e.message)
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <slot />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-56">
      <DropdownMenuItem @select="shareLink">
        <IconLucide name="Share2" :size="16" />
        <span class="flex flex-col">
          Compartir link
          <span v-if="!route.id" class="text-xs text-muted-foreground"
            >Se guarda y se comparte</span
          >
        </span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
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
