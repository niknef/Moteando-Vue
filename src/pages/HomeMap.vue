<script setup>
import { Marker } from 'maplibre-gl'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import Loader from '@/components/ui/Loader.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseLabel from '@/components/ui/BaseLabel.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import BaseHeding1 from '@/components/ui/BaseHeading1.vue'

import { useMap } from '@/composables/useMap'
import { useGeocoding, reverseGeocode, formatCoord } from '@/composables/useGeocoding'
import { getRouteGeoJSON } from '@/composables/useRouting'

/* ───────── estado ───────── */
const mapContainer = ref(null)
const mapReady = ref(false)
const loadingRoute = ref(false)
const selectedRoute = ref(null)

const markers = ref([])
const waypoints = ref([])

const originQuery = ref('')
const destQuery = ref('')
const { results: originRes, search: sO, clear: clearO } = useGeocoding()
const { results: destRes, search: sD, clear: clearD } = useGeocoding()

const { map, init } = useMap()
const route = useRoute()
const router = useRouter()

/* ───────── helpers ───────── */
// Muestra las coordenadas al instante y las reemplaza por el nombre del lugar cuando llega
async function nameFor(type, coord) {
  const idx = type === 'origin' ? 0 : 1
  const query = type === 'origin' ? originQuery : destQuery
  query.value = formatCoord(coord)
  const label = await reverseGeocode(coord)
  const current = waypoints.value[idx]
  // si el punto se movió mientras tanto, esta respuesta ya no corresponde
  if (current && current[0] === coord[0] && current[1] === coord[1]) query.value = label
}

const mapCenter = () => map.value?.getCenter()

function addDraggableMarker(coord, type) {
  const color = type === 'origin' ? '#40777A' : '#E86E1B'
  const m = new Marker({ color, draggable: true }).setLngLat(coord).addTo(map.value)

  m.getElement().addEventListener('contextmenu', (e) => {
    e.preventDefault()
    removeMarker(type)
  })

  m.on('dragend', () => {
    const { lng, lat } = m.getLngLat()
    const newCoord = [lng, lat]
    waypoints.value[type === 'origin' ? 0 : 1] = newCoord
    nameFor(type, newCoord)
    recalcRoute()
  })

  markers.value[type === 'origin' ? 0 : 1] = m
}

function removeMarker(type) {
  const idx = type === 'origin' ? 0 : 1
  markers.value[idx]?.remove()
  markers.value[idx] = undefined
  waypoints.value[idx] = undefined
  selectedRoute.value = null
  clearRoutes()
}

function clearRoutes() {
  ;['fastest', 'shortest'].forEach((id) => {
    if (map.value.getLayer(`${id}-line`)) map.value.removeLayer(`${id}-line`)
    if (map.value.getSource(id)) map.value.removeSource(id)
  })
}

function resetPoints() {
  removeMarker('dest')
  removeMarker('origin')
  clearRoutes()
}

// label: nombre ya conocido (al elegir un resultado de búsqueda); si no, se busca
function handleMapClick(e, label) {
  const coord = [e.lngLat.lng, e.lngLat.lat]

  if (!markers.value[0]) {
    waypoints.value = [coord]
    addDraggableMarker(coord, 'origin')
    if (label) originQuery.value = label
    else nameFor('origin', coord)
  } else if (!markers.value[1]) {
    waypoints.value[1] = coord
    addDraggableMarker(coord, 'dest')
    if (label) destQuery.value = label
    else nameFor('dest', coord)
    recalcRoute()
  }
}

function addOrUpdate(id, geojson, color) {
  if (map.value.getSource(id)) {
    map.value.getSource(id).setData(geojson)
  } else {
    map.value.addSource(id, { type: 'geojson', data: geojson })
    map.value.addLayer({
      id: `${id}-line`,
      type: 'line',
      source: id,
      paint: { 'line-width': 4, 'line-color': color, 'line-opacity': 0.8 },
    })
  }
}

function highlight(id) {
  ;['fastest', 'shortest'].forEach((i) => {
    map.value.setPaintProperty(`${i}-line`, 'line-width', i === id ? 6 : 3)
    map.value.setPaintProperty(`${i}-line`, 'line-opacity', i === id ? 1 : 0.3)
  })
  selectedRoute.value = id
}

async function recalcRoute() {
  if (waypoints.value.filter(Boolean).length < 2) {
    clearRoutes()
    return
  }
  loadingRoute.value = true
  selectedRoute.value = null

  try {
    const [fastest, shortest] = await Promise.all([
      getRouteGeoJSON(waypoints.value, 'fastest'),
      getRouteGeoJSON(waypoints.value, 'shortest'),
    ])
    addOrUpdate('fastest', fastest, '#40777A')
    addOrUpdate('shortest', shortest, '#E86E1B')
  } catch (e) {
    console.error(e)
  }
  loadingRoute.value = false
}

function selectPlace(place, type) {
  if (type === 'origin') {
    removeMarker('origin')
    clearO()
  } else {
    removeMarker('dest')
    clearD()
  }

  handleMapClick({ lngLat: { lng: place.lng, lat: place.lat } }, place.label)
  map.value.flyTo({ center: [place.lng, place.lat], zoom: Math.max(map.value.getZoom(), 12) })
}

function goToCreatePost() {
  if (!selectedRoute.value) return

  const routeData = {
    start_point: originQuery.value,
    end_point: destQuery.value,
    start_geom: `POINT (${waypoints.value[0][0]} ${waypoints.value[0][1]})`,
    end_geom: `POINT (${waypoints.value[1][0]} ${waypoints.value[1][1]})`,
    route_type: selectedRoute.value,
  }

  router.push({ path: '/comunidad/publicar', query: routeData })
}

