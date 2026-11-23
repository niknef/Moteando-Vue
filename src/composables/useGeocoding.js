import { ref } from 'vue'
import debounce from 'lodash.debounce'

// Photon (komoot): geocoder sobre OpenStreetMap pensado para autocompletar.
// Nominatim no permite autocompletar en su servidor público.
const PHOTON_URL = 'https://photon.komoot.io'
// Caja que contiene a la Argentina (incluye algo de los países vecinos: se filtra por countrycode)
const AR_BBOX = '-73.6,-55.1,-53.6,-21.8'
const MAX_RESULTS = 6

export const formatCoord = ([lng, lat]) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`

// "Luján " → "lujan": sin tildes, minúsculas y sin espacios de más
const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Tipo de lugar para mostrar al lado del resultado (evita confundir la ciudad con una calle)
function kindOf(p) {
  if (['city', 'town'].includes(p.osm_value)) return 'Ciudad'
  if (['village', 'hamlet', 'isolated_dwelling'].includes(p.osm_value)) return 'Pueblo'
  if (p.type === 'city') return 'Localidad'
  if (p.type === 'locality' || p.type === 'district') return 'Barrio'
  if (p.type === 'street') return 'Calle'
  if (p.housenumber) return 'Dirección'
  if (p.type === 'county' || p.type === 'state') return 'Zona'
  return 'Lugar'
}

// Feature de Photon → { id, label, kind, detail, city, lng, lat, isPlace }
function toPlace(feature) {
  const p = feature.properties
  const street = [p.street, p.housenumber].filter(Boolean).join(' ')
  const label = p.name || street || p.city || p.state
  if (!label) return null

  // partido/departamento y provincia ayudan a distinguir homónimos (Luján, Bs. As. vs. San Luis)
  const detail = [p.name ? street : null, p.district, p.city, p.county, p.state]
    .filter((part, i, all) => part && part !== label && all.indexOf(part) === i)
    .join(', ')

  const [lng, lat] = feature.geometry.coordinates
  const city = p.city || p.district || p.county || p.state
  const kind = kindOf(p)
  return {
    id: `${p.osm_type}${p.osm_id}`,
    label,
    kind,
    detail,
    city,
    lng,
    lat,
    isPlace: ['Ciudad', 'Pueblo', 'Localidad'].includes(kind),
    countrycode: p.countrycode,
  }
}

async function photon(params, signal) {
  // los parámetros con varios valores (layer) van repetidos: layer=city&layer=locality
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    for (const v of [value].flat()) query.append(key, v)
  }
  const res = await fetch(`${PHOTON_URL}/api/?${query}`, { signal })
  if (!res.ok) throw new Error(res.statusText)
  const { features } = await res.json()
  return features
    .map(toPlace)
    .filter((place) => place && (!place.countrycode || place.countrycode === 'AR'))
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
    const { signal } = controller

    const nearby = { q, limit: '8', bbox: AR_BBOX }
    if (near) Object.assign(nearby, { lon: near.lng, lat: near.lat })

    try {
      // Con números es una dirección ("Corrientes 1234"): alcanza con la búsqueda cercana.
      if (/\d/.test(q)) {
        results.value = (await photon(nearby, signal)).slice(0, MAX_RESULTS)
        return
      }
      // Si no, primero ciudades y pueblos de todo el país (sin sesgo por cercanía, que hacía
      // ganar a las calles homónimas de CABA) y después lo cercano, sin repetir.
      const [places, rest] = await Promise.all([
        photon({ q, limit: '5', bbox: AR_BBOX, layer: ['city', 'locality'] }, signal),
        photon(nearby, signal),
      ])
      // Solo pasan adelante las localidades cuyo nombre empieza con lo buscado
      // ("obelisco" no tiene que traer primero al pueblo "El Obelisco" de Salta)
      const typed = normalize(q)
      const matches = (p) => p.isPlace && normalize(p.label).startsWith(typed)
      const seen = new Set()
      results.value = [...places.filter(matches), ...rest, ...places.filter((p) => !matches(p))]
        .filter((p) => !seen.has(p.id) && seen.add(p.id))
        .slice(0, MAX_RESULTS)
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
