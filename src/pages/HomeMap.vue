<script setup>
import { Marker } from 'maplibre-gl'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import Loader from '@/components/ui/Loader.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import { Button } from '@/components/ui/button'
import RouteSheet from '@/components/route/RouteSheet.vue'
import SaveRouteDialog from '@/components/route/SaveRouteDialog.vue'
import { useMap } from '@/composables/useMap'
import { boundsOf, setRouteLine, waypointMarkerElement } from '@/lib/map-route'
import { useRouteDraftStore } from '@/stores/routeDraft'
import { useAuthStore } from '@/stores/auth'
import { getRouteById, updateRoute } from '@/services/routes'
import { linkShareMessage, shareRouteLink } from '@/lib/share'

// Diseñador de rutas: el mapa ocupa toda la pantalla y el borrador vive en el store.

const ROUTE_SOURCE = 'draft-route'
const DESKTOP = '(min-width: 1024px)'

const mapContainer = ref(null)
const sheet = ref(null)
const sheetExpanded = ref(false)
const mapReady = ref(false)
const notice = ref('')
const success = ref('')
const saveOpen = ref(false)
const loadingRoute = ref(false)

const { map, init } = useMap()
const draft = useRouteDraftStore()
const { routeId, waypoints, result, loading, error } = storeToRefs(draft)
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const banner = computed(() => notice.value || error.value)

/* ───────── Marcadores ───────── */
let markers = []

function syncMarkers() {
  if (!map.value) return
  markers.forEach((m) => m.remove())
  const list = waypoints.value
  markers = list.map((wp, i) => {
    const m = new Marker({
      element: waypointMarkerElement(i, list.length, { draggable: true }),
      draggable: true,
    })
      .setLngLat([wp.lng, wp.lat])
      .addTo(map.value)
    m.on('dragend', () => {
      const { lng, lat } = m.getLngLat()
      draft.moveWaypointTo(wp.id, { lng, lat })
    })
    return m
  })
}

// Solo se rearman si cambian posiciones u orden (no al llegar un nombre)
const markersKey = computed(() => waypoints.value.map((w) => `${w.id}:${w.lng}:${w.lat}`).join('|'))
watch(markersKey, syncMarkers)

/* ───────── Línea de la ruta ───────── */
function drawRoute() {
  if (!map.value) return
  setRouteLine(
    map.value,
    ROUTE_SOURCE,
    result.value?.geometry ?? null,
    result.value?.stats?.unpaved,
  )
}

/* ───────── Encuadre ───────── */
function mapPadding() {
  if (window.matchMedia(DESKTOP).matches) return { top: 48, right: 48, bottom: 48, left: 448 }
  // con el panel grande no queda mapa visible: se limita para que el encuadre no falle
  const sheetHeight = sheet.value?.$el?.offsetHeight ?? 0
  const mapHeight = mapContainer.value?.offsetHeight ?? 0
  return { top: 72, right: 32, bottom: Math.min(sheetHeight, mapHeight * 0.5) + 24, left: 32 }
}

// Centra un punto en la parte visible del mapa. Usa offset y no padding: en easeTo el
// padding queda fijo en el mapa y después se sumaría al de fitBounds.
function centerOn(coord) {
  const m = map.value
  const p = mapPadding()
  m.easeTo({
    center: coord,
    zoom: Math.max(m.getZoom(), 12),
    offset: [(p.left - p.right) / 2, (p.top - p.bottom) / 2],
  })
}

function fitRoute() {
  const m = map.value
  const coords = result.value?.geometry.coordinates ?? waypoints.value.map((w) => [w.lng, w.lat])
  if (!m || !coords.length) return

  if (coords.length === 1) {
    centerOn(coords[0])
    return
  }
  m.fitBounds(boundsOf(coords), { padding: mapPadding(), maxZoom: 15, duration: 600 })
}

// Al agregar o quitar puntos se reencuadra; al arrastrar uno, no (molestaría)
let fittedCount = 0
watch(result, () => {
  drawRoute()
  if (result.value && waypoints.value.length !== fittedCount) {
    fittedCount = waypoints.value.length
    fitRoute()
  }
})

