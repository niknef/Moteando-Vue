import { ref } from 'vue'
import debounce from 'lodash.debounce'

// Photon (komoot): geocoder sobre OpenStreetMap pensado para autocompletar.
// Nominatim no permite autocompletar en su servidor público.
const PHOTON_URL = 'https://photon.komoot.io'

export const formatCoord = ([lng, lat]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`

// Feature de Photon → { id, label, detail, lng, lat }
function toPlace(feature) {
  const p = feature.properties
  const street = [p.street, p.housenumber].filter(Boolean).join(' ')
  const label = p.name || street || p.city || p.state
  if (!label) return null

  const detail = [p.name ? street : null, p.district, p.city, p.state, p.country]
    .filter((part, i, all) => part && part !== label && all.indexOf(part) === i)
    .join(', ')

  const [lng, lat] = feature.geometry.coordinates
  const city = p.city || p.district || p.state
  return { id: `${p.osm_type}${p.osm_id}`, label, detail, city, lng, lat }
}

// Nombre legible de un punto; si Photon no responde, quedan las coordenadas
export async function reverseGeocode(coord) {
  const [lng, lat] = coord
  try {
    const res = await fetch(`${PHOTON_URL}/reverse?lon=${lng}&lat=${lat}&limit=1`)
    if (!res.ok) throw new Error(res.statusText)
    const { features } = await res.json()
    const place = features[0] && toPlace(features[0])
    if (!place) return formatCoord(coord)
    return place.city && place.city !== place.label ? `${place.label}, ${place.city}` : place.label
  } catch {
    return formatCoord(coord)
  }
}

export function useGeocoding() {
  const results = ref([])
  let controller

  // near: { lng, lat } opcional, prioriza resultados cerca (por ejemplo, el centro del mapa)
  const search = debounce(async (q, near) => {
    controller?.abort()
    if (q.trim().length < 3) {
      results.value = []
      return
    }

    controller = new AbortController()
    const params = new URLSearchParams({ q, limit: '5' })
    if (near) {
      params.set('lon', near.lng)
      params.set('lat', near.lat)
    }

    try {
      const res = await fetch(`${PHOTON_URL}/api/?${params}`, { signal: controller.signal })
      if (!res.ok) throw new Error(res.statusText)
      const { features } = await res.json()
      results.value = features.map(toPlace).filter(Boolean)
    } catch (e) {
      if (e.name !== 'AbortError') results.value = []
    }
  }, 300)

  function clear() {
    search.cancel()
    controller?.abort()
    results.value = []
  }

  return { results, search, clear }
}
