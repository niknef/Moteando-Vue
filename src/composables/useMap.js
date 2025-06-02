import maplibregl from 'maplibre-gl'
import { ref, onBeforeUnmount } from 'vue'

const map     = ref(null)
const markers = ref([])
let isInitialized = false

export function useMap () {
  const init = (containerEl) => {
    if (isInitialized || !containerEl) return
    isInitialized = true

    map.value = new maplibregl.Map({
      container: containerEl,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [-58.3816, -34.6037],
      zoom: 11
    })

    map.value.on('error', (err) => {
      console.error('🛑 MapLibre error:', err)
    })
  }

  const addMarker = (lngLat) => {
    const m = new maplibregl.Marker({ color: '#E86E1B' })
      .setLngLat(lngLat)
      .addTo(map.value)
    markers.value.push(m)
  }

  const clearMarkers = () => {
    markers.value.forEach(m => m.remove())
    markers.value = []
  }

  const destroy = () => {
    if (map.value) {
      map.value.remove()
      map.value = null
      isInitialized = false
    }
  }

  onBeforeUnmount(() => destroy())

  return { map, init, addMarker, clearMarkers, destroy }
}