// Al achicar el panel en mobile vuelve a verse el mapa: se reencuadra
watch(sheetExpanded, async (open) => {
  if (open || !result.value) return
  await nextTick()
  fitRoute()
})

/* ───────── Interacción ───────── */
function onMapClick(e) {
  notice.value = ''
  try {
    draft.addWaypoint({ lng: e.lngLat.lng, lat: e.lngLat.lat })
  } catch (err) {
    notice.value = err.message
  }
}

// Con ruta, el encuadre llega cuando termina el cálculo; sin ruta, se centra en el lugar
function onPlaceAdded(place) {
  if (waypoints.value.length > 1 || !map.value) return
  centerOn([place.lng, place.lat])
}

const mapCenter = () => map.value?.getCenter() ?? null

// Publicar en la comunidad: el post apunta a la ruta guardada, que tiene que ser pública
async function goToCreatePost() {
  notice.value = ''
  if (!routeId.value) {
    // se guarda primero (como pública) y al terminar se sigue al formulario del post
    openSave('publish')
    return
  }
  if (!draft.isPublic) {
    const question =
      'Para publicarla en la comunidad la ruta tiene que ser pública. ¿Hacerla pública?'
    if (!window.confirm(question)) return
    try {
      await updateRoute(routeId.value, { is_public: true })
      draft.isPublic = true
    } catch (e) {
      notice.value = e.message
      return
    }
  }
  router.push({ path: '/comunidad/publicar', query: { route: routeId.value } })
}

/* ───────── Guardar y editar ───────── */
// Qué hacer cuando termine de guardar: null, 'share' (compartir link) o 'publish' (crear post)
let afterSave = null
// Acción opcional del aviso de éxito (un botón: compartir necesita un toque del usuario)
const successAction = ref(null)

function openSave(then = null) {
  afterSave = then
  // si la guarda para compartirla o publicarla, tiene que ser pública
  if (then && !routeId.value) draft.isPublic = true
  saveOpen.value = true
}

let successTimer
function showSuccess(text, action = null, ms = 3000) {
  success.value = text
  successAction.value = action
  clearTimeout(successTimer)
  successTimer = setTimeout(() => {
    success.value = ''
    successAction.value = null
  }, ms)
}

async function shareSavedLink() {
  try {
    const status = await shareRouteLink({ id: routeId.value, name: draft.name })
    const text = linkShareMessage(status)
    showSuccess(text || 'Listo')
  } catch (e) {
    notice.value = e.message
  }
}

function onSaved({ row, created }) {
  const then = afterSave
  afterSave = null
  if (created) router.replace(`/rutas/${row.id}/editar`)
  if (then === 'publish') {
    router.push({ path: '/comunidad/publicar', query: { route: row.id } })
    return
  }
  if (then === 'share') {
    // El menú nativo de compartir pide un toque reciente: se ofrece en el aviso
    showSuccess('Ruta guardada', { label: 'Compartir link', run: shareSavedLink }, 8000)
    return
  }
  showSuccess(created ? 'Ruta guardada en Mis rutas' : 'Cambios guardados')
}

// Avisos que llegan del panel (por ejemplo, al compartir el link)
function onNotify({ text, type }) {
  if (type === 'success') showSuccess(text)
  else notice.value = text
}

// /rutas/:id/editar carga la ruta guardada; /rutas/nueva arranca de cero si se estaba editando.
// Si el borrador ya es esa ruta (por ejemplo, al recargar) se conservan los cambios sin guardar.
async function loadForRoute(id) {
  // sin id no se limpia el aviso: puede venir de un error al cargar (redirige acá)
  if (!id) {
    if (routeId.value) draft.reset()
    return
  }
  notice.value = ''
  if (routeId.value === id) return

  loadingRoute.value = true
  try {
    const row = await getRouteById(id)
    if (row.user_id !== auth.user?.id) throw new Error('Solo podés editar tus propias rutas')
    draft.loadRoute(row)
  } catch (e) {
    notice.value = e.message
    router.replace('/rutas/nueva')
  } finally {
    loadingRoute.value = false
  }
}
watch(() => route.params.id, loadForRoute, { immediate: true })

