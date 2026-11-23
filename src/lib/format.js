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
