// Formatos de números y fechas para mostrar (es-AR).

// 87 → "1 h 27 min"; 45 → "45 min"; 120 → "2 h"
export function formatDuration(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// 110.5 → "110,5 km"
export function formatKm(km) {
  return `${Number(km).toLocaleString('es-AR', { maximumFractionDigits: 1 })} km`
}

// Fecha corta: "23 nov" (o "23 nov 2025" si no es de este año)
export function formatShortDate(value) {
  const date = new Date(value)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

// "hace 5 min", "hace 3 h", "ayer"; pasada una semana, la fecha corta
export function formatRelative(value) {
  const date = new Date(value)
  const seconds = (date.getTime() - Date.now()) / 1000
  const rtf = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto', style: 'short' })
  const abs = Math.abs(seconds)
  if (abs < 60) return 'recién'
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86400) return rtf.format(Math.round(seconds / 86400), 'day')
  return formatShortDate(value)
}
