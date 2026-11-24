// Datos de la ruta para el motero: altimetría, ripio y curvas.
// Salen del GeoJSON de ORS (coordenadas [lng, lat, ele] y extras.surface) y se guardan en
// routes.stats para mostrarlos sin volver a calcular.

// Superficies de ORS que no son asfalto ni similares (ripio, tierra, arena, pasto…)
// https://giscience.github.io/openrouteservice/api-reference/endpoints/directions/extra-info/surface
const UNPAVED = new Set([2, 8, 9, 10, 11, 12, 15, 16, 17, 18])

const toRad = (d) => (d * Math.PI) / 180

// Distancia en km entre dos [lng, lat]
function distanceKm(a, b) {
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

function bearing(a, b) {
  const y = Math.sin(toRad(b[0] - a[0])) * Math.cos(toRad(b[1]))
  const x =
    Math.cos(toRad(a[1])) * Math.sin(toRad(b[1])) -
    Math.sin(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.cos(toRad(b[0] - a[0]))
  return (Math.atan2(y, x) * 180) / Math.PI
}

// Grados de giro por km. Se cuentan los cambios de rumbo entre 2° y 60°: las curvas de un
// camino se dibujan con muchos puntos y giros chicos; los 90° de una esquina no son "curvas".
// Calibrado con ORS: llanura bonaerense 25–40 °/km, Altas Cumbres (Córdoba) ~100 °/km.
export function curvature(coords, km) {
  if (!km || coords.length < 3) return 0
  let total = 0
  for (let i = 1; i < coords.length - 1; i++) {
    const turn = Math.abs(
      ((bearing(coords[i], coords[i + 1]) - bearing(coords[i - 1], coords[i]) + 540) % 360) - 180,
    )
    if (turn >= 2 && turn <= 60) total += turn
  }
  return Math.round(total / km)
}

// Subida y bajada acumuladas. El modelo de altura (SRTM) tiene ruido de varios metros entre
// puntos vecinos: sumarlo todo infla el desnivel (ORS da +339 m en una llanura de 12 a 36 m).
// Se cuenta un cambio recién cuando supera `threshold` metros desde el último punto firme.
export function climb(eles, threshold = 10) {
  let up = 0
  let down = 0
  let ref = eles[0]
  for (const e of eles) {
    if (e - ref >= threshold) {
      up += e - ref
      ref = e
    } else if (ref - e >= threshold) {
      down += ref - e
      ref = e
    }
  }
  return { up: Math.round(up), down: Math.round(down) }
}

export function curvinessOf(degPerKm) {
  if (degPerKm == null) return null
  if (degPerKm >= 70) return { level: 3, label: 'Muchas curvas' }
  if (degPerKm >= 40) return { level: 2, label: 'Algunas curvas' }
  return { level: 1, label: 'Pocas curvas' }
}

/**
 * Resumen de un feature de ORS:
 * { ascentM, descentM, minEle, maxEle, unpavedKm, unpaved: [[desde, hasta], ...], curvature }
 * `unpaved` son rangos de índices de coordenadas, para pintar esos tramos en el mapa.
 */
export function statsFromFeature(feature) {
  const coords = feature.geometry.coordinates
  const props = feature.properties ?? {}
  const km = (props.summary?.distance ?? 0) / 1000

  const eles = coords.map((c) => c[2]).filter(Number.isFinite)
  const unpaved = []
  let unpavedM = 0
  for (const [from, to, value] of props.extras?.surface?.values ?? []) {
    if (!UNPAVED.has(value)) continue
    const last = unpaved[unpaved.length - 1]
    if (last && last[1] === from) last[1] = to
    else unpaved.push([from, to])
  }
  for (const s of props.extras?.surface?.summary ?? []) {
    if (UNPAVED.has(s.value)) unpavedM += s.distance
  }

  const { up, down } = eles.length ? climb(eles) : { up: null, down: null }
  return {
    ascentM: up,
    descentM: down,
    minEle: eles.length ? Math.round(Math.min(...eles)) : null,
    maxEle: eles.length ? Math.round(Math.max(...eles)) : null,
    unpavedKm: Math.round(unpavedM / 100) / 10,
    unpaved,
    curvature: curvature(coords, km),
  }
}

/**
 * Perfil de altura para dibujar: hasta `samples` puntos { km, ele }.
 * Devuelve [] si la línea no trae altura (rutas guardadas antes de pedirla).
 */
export function elevationProfile(coords, samples = 120) {
  if (!coords?.length || !Number.isFinite(coords[0][2])) return []
  const points = [{ km: 0, ele: coords[0][2] }]
  let km = 0
  for (let i = 1; i < coords.length; i++) {
    km += distanceKm(coords[i - 1], coords[i])
    points.push({ km, ele: coords[i][2] })
  }
  if (points.length <= samples) return points
  const step = (points.length - 1) / (samples - 1)
  return Array.from({ length: samples }, (_, i) => points[Math.round(i * step)])
}
