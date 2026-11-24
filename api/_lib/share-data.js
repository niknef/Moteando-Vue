// Datos para la vista previa de un link (/r/:id y /s/:id) cuando lo abre WhatsApp, Telegram, etc.
// Corre en las funciones de Vercel: lee Supabase con la clave pública (anon), así que solo ve lo
// que cualquiera puede ver (rutas públicas y rodadas).
import { formatDuration, formatKm } from '../../src/lib/format.js'
import { curvinessOf } from '../../src/lib/route-stats.js'

const URL_BASE = process.env.VITE_SUPABASE_URL
const KEY = process.env.VITE_SUPABASE_KEY
const TZ = 'America/Argentina/Buenos_Aires'
const ROUTE_COLS = 'name, description, distance_km, duration_min, geometry, stats, updated_at'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function rest(path) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  if (!res.ok) return null
  const rows = await res.json()
  return rows[0] ?? null
}

// "Muchas curvas · +2.043 m · 46 km de ripio" (lo que haya)
export function statsParts(stats) {
  if (!stats || !Object.keys(stats).length) return []
  const parts = []
  const curves = curvinessOf(stats.curvature)
  if (curves) parts.push(curves.label)
  if (stats.ascentM >= 50) parts.push(`+${stats.ascentM.toLocaleString('es-AR')} m`)
  if (stats.unpavedKm >= 1) parts.push(`${formatKm(Math.round(stats.unpavedKm))} de ripio`)
  return parts
}

const facts = (r) => `${formatKm(r.distance_km)} · ${formatDuration(r.duration_min)}`

/**
 * Lo que muestra la tarjeta. kind: 'r' (ruta) o 's' (rodada). Devuelve null si no existe o
 * no es pública.
 * { kind, title, description, label, headline, subline, chips, geometry, version }
 */
export async function loadShare(kind, id) {
  if (!URL_BASE || !KEY || !UUID.test(id ?? '')) return null

  if (kind === 'r') {
    const r = await rest(`routes?id=eq.${id}&is_public=eq.true&select=${ROUTE_COLS}`)
    if (!r) return null
    const chips = statsParts(r.stats)
    return {
      kind,
      title: r.name,
      description: [
        `Ruta de ${facts(r)}`,
        ...chips,
        r.description?.trim() || 'Abrila en Google Maps o descargá el GPX.',
      ].join(' · '),
      label: 'Ruta en moto',
      headline: r.name,
      subline: facts(r),
      chips,
      geometry: r.geometry,
      version: new Date(r.updated_at).getTime(),
    }
  }

  if (kind === 's') {
    const s = await rest(
      `group_rides?id=eq.${id}&select=starts_at,meeting_point,organizer_name,cancelled,created_at,` +
        `routes(${ROUTE_COLS}),ride_attendees(count)`,
    )
    if (!s?.routes) return null
    const when = new Date(s.starts_at)
    const day = when.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: TZ,
    })
    const time = when.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: TZ,
    })
    // "domingo 29 nov" para la imagen (el título lleva la fecha larga)
    const shortDay = when
      .toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        timeZone: TZ,
      })
      .replace(',', '')
      .replace('.', '')
    const going = s.ride_attendees?.[0]?.count ?? 0
    const goingText = going ? (going === 1 ? 'Va 1' : `Van ${going}`) : null
    const dayCap = day.charAt(0).toUpperCase() + day.slice(1)
    return {
      kind,
      title: `${s.cancelled ? 'Cancelada · ' : ''}Rodada: ${s.routes.name} · ${dayCap}, ${time} h`,
      description: [
        `Encuentro: ${s.meeting_point}`,
        `Organiza ${s.organizer_name}`,
        goingText,
        s.cancelled ? 'Rodada cancelada' : 'Tocá "Voy" para anotarte, sin cuenta.',
      ]
        .filter(Boolean)
        .join(' · '),
      label: s.cancelled ? 'Rodada cancelada' : 'Rodada',
      headline: `${shortDay.charAt(0).toUpperCase() + shortDay.slice(1)} · ${time} h`,
      subline: `${s.routes.name} · ${facts(s.routes)}`,
      chips: [goingText, `Encuentro: ${s.meeting_point}`].filter(Boolean),
      geometry: s.routes.geometry,
      version: new Date(s.routes.updated_at).getTime() + (s.cancelled ? 1 : 0),
    }
  }
  return null
}
