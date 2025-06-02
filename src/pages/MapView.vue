<script setup>
/* ────────── imports ────────── */
import maplibregl from 'maplibre-gl'     // ← necesario para Marker
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Loader      from '@/components/ui/Loader.vue'
import BaseInput   from '@/components/ui/BaseInput.vue'
import BaseLabel   from '@/components/ui/BaseLabel.vue'

import { useMap }          from '@/composables/useMap'
import { useGeocoding }    from '@/composables/useGeocoding'
import { getRouteGeoJSON } from '@/composables/useRouting'
import { saveRoute }       from '@/services/routes'

/* ───────── estado ───────── */
const mapContainer   = ref(null)
const mapReady       = ref(false)
const loadingRoute   = ref(false)
const selectedRoute  = ref(null)          // 'fastest' | 'shortest'

const markers   = ref([])                 // [Marker, Marker]
const waypoints = ref([])                 // [[lng,lat], [lng,lat]]

/* búsqueda */
const originQuery = ref('')
const destQuery   = ref('')
const { results: originRes, search: sO } = useGeocoding()
const { results: destRes,   search: sD } = useGeocoding()

/* meta */
const routeName = ref('')

/* mapa */
const { map, init } = useMap()

/* ───────── helpers ───────── */
const reverseGeocode = ([lng, lat]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`

function addDraggableMarker(coord, type) {
  const color = type === 'origin' ? '#40777A' : '#E86E1B'
  const m = new maplibregl.Marker({ color, draggable: true })
    .setLngLat(coord)
    .addTo(map.value)

  m.getElement().addEventListener('contextmenu', e => {
    e.preventDefault()
    removeMarker(type)
  })

  m.on('dragend', () => {
    const { lng, lat } = m.getLngLat()
    const newCoord = [lng, lat]
    waypoints.value[type === 'origin' ? 0 : 1] = newCoord
    if (type === 'origin') originQuery.value = reverseGeocode(newCoord)
    else destQuery.value = reverseGeocode(newCoord)
    recalcRoute()
  })

  markers.value[type === 'origin' ? 0 : 1] = m
}

function removeMarker(type) {
  const idx = type === 'origin' ? 0 : 1
  markers.value[idx]?.remove()
  markers.value[idx] = undefined
  waypoints.value[idx] = undefined
  if (type === 'origin') originQuery.value = ''
  else destQuery.value = ''
  selectedRoute.value = null
  clearRoutes()
}

function clearRoutes() {
  ['fastest', 'shortest'].forEach(id => {
    if (map.value.getLayer(`${id}-line`)) map.value.removeLayer(`${id}-line`)
    if (map.value.getSource(id)) map.value.removeSource(id)
  })
}

function handleMapClick(e) {
  const coord = [e.lngLat.lng, e.lngLat.lat]

  if (!markers.value[0] || (markers.value[0] && markers.value[1])) {
    // primer punto o reinicio
    removeMarker('dest')
    removeMarker('origin')
    waypoints.value = [coord]
    addDraggableMarker(coord, 'origin')
    originQuery.value = reverseGeocode(coord)
    destQuery.value = ''
  } else {
    // segundo punto
    waypoints.value[1] = coord
    addDraggableMarker(coord, 'dest')
    destQuery.value = reverseGeocode(coord)
    recalcRoute()
  }
}

/* rutas */
function addOrUpdate(id, geojson, color) {
  if (map.value.getSource(id)) {
    map.value.getSource(id).setData(geojson)
  } else {
    map.value.addSource(id, { type: 'geojson', data: geojson })
    map.value.addLayer({
      id: `${id}-line`,
      type: 'line',
      source: id,
      paint: { 'line-width': 4, 'line-color': color, 'line-opacity': 0.8 }
    })
  }
}

function highlight(id) {
  ['fastest', 'shortest'].forEach(i => {
    map.value.setPaintProperty(`${i}-line`, 'line-width', i === id ? 6 : 3)
    map.value.setPaintProperty(`${i}-line`, 'line-opacity', i === id ? 1 : 0.3)
  })
  selectedRoute.value = id
}

async function recalcRoute() {
  if (waypoints.value.filter(Boolean).length < 2) { clearRoutes(); return }
  loadingRoute.value = true; selectedRoute.value = null

  try {
    const [fastest, shortest] = await Promise.all([
      getRouteGeoJSON(waypoints.value, 'driving-car', 'fastest'),
      getRouteGeoJSON(waypoints.value, 'driving-car', 'shortest')
    ])
    addOrUpdate('fastest', fastest, '#40777A')
    addOrUpdate('shortest', shortest, '#E86E1B')
  } catch (e) { console.error(e) }
  loadingRoute.value = false
}

function selectPlace(item, type) {
  const coord = [+item.lon, +item.lat]
  if (type === 'origin') removeMarker('origin')
  else removeMarker('dest')
  handleMapClick({ lngLat: { lng: coord[0], lat: coord[1] } })
}

function startRoute() {
  console.log('🟢 Iniciar ruta:', selectedRoute.value)
}

/* lifecycle */
onMounted(() => {
  init(mapContainer.value)
  map.value.on('load', () => { mapReady.value = true })
  map.value.on('click', handleMapClick)
})
onBeforeUnmount(() => map.value?.off('click', handleMapClick))
</script>

<template>
  <div class="flex flex-col h-screen">
    

    <div class="relative flex-1">
      <!-- mapa: mantén EXACTA esta clase -->
      <div ref="mapContainer" class="absolute inset-0 h-full w-full z-0"></div>

      <Loader v-if="!mapReady" class="absolute inset-0 flex items-center justify-center bg-black/30 z-20"/>

      <!-- panel -->
      <div v-show="mapReady"
           class="absolute top-24 left-1/2 -translate-x-1/2
                  bg-black/70 backdrop-blur text-white p-5 rounded-xl
                  w-11/12 max-w-md z-30 space-y-4">

        <!-- ORIGEN -->
        <BaseLabel for="origin">Desde…</BaseLabel>
        <BaseInput id="origin" v-model="originQuery"
                   @input="sO(originQuery)" placeholder="Buscar origen"/>
        <ul v-if="originRes.length" class="bg-white text-black rounded shadow max-h-40 overflow-auto">
          <li v-for="o in originRes" :key="o.place_id"
              @click="selectPlace(o,'origin')"
              class="px-3 py-2 hover:bg-slate-100 cursor-pointer">
            {{ o.display_name }}
          </li>
        </ul>

        <!-- DESTINO -->
        <BaseLabel for="dest">Hasta…</BaseLabel>
        <BaseInput id="dest" v-model="destQuery"
                   @input="sD(destQuery)" placeholder="Buscar destino"/>
        <ul v-if="destRes.length" class="bg-white text-black rounded shadow max-h-40 overflow-auto">
          <li v-for="d in destRes" :key="d.place_id"
              @click="selectPlace(d,'dest')"
              class="px-3 py-2 hover:bg-slate-100 cursor-pointer">
            {{ d.display_name }}
          </li>
        </ul>

        <!-- Nombre -->
        <BaseLabel for="name">Nombre</BaseLabel>
        <BaseInput id="name" v-model="routeName" placeholder="Ruta rápida"/>

        <!-- botones -->
        <div class="flex flex-col gap-2">
          <button class="bg-[#40777A] py-2 rounded disabled:opacity-50"
                  :disabled="waypoints.filter(Boolean).length<2 || loadingRoute"
                  @click="recalcRoute">
            Calcular rutas
          </button>

          <div v-if="!loadingRoute && waypoints.filter(Boolean).length===2"
               class="flex items-center gap-4 text-sm mx-auto my-2" >
            <button @click="highlight('fastest')"
                    :class="selectedRoute==='fastest' ? 'font-bold underline' : ''">
              <span class="inline-block w-5 h-1.5 bg-[#40777A]"></span> Rápida
            </button>
            <button @click="highlight('shortest')"
                    :class="selectedRoute==='shortest' ? 'font-bold underline' : ''">
              <span class="inline-block w-5 h-1.5 bg-[#E86E1B]"></span> Corta
            </button>
          </div>

          <button v-if="selectedRoute"
                  class="bg-orange-500 hover:bg-orange-600 py-2 rounded"
                  @click="startRoute">
            Comenzar ruta
          </button>

          <button v-if="markers.some(Boolean)"
                  class="text-xs underline self-start"
                  @click="removeMarker('dest'); removeMarker('origin'); clearRoutes()">
            Reiniciar puntos
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import 'maplibre-gl/dist/maplibre-gl.css';
html,body,#app{height:100%;margin:0;}
</style>
