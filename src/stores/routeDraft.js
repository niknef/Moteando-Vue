import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useLocalStorage, StorageSerializers } from '@vueuse/core'
import debounce from 'lodash.debounce'
import { getRouteGeoJSON } from '@/composables/useRouting'
import { reverseGeocode } from '@/composables/useGeocoding'

// Borrador de la ruta que se está diseñando. Vive en localStorage para no perderlo al recargar.

export const MAX_WAYPOINTS = 25
export const AVOID_OPTIONS = ['highways', 'tollways', 'ferries']
// Una ruta nueva evita autopistas: es lo que busca la mayoría para pasear (y lo que más
// asusta a quien recién empieza). Se puede apagar en Opciones.
const DEFAULT_AVOID = ['highways']

const KEY = 'moteando:route-draft:'
const newId = () => crypto.randomUUID()
const sameCoord = (a, b) => a && b && a.lng === b.lng && a.lat === b.lat

export const useRouteDraftStore = defineStore('routeDraft', () => {
  // ─── Estado persistido ───
  const routeId = useLocalStorage(`${KEY}routeId`, null) // null = ruta nueva; si no, la que se edita
  const name = useLocalStorage(`${KEY}name`, '')
  const description = useLocalStorage(`${KEY}description`, '')
  const isPublic = useLocalStorage(`${KEY}isPublic`, false)
  const waypoints = useLocalStorage(`${KEY}waypoints`, []) // [{ id, lng, lat, label }]
  const avoid = useLocalStorage(`${KEY}avoid`, [...DEFAULT_AVOID]) // subconjunto de AVOID_OPTIONS
  const preference = useLocalStorage(`${KEY}preference`, 'fastest') // 'fastest' | 'shortest'
  // { geometry, distanceKm, durationMin }. Con default null hay que decirle que es un objeto
  const result = useLocalStorage(`${KEY}result`, null, { serializer: StorageSerializers.object })

  // ─── Estado de la sesión ───
  const loading = ref(false)
  const error = ref('')

  // ─── Derivados ───
  const canRoute = computed(() => waypoints.value.length >= 2)
  const isFull = computed(() => waypoints.value.length >= MAX_WAYPOINTS)
  const isEmpty = computed(() => waypoints.value.length === 0)

  // ─── Puntos ───
  // index: posición donde insertarlo (por defecto, al final)
  function addWaypoint({ lng, lat, label }, index = waypoints.value.length) {
    if (isFull.value) throw new Error(`La ruta admite hasta ${MAX_WAYPOINTS} puntos`)
    const wp = { id: newId(), lng, lat, label: label ?? '' }
    waypoints.value.splice(index, 0, wp)
    if (!label) resolveLabel(wp.id)
    return wp.id
  }

  function moveWaypointTo(id, { lng, lat }, label) {
    const wp = waypoints.value.find((w) => w.id === id)
    if (!wp) return
    wp.lng = lng
    wp.lat = lat
    // un nombre puesto a mano ("YPF de Gral. Rodríguez") no se pisa al mover el punto
    if (wp.named) return
    wp.label = label ?? ''
    if (!label) resolveLabel(id)
  }

  // Nombre propio y tipo de parada (nafta, comida, foto, reagrupe). label vacío = volver al automático
  function updateWaypoint(id, { label, type }) {
    const wp = waypoints.value.find((w) => w.id === id)
    if (!wp) return
    if (type !== undefined) wp.type = type || null
    if (label !== undefined) {
      const clean = label.trim().slice(0, 60)
      wp.named = !!clean
      wp.label = clean
      if (!clean) resolveLabel(id)
    }
  }

  function removeWaypoint(id) {
    waypoints.value = waypoints.value.filter((w) => w.id !== id)
  }

  // Cambia el orden: el punto en `from` pasa a `to`
  function reorderWaypoint(from, to) {
    const list = [...waypoints.value]
    const [wp] = list.splice(from, 1)
    list.splice(to, 0, wp)
    waypoints.value = list
  }

  function reverseWaypoints() {
    waypoints.value = [...waypoints.value].reverse()
  }

  // Busca el nombre del lugar; si el punto se movió mientras tanto, descarta la respuesta
  async function resolveLabel(id) {
    const wp = waypoints.value.find((w) => w.id === id)
    if (!wp) return
    const coord = { lng: wp.lng, lat: wp.lat }
    const label = await reverseGeocode([coord.lng, coord.lat])
    const current = waypoints.value.find((w) => w.id === id)
    if (sameCoord(current, coord)) current.label = label
  }

  // ─── Opciones ───
  function setAvoid(feature, enabled) {
    if (!AVOID_OPTIONS.includes(feature)) return
    const rest = avoid.value.filter((f) => f !== feature)
    avoid.value = enabled ? [...rest, feature] : rest
  }

  // ─── Cálculo ───
  let requestId = 0

  async function calculate() {
    if (!canRoute.value) {
      result.value = null
      error.value = ''
      return
    }

    const id = ++requestId
    loading.value = true
    error.value = ''
    try {
      const coords = waypoints.value.map((w) => [w.lng, w.lat])
      const geojson = await getRouteGeoJSON(coords, preference.value, avoid.value)
      if (id !== requestId) return // llegó una respuesta más nueva

      const feature = geojson.features[0]
      const { distance = 0, duration = 0 } = feature.properties.summary ?? {}
      result.value = {
        geometry: feature.geometry,
        distanceKm: Math.round(distance / 100) / 10,
        durationMin: Math.round(duration / 60),
        // km de cada tramo (punto i → i + 1); las rutas cargadas de la base no lo traen
        legsKm: (feature.properties.segments ?? []).map((s) => Math.round(s.distance / 100) / 10),
      }
    } catch (e) {
      if (id !== requestId) return
      result.value = null
      error.value = e.message
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  // Recalcula solo cuando cambia algo que afecta la ruta (no al cambiar un nombre)
  const routeKey = computed(() =>
    JSON.stringify([
      waypoints.value.map((w) => [w.lng, w.lat]),
      [...avoid.value].sort(),
      preference.value,
    ]),
  )
  const calculateSoon = debounce(calculate, 400)
  let skipNextCalc = false // al cargar una ruta guardada, su resultado ya está calculado
  watch(routeKey, () => {
    if (skipNextCalc) {
      skipNextCalc = false
      return
    }
    if (!canRoute.value) {
      calculateSoon.cancel()
      requestId++
      loading.value = false
    }
    calculateSoon()
  })

  // ─── Borrador completo ───
  function reset() {
    calculateSoon.cancel()
    requestId++
    routeId.value = null
    name.value = ''
    description.value = ''
    isPublic.value = false
    waypoints.value = []
    avoid.value = [...DEFAULT_AVOID]
    preference.value = 'fastest'
    result.value = null
    loading.value = false
    error.value = ''
  }

  // Carga una ruta guardada (fila de `routes`) para editarla
  function loadRoute(row) {
    reset()
    routeId.value = row.id
    name.value = row.name
    description.value = row.description ?? ''
    isPublic.value = row.is_public
    avoid.value = row.options?.avoid ?? []
    preference.value = row.options?.preference ?? 'fastest'
    waypoints.value = row.waypoints.map((w) => ({ ...w, id: newId() }))
    result.value = {
      geometry: row.geometry,
      distanceKm: Number(row.distance_km ?? 0),
      durationMin: Number(row.duration_min ?? 0),
    }
    skipNextCalc = true
  }

  // Datos listos para insertar/actualizar en `routes`
  function toRow() {
    if (!result.value) throw new Error('Calculá la ruta antes de guardarla')
    return {
      name: name.value.trim(),
      description: description.value.trim() || null,
      is_public: isPublic.value,
      waypoints: waypoints.value.map(({ lng, lat, label, type, named }) => ({
        lng,
        lat,
        label,
        ...(type ? { type } : {}),
        ...(named ? { named } : {}),
      })),
      options: { avoid: avoid.value, preference: preference.value },
      geometry: result.value.geometry,
      distance_km: result.value.distanceKm,
      duration_min: result.value.durationMin,
    }
  }

  return {
    routeId,
    name,
    description,
    isPublic,
    waypoints,
    avoid,
    preference,
    result,
    loading,
    error,
    canRoute,
    isFull,
    isEmpty,
    addWaypoint,
    moveWaypointTo,
    updateWaypoint,
    removeWaypoint,
    reorderWaypoint,
    reverseWaypoints,
    setAvoid,
    calculate,
    reset,
    loadRoute,
    toRow,
  }
})
