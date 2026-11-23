import { LngLatBounds } from 'maplibre-gl'

// Piezas compartidas para dibujar una ruta en un mapa MapLibre (diseñador y página pública).

// Colores del tema: el mapa no lee clases de Tailwind, se toman de las variables de :root
export function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim()
}

// Marcador redondo: A (salida, verde petróleo), 1, 2… (paradas) y B (llegada)
export function waypointMarkerElement(index, total, { draggable = false } = {}) {
  const isStart = index === 0
  const isEnd = total > 1 && index === total - 1
  const el = document.createElement(draggable ? 'button' : 'div')
  if (draggable) el.type = 'button'
  el.className = [
    'grid size-8 place-items-center rounded-full border-2 border-background text-sm font-bold shadow-lg',
    draggable ? 'cursor-grab active:cursor-grabbing' : '',
    isStart ? 'bg-brand-teal text-foreground' : 'bg-primary text-primary-foreground',
  ].join(' ')
  el.textContent = isStart ? 'A' : isEnd ? 'B' : String(index)
  el.setAttribute('aria-label', isStart ? 'Salida' : isEnd ? 'Llegada' : `Parada ${index}`)
  return el
}

// Crea o actualiza la línea naranja (con borde oscuro). geometry: LineString o null para borrarla.
export function setRouteLine(map, sourceId, geometry) {
  const data = geometry
    ? { type: 'Feature', geometry, properties: {} }
    : { type: 'FeatureCollection', features: [] }

  const source = map.getSource(sourceId)
  if (source) {
    source.setData(data)
    return
  }
  map.addSource(sourceId, { type: 'geojson', data })
  map.addLayer({
    id: `${sourceId}-casing`,
    type: 'line',
    source: sourceId,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': themeColor('surface-deep'), 'line-width': 9 },
  })
  map.addLayer({
    id: `${sourceId}-line`,
    type: 'line',
    source: sourceId,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': themeColor('primary'), 'line-width': 5 },
  })
}

// Caja que contiene todas las coordenadas [[lng, lat], ...]
export function boundsOf(coords) {
  return coords.reduce((b, c) => b.extend(c), new LngLatBounds(coords[0], coords[0]))
}