// Si el borrador se vacía mientras se edita ("Nueva", cerrar sesión), la URL vuelve a /rutas/nueva
watch(routeId, (id) => {
  if (!id && route.params.id) router.replace('/rutas/nueva')
})

// "Copiar ruta" desde el feed llega con coordenadas en la query: arma un borrador nuevo
function loadFromQuery() {
  const { originLat, originLng, destLat, destLng } = route.query
  if (!(originLat && originLng && destLat && destLng)) return
  draft.reset()
  draft.addWaypoint({ lng: +originLng, lat: +originLat })
  draft.addWaypoint({ lng: +destLng, lat: +destLat })
  router.replace({ query: {} })
}

/* ───────── Ciclo de vida ───────── */
function onMapReady() {
  mapReady.value = true
  map.value.on('click', onMapClick)
  drawRoute()
  syncMarkers()
  loadFromQuery()
  fittedCount = waypoints.value.length
  fitRoute()
}

onMounted(() => {
  init(mapContainer.value)
  if (map.value.loaded()) onMapReady()
  else map.value.once('load', onMapReady)
})

onBeforeUnmount(() => {
  map.value?.off('click', onMapClick)
  markers.forEach((m) => m.remove())
  markers = []
})
</script>

<template>
  <div class="relative h-full overflow-hidden bg-surface-deep">
    <!-- MapLibre le pone position: relative: el alto sale de h-full -->
    <div ref="mapContainer" class="absolute inset-0 h-full w-full" />

    <div v-if="!mapReady || loadingRoute" class="absolute inset-0 z-20 grid place-items-center">
      <Loader size="lg" />
    </div>

    <!-- Avisos flotantes arriba -->
    <div
      class="pointer-events-none absolute inset-x-0 top-3 z-10 flex flex-col items-center gap-2 pr-16 pl-4 lg:left-[25rem] lg:px-16"
    >
      <p
        v-if="loading"
        class="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm shadow-lg"
        role="status"
      >
        <IconLucide name="LoaderCircle" :size="16" class="animate-spin text-primary" />
        Calculando ruta…
      </p>
      <p
        v-if="banner"
        class="pointer-events-auto flex max-w-md items-start gap-2 rounded-lg bg-card px-3 py-2 text-sm text-destructive shadow-lg"
        role="alert"
      >
        <IconLucide name="CircleAlert" :size="16" class="mt-0.5 shrink-0" />
        {{ banner }}
      </p>
      <p
        v-if="success"
        class="pointer-events-auto flex items-center gap-2 rounded-full bg-card py-1.5 pr-1.5 pl-3 text-sm shadow-lg"
        :class="{ 'pr-3': !successAction }"
        role="status"
      >
        <IconLucide name="CheckCircle2" :size="16" class="text-primary" />
        {{ success }}
        <Button
          v-if="successAction"
          size="sm"
          class="ml-1 rounded-full"
          @click="successAction.run()"
        >
          <IconLucide name="Share2" :size="14" />
          {{ successAction.label }}
        </Button>
      </p>
    </div>

    <!-- Encuadrar la ruta -->
    <Button
      v-if="waypoints.length"
      variant="secondary"
      size="icon-lg"
      class="absolute top-3 right-3 z-10 shadow-lg"
      aria-label="Encuadrar la ruta"
      @click="fitRoute"
    >
      <IconLucide name="Scan" :size="18" />
    </Button>

    <RouteSheet
      ref="sheet"
      v-model:expanded="sheetExpanded"
      :near="mapCenter"
      @place-added="onPlaceAdded"
      @publish="goToCreatePost"
      @save="openSave()"
      @save-then-share="openSave('share')"
      @notify="onNotify"
    />

    <SaveRouteDialog v-model:open="saveOpen" @saved="onSaved" />
  </div>
</template>

<style>
@import 'maplibre-gl/dist/maplibre-gl.css';
</style>
