<script setup>
import { Marker } from 'maplibre-gl'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import Logo from '@/assets/moteando.svg'
import Loader from '@/components/ui/Loader.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import { Button } from '@/components/ui/button'
import { useMap } from '@/composables/useMap'
import { getRouteById } from '@/services/routes'
import { useAuthStore } from '@/stores/auth'
import { formatDuration, formatKm } from '@/lib/format'
import { downloadGpx, linkShareMessage, openInGoogleMaps, shareRouteLink } from '@/lib/share'
import { boundsOf, setRouteLine, waypointMarkerElement } from '@/lib/map-route'

// Página pública de una ruta (/r/:id): se abre sin cuenta desde un link compartido.
// RLS solo deja leer las rutas públicas (o las propias, si quien la abre es el dueño).

defineOptions({ name: 'PublicRoute' })

const ROUTE_SOURCE = 'public-route'
const DESKTOP = '(min-width: 1024px)'

const route = useRoute()
const auth = useAuthStore()
const { map, init } = useMap()

const mapContainer = ref(null)
const card = ref(null)
const data = ref(null)
const loading = ref(true)
const notFound = ref(false)
const toast = ref('')
let markers = []

const isOwner = computed(() => !!auth.user && data.value?.user_id === auth.user.id)
const stops = computed(() => Math.max((data.value?.waypoints.length ?? 0) - 2, 0))
const facts = computed(() => {
  if (!data.value) return ''
  const parts = [formatKm(data.value.distance_km), formatDuration(data.value.duration_min)]
  if (stops.value) parts.push(stops.value === 1 ? '1 parada' : `${stops.value} paradas`)
  return parts.join(' · ')
})

/* ───────── Mapa ───────── */
function mapPadding() {
  if (window.matchMedia(DESKTOP).matches) return { top: 48, right: 48, bottom: 48, left: 448 }
  const cardHeight = card.value?.offsetHeight ?? 0
  const mapHeight = mapContainer.value?.offsetHeight ?? 0
  return { top: 96, right: 32, bottom: Math.min(cardHeight, mapHeight * 0.6) + 24, left: 32 }
}

function fitRoute(duration = 600) {
  const coords = data.value?.geometry.coordinates
  if (map.value && coords?.length > 1) {
    map.value.fitBounds(boundsOf(coords), { padding: mapPadding(), maxZoom: 15, duration })
  }
}

function drawOnMap() {
  const m = map.value
  setRouteLine(m, ROUTE_SOURCE, data.value.geometry)
  const list = data.value.waypoints
  markers = list.map((wp, i) =>
    new Marker({ element: waypointMarkerElement(i, list.length) })
      .setLngLat([wp.lng, wp.lat])
      .addTo(m),
  )
  fitRoute(0)
}

function whenMapReady(fn) {
  if (map.value.loaded()) fn()
  else map.value.once('load', fn)
}

/* ───────── Compartir ───────── */
let toastTimer
function showToast(text) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2500)
}

async function shareLink() {
  try {
    const text = linkShareMessage(await shareRouteLink(data.value))
    if (text) showToast(text)
  } catch (e) {
    showToast(e.message)
  }
}

/* ───────── Carga ───────── */
onMounted(async () => {
  init(mapContainer.value)
  try {
    data.value = await getRouteById(route.params.id)
    document.title = `${data.value.name} · Moteando`
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
  if (data.value) whenMapReady(drawOnMap)
})

onBeforeUnmount(() => {
  markers.forEach((m) => m.remove())
  document.title = 'Moteando'
})
</script>

<template>
  <div class="relative h-dvh overflow-hidden bg-surface-deep">
    <!-- MapLibre le pone position: relative: el alto sale de h-full -->
    <div ref="mapContainer" class="absolute inset-0 h-full w-full" />

    <!-- Marca arriba -->
    <router-link
      to="/"
      class="absolute top-3 left-3 z-10 flex items-center rounded-full bg-card/90 px-3 py-2 shadow-lg backdrop-blur lg:left-[25rem]"
      aria-label="Ir a Moteando"
    >
      <img :src="Logo" alt="Moteando" class="h-6 w-auto" />
    </router-link>

    <p
      v-if="toast"
      class="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm shadow-lg"
      role="status"
    >
      <IconLucide name="CheckCircle2" :size="16" class="text-primary" />
      {{ toast }}
    </p>

    <div v-if="loading" class="absolute inset-0 z-20 grid place-items-center">
      <Loader size="lg" />
    </div>

    <!-- No existe o es privada -->
    <div
      v-else-if="notFound"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/90 px-6 text-center"
    >
      <span class="flex size-16 items-center justify-center rounded-full bg-primary/15">
        <IconLucide name="Lock" :size="28" class="text-primary" />
      </span>
      <h1 class="text-2xl font-semibold tracking-tight">Esta ruta no está disponible</h1>
      <p class="max-w-xs text-muted-foreground">
        No existe o su dueño la tiene privada. Pedile que la haga pública para verla.
      </p>
      <Button as-child size="lg" class="mt-2">
        <router-link to="/">Ir a Moteando</router-link>
      </Button>
    </div>

    <!-- Tarjeta de la ruta: abajo en mobile, columna a la izquierda en desktop -->
    <section
      v-else
      ref="card"
      class="absolute inset-x-0 bottom-0 z-10 flex max-h-[60%] flex-col rounded-t-2xl border-t border-border bg-card shadow-2xl lg:inset-y-4 lg:right-auto lg:left-4 lg:max-h-none lg:w-96 lg:rounded-2xl lg:border"
      aria-label="Datos de la ruta"
    >
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h1 class="text-xl font-semibold tracking-tight">{{ data.name }}</h1>
          <p class="mt-1 text-sm text-muted-foreground">{{ facts }}</p>
        </div>

        <p v-if="data.description" class="text-sm whitespace-pre-line">{{ data.description }}</p>

        <ol class="space-y-1 text-sm">
          <li v-for="(wp, i) in data.waypoints" :key="i" class="flex items-center gap-2">
            <span
              class="grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
              :class="
                i === 0 ? 'bg-brand-teal text-foreground' : 'bg-primary text-primary-foreground'
              "
              aria-hidden="true"
            >
              {{ i === 0 ? 'A' : i === data.waypoints.length - 1 ? 'B' : i }}
            </span>
            <span class="truncate">{{ wp.label || 'Punto sin nombre' }}</span>
          </li>
        </ol>
      </div>

      <div class="shrink-0 space-y-2 border-t border-border p-4">
        <Button size="lg" class="w-full" @click="openInGoogleMaps(data)">
          <IconLucide name="ExternalLink" :size="16" />
          Abrir en Google Maps
        </Button>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" @click="downloadGpx(data)">
            <IconLucide name="Download" :size="16" />
            GPX
          </Button>
          <Button variant="outline" size="lg" @click="shareLink">
            <IconLucide name="Share2" :size="16" />
            Compartir
          </Button>
        </div>
        <Button v-if="isOwner" variant="ghost" size="lg" class="w-full" as-child>
          <router-link :to="`/rutas/${data.id}/editar`">
            <IconLucide name="PencilLine" :size="16" />
            Editar mi ruta
          </router-link>
        </Button>
        <p v-else-if="!auth.isLoggedIn" class="pt-1 text-center text-xs text-muted-foreground">
          ¿Querés armar tus propias rutas?
          <router-link to="/registro" class="text-primary underline-offset-4 hover:underline">
            Creá tu cuenta
          </router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<style>
@import 'maplibre-gl/dist/maplibre-gl.css';
</style>
