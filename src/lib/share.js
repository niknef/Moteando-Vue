import { updateRoute } from '@/services/routes'
import { stopType } from '@/lib/stop-types'

// Compartir una ruta con el navegador de cada uno: link de Google Maps y archivo GPX.
// `route`: { name, description?, waypoints: [{ lng, lat, label }], options?: { avoid }, geometry? }

/* ───────── Google Maps ───────── */
// https://developers.google.com/maps/documentation/urls/get-started#directions-action
// Hasta 9 paradas intermedias (3 si se abre en el navegador del celular; la app no tiene ese límite).
export const GOOGLE_MAPS_MAX_STOPS = 9

// Nuestras opciones → `avoid` de Google (que lo toma como preferencia, no como garantía)
const GOOGLE_AVOID = { highways: 'highways', tollways: 'tolls', ferries: 'ferries' }

const latLng = (w) => `${w.lat},${w.lng}`

export function googleMapsUrl(route) {
  const points = route.waypoints
  if (points.length < 2) throw new Error('La ruta necesita salida y llegada')

  const stops = points.slice(1, -1)
  const params = new URLSearchParams({
    api: '1',
    origin: latLng(points[0]),
    destination: latLng(points[points.length - 1]),
    travelmode: 'driving',
  })
  if (stops.length) {
    params.set('waypoints', stops.slice(0, GOOGLE_MAPS_MAX_STOPS).map(latLng).join('|'))
  }
  const avoid = (route.options?.avoid ?? []).map((a) => GOOGLE_AVOID[a]).filter(Boolean)
  if (avoid.length) params.set('avoid', avoid.join(','))

  return `https://www.google.com/maps/dir/?${params}`
}

// Abre la ruta en Google Maps (app o web). Si tiene más paradas de las que acepta Google,
// las de más se pierden: se avisa antes y se sugiere el GPX.
export function openInGoogleMaps(route) {
  const extra = route.waypoints.length - 2 - GOOGLE_MAPS_MAX_STOPS
  if (extra > 0) {
    const question =
      `Google Maps acepta hasta ${GOOGLE_MAPS_MAX_STOPS} paradas: se van a omitir las últimas ${extra}. ` +
      'Para la ruta completa, descargá el GPX. ¿Abrir igual?'
    if (!window.confirm(question)) return
  }
  window.open(googleMapsUrl(route), '_blank', 'noopener')
}

/* ───────── GPX ───────── */
// GPX 1.1 con los puntos como <wpt> (paradas con nombre) y la línea calculada como <trk>.
// Lo abren OsmAnd, Calimoto, Garmin, Komoot, etc.

const xml = (text = '') =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const coord = (lng, lat) => `lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"`

export function routeToGpx(route) {
  const name = route.name?.trim() || 'Ruta de Moteando'
  // tipo de parada (nafta, comida…) como <type>, que muestran Garmin y OsmAnd
  const typeTag = (w) => (stopType(w.type) ? `<type>${xml(stopType(w.type).label)}</type>` : '')
  const wpts = route.waypoints
    .map(
      (w) =>
        `  <wpt ${coord(w.lng, w.lat)}><name>${xml(w.label || 'Punto')}</name>${typeTag(w)}</wpt>`,
    )
    .join('\n')
  // <rte>: los mismos puntos como ruta, para los GPS que recalculan entre puntos de paso (Zumo,
  // Basecamp). El <trk> lleva la línea exacta calculada.
  const rtepts = route.waypoints
    .map(
      (w) =>
        `    <rtept ${coord(w.lng, w.lat)}><name>${xml(w.label || 'Punto')}</name>${typeTag(w)}</rtept>`,
    )
    .join('\n')
  const trkpts = (route.geometry?.coordinates ?? route.waypoints.map((w) => [w.lng, w.lat]))
    // con altura (<ele>) si la línea la trae: la usan Garmin, OsmAnd y Komoot para el perfil
    .map(([lng, lat, ele]) =>
      Number.isFinite(ele)
        ? `      <trkpt ${coord(lng, lat)}><ele>${Math.round(ele)}</ele></trkpt>`
        : `      <trkpt ${coord(lng, lat)}/>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Moteando" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${xml(name)}</name>${route.description ? `\n    <desc>${xml(route.description)}</desc>` : ''}
  </metadata>
${wpts}
  <rte>
    <name>${xml(name)}</name>
${rtepts}
  </rte>
  <trk>
    <name>${xml(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`
}

// "Escapada a Areco!" → "escapada-a-areco"
export function slugify(text) {
  return (
    String(text)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'ruta'
  )
}

export function downloadGpx(route) {
  const blob = new Blob([routeToGpx(route)], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(route.name || 'ruta-moteando')}.gpx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Safari necesita que la URL siga viva un momento después del click
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ───────── Link público ───────── */
export const publicRouteUrl = (id) => `${window.location.origin}/r/${id}`

// Comparte el link con el menú nativo del celular; si no hay, lo copia.
// Devuelve 'shared', 'copied' o 'cancelled'.
export async function shareRouteLink(route) {
  const url = publicRouteUrl(route.id)
  if (navigator.share) {
    try {
      await navigator.share({ title: route.name, url })
      return 'shared'
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled'
      // si el menú nativo falla, se cae a copiar
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    throw new Error('No se pudo copiar el link')
  }
}

// Flujo completo de "Compartir link": si la ruta es privada pide permiso para hacerla pública.
// `route` necesita { id, name, is_public }. Devuelve { status, madePublic }.
export async function shareRouteWithLink(route) {
  if (!route.id) throw new Error('Guardá la ruta para poder compartir el link')

  let madePublic = false
  if (!route.is_public) {
    const question =
      'La ruta es privada. ¿Hacerla pública para compartir el link? Cualquiera con el link la va a poder ver.'
    if (!window.confirm(question)) return { status: 'cancelled', madePublic }
    await updateRoute(route.id, { is_public: true })
    madePublic = true
  }
  const status = await shareRouteLink(route)
  return { status, madePublic }
}

// Texto para avisar cómo salió
export const linkShareMessage = (status) =>
  ({ copied: 'Link copiado', shared: 'Link compartido' })[status] ?? ''
