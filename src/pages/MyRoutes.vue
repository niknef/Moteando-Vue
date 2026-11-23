<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import RoutePreview from '@/components/route/RoutePreview.vue'
import { deleteRoute, listMyRoutes, updateRoute } from '@/services/routes'
import { useRouteDraftStore } from '@/stores/routeDraft'
import { formatDuration, formatKm, formatShortDate } from '@/lib/format'
import { downloadGpx, linkShareMessage, openInGoogleMaps, shareRouteWithLink } from '@/lib/share'

defineOptions({ name: 'MyRoutes' })

const router = useRouter()
const draft = useRouteDraftStore()

const routes = ref([])
const loading = ref(true)
const error = ref('')
const deletingId = ref(null)
const notice = ref('')

let noticeTimer
async function shareLink(route) {
  error.value = ''
  try {
    const { status, madePublic } = await shareRouteWithLink(route)
    if (madePublic) route.is_public = true
    notice.value = linkShareMessage(status)
    clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => (notice.value = ''), 2500)
  } catch (e) {
    error.value = e.message
  }
}

const stopsOf = (route) => {
  const stops = Math.max(route.waypoints.length - 2, 0)
  if (!stops) return null
  return stops === 1 ? '1 parada' : `${stops} paradas`
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    routes.value = await listMyRoutes()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const openRoute = (route) => router.push(`/rutas/${route.id}/editar`)

// Contá tu salida: el post cuelga de la ruta, que tiene que ser pública
async function publishRide(route) {
  if (!route.is_public) {
    const question =
      'Para publicarla en la comunidad la ruta tiene que ser pública. ¿Hacerla pública?'
    if (!window.confirm(question)) return
    try {
      await updateRoute(route.id, { is_public: true })
      route.is_public = true
    } catch (e) {
      error.value = e.message
      return
    }
  }
  router.push({ path: '/comunidad/publicar', query: { route: route.id } })
}

async function removeRoute(route) {
  if (!window.confirm(`¿Borrar "${route.name}"? No se puede deshacer.`)) return
  deletingId.value = route.id
  error.value = ''
  try {
    await deleteRoute(route.id)
    routes.value = routes.value.filter((r) => r.id !== route.id)
    // si era la que estaba abierta en el diseñador, el borrador ya no tiene a qué guardar
    if (draft.routeId === route.id) draft.reset()
  } catch (e) {
    error.value = e.message
  } finally {
    deletingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div v-if="loading" class="grid h-full place-items-center">
    <Loader size="lg" />
  </div>

  <!-- Vacío -->
  <div
    v-else-if="!routes.length && !error"
    class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center"
  >
    <span class="flex size-16 items-center justify-center rounded-full bg-primary/15">
      <IconLucide name="Route" :size="30" class="text-primary" />
    </span>
    <h1 class="text-2xl font-semibold tracking-tight">Todavía no tenés rutas</h1>
    <p class="max-w-xs text-muted-foreground">
      Armá tu primera ruta en el mapa y compartila con quien quieras.
    </p>
    <Button as-child class="mt-2 h-12 px-6 text-base font-semibold hover:bg-primary/90">
      <router-link to="/rutas/nueva">Crear ruta</router-link>
    </Button>
  </div>

  <!-- Listado -->
  <div v-else class="mx-auto w-full max-w-2xl px-4 py-6 lg:py-10">
    <header class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Mis rutas</h1>
        <p class="text-sm text-muted-foreground">
          {{ routes.length === 1 ? '1 ruta' : `${routes.length} rutas` }}
        </p>
      </div>
      <Button as-child size="lg">
        <router-link to="/rutas/nueva">
          <IconLucide name="Plus" :size="16" />
          Nueva ruta
        </router-link>
      </Button>
    </header>

    <BaseAlert :message="error" type="error" class="mb-4" />
    <BaseAlert :message="notice" type="success" class="mb-4" />

    <ul class="space-y-3">
      <li
        v-for="route in routes"
        :key="route.id"
        class="relative flex items-center gap-4 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/40"
        :class="{ 'pointer-events-none opacity-50': deletingId === route.id }"
      >
        <RoutePreview :geometry="route.geometry" class="size-20 shrink-0 rounded-lg" />

        <div class="min-w-0 flex-1">
          <!-- el link cubre toda la tarjeta; el menú queda por encima -->
          <router-link
            :to="`/rutas/${route.id}/editar`"
            class="block truncate font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {{ route.name }}
          </router-link>
          <p class="mt-0.5 text-sm text-muted-foreground">
            {{ formatKm(route.distance_km) }} · {{ formatDuration(route.duration_min) }}
            <template v-if="stopsOf(route)"> · {{ stopsOf(route) }}</template>
          </p>
          <p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconLucide :name="route.is_public ? 'Globe' : 'Lock'" :size="12" />
            {{ route.is_public ? 'Pública' : 'Privada' }} · {{ formatShortDate(route.updated_at) }}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="relative z-10"
              :aria-label="`Opciones de ${route.name}`"
            >
              <IconLucide name="EllipsisVertical" :size="16" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="openRoute(route)">
              <IconLucide name="PencilLine" :size="16" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem @select="publishRide(route)">
              <IconLucide name="Newspaper" :size="16" />
              Contá tu salida
            </DropdownMenuItem>
            <DropdownMenuItem @select="shareLink(route)">
              <IconLucide name="Share2" :size="16" />
              Compartir link
            </DropdownMenuItem>
            <DropdownMenuItem @select="openInGoogleMaps(route)">
              <IconLucide name="ExternalLink" :size="16" />
              Abrir en Google Maps
            </DropdownMenuItem>
            <DropdownMenuItem @select="downloadGpx(route)">
              <IconLucide name="Download" :size="16" />
              Descargar GPX
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" @select="removeRoute(route)">
              <IconLucide name="Trash2" :size="16" />
              Borrar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    </ul>
  </div>
</template>
