import { formatShortDate } from '@/lib/format'

// Ayudas para mostrar una salida (post).

// Nombre: el de la ruta vinculada; si no hay, el que se escribió al publicar
export const postTitle = (p) => p.routes?.name || p.route_name || 'Salida'

// "Salió el 12 nov" si tiene fecha de la salida; si no, cuándo se publicó
export const postDateText = (p) =>
  p.ride_date
    ? `Salió el ${formatShortDate(p.ride_date + 'T12:00')}`
    : `Publicada el ${formatShortDate(p.created_at)}`

export const authorName = (p) =>
  [p.user_profiles?.first_name, p.user_profiles?.last_name].filter(Boolean).join(' ') || 'Motero'

// Posts viejos (sin ruta guardada) tenían la duración como "02:30:00"
export function legacyDuration(duration) {
  if (!duration) return null
  const [h, m] = duration.split(':').map((n) => parseInt(n))
  if (!h && !m) return null
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ')
}

// Posts viejos: salida y llegada como puntos, para armar una ruta nueva en el diseñador
export function legacyRouteQuery(p) {
  const a = p.start_geom?.coordinates
  const b = p.end_geom?.coordinates
  if (!a || !b) return null
  return { originLng: a[0], originLat: a[1], destLng: b[0], destLat: b[1] }
}