onMounted(() => {
  init(mapContainer.value)

  const interval = setInterval(() => {
    if (map.value && map.value.loaded()) {
      mapReady.value = true
      map.value.on('click', handleMapClick)
      clearInterval(interval)

      // 🔥 Si venimos desde PostList con coordenadas
      if (
        route.query.originLat &&
        route.query.originLng &&
        route.query.destLat &&
        route.query.destLng
      ) {
        const originCoord = [parseFloat(route.query.originLng), parseFloat(route.query.originLat)]
        const destCoord = [parseFloat(route.query.destLng), parseFloat(route.query.destLat)]

        waypoints.value = [originCoord, destCoord]

        addDraggableMarker(originCoord, 'origin')
        addDraggableMarker(destCoord, 'dest')

        nameFor('origin', originCoord)
        nameFor('dest', destCoord)

        recalcRoute()
      }
    }
  }, 100)
})

onBeforeUnmount(() => map.value?.off('click', handleMapClick))
</script>

<template>
  <div class="flex flex-col sm:flex-row h-full">
    <!-- Sidebar -->
    <div class="w-full sm:w-80 bg-neutral-800 text-white p-6 space-y-4 sm:rounded-r-lg">
      <BaseHeding1 class="text-xl font-bold mb-4">Crear ruta</BaseHeding1>

      <!-- ORIGEN -->
      <div>
        <BaseLabel for="origin">Desde…</BaseLabel>
        <BaseInput
          id="origin"
          v-model="originQuery"
          placeholder="Buscar origen"
          @input="sO(originQuery, mapCenter())"
        />
        <ul
          v-if="originRes.length"
          class="bg-white text-black rounded shadow max-h-40 overflow-auto mt-2"
        >
          <li
            v-for="o in originRes"
            :key="o.id"
            class="px-3 py-2 hover:bg-slate-100 cursor-pointer"
            @click="selectPlace(o, 'origin')"
          >
            <span class="block">{{ o.label }}</span>
            <span class="block text-xs text-neutral-500">{{ o.detail }}</span>
          </li>
        </ul>
      </div>

      <!-- DESTINO -->
      <div>
        <BaseLabel for="dest">Hasta…</BaseLabel>
        <BaseInput
          id="dest"
          v-model="destQuery"
          placeholder="Buscar destino"
          @input="sD(destQuery, mapCenter())"
        />
        <ul
          v-if="destRes.length"
          class="bg-white text-black rounded shadow max-h-40 overflow-auto mt-2"
        >
          <li
            v-for="d in destRes"
            :key="d.id"
            class="px-3 py-2 hover:bg-slate-100 cursor-pointer"
            @click="selectPlace(d, 'dest')"
          >
            <span class="block">{{ d.label }}</span>
            <span class="block text-xs text-neutral-500">{{ d.detail }}</span>
          </li>
        </ul>
      </div>

      <!-- Botón calcular rutas -->
      <button
        class="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 py-2 rounded disabled:opacity-50 w-full"
        :disabled="waypoints.filter(Boolean).length < 2 || loadingRoute"
        @click="recalcRoute"
      >
        <Loader v-if="loadingRoute" class="w-5 h-5 border-2" />
        <IconLucide v-else name="Route" :size="20" />
        {{ loadingRoute ? 'Calculando…' : 'Calcular rutas' }}
      </button>

      <!-- Opciones de ruta -->
      <div
        v-if="!loadingRoute && waypoints.filter(Boolean).length === 2"
        class="flex flex-col gap-2"
      >
        <h3 class="text-sm mb-1">Seleccioná el tipo de ruta:</h3>
        <div class="flex flex-col sm:flex-row gap-2">
          <!-- Botón rápida -->
          <button
            :class="
              selectedRoute === 'fastest'
                ? 'bg-[#40777A] text-white border-2 border-[#305d61]'
                : 'bg-neutral-700 text-white hover:bg-neutral-600'
            "
            class="flex-1 py-2 rounded text-center transition"
            @click="highlight('fastest')"
          >
            Rápida
          </button>

          <!-- Botón corta -->
          <button
            :class="
              selectedRoute === 'shortest'
                ? 'bg-[#E86E1B] text-white border-2 border-[#c2510f]'
                : 'bg-neutral-700 text-white hover:bg-neutral-600'
            "
            class="flex-1 py-2 rounded text-center transition"
            @click="highlight('shortest')"
          >
            Corta
          </button>
        </div>
      </div>

      <!-- Botón crear post -->
      <button
        v-if="selectedRoute"
        class="flex items-center justify-center gap-2 bg-orange-950 hover:bg-orange-900 py-2 rounded w-full"
        @click="goToCreatePost"
      >
        <IconLucide name="FilePlus" :size="20" /> Crear post
      </button>

      <!-- Botón reiniciar -->
      <button
        v-if="markers.some(Boolean)"
        class="text-xs underline self-start hover:text-red-400 transition mt-2"
        @click="resetPoints"
      >
        Reiniciar puntos
      </button>
    </div>

    <!-- Mapa -->
    <div class="flex-1 relative">
      <div ref="mapContainer" class="absolute inset-0 h-full w-full z-0"></div>
      <Loader
        v-if="!mapReady"
        class="absolute inset-0 flex items-center justify-center bg-black/30 z-20"
      />
    </div>
  </div>
</template>

<style>
@import 'maplibre-gl/dist/maplibre-gl.css';
html,
body,
#app {
  height: 100%;
  margin: 0;
}
</style>
