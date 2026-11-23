// Proxy a OpenRouteService: la key vive acá (secret ORS_KEY), no en el bundle del front.
// Body: { coordinates: [[lng, lat], ...], preference?: 'fastest' | 'shortest', avoid?: string[] }
// Responde el GeoJSON de ORS tal cual.

const ORS_URL = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson'
const MAX_POINTS = 25
const PREFERENCES = ['fastest', 'shortest', 'recommended']
const AVOID = ['highways', 'tollways', 'ferries']

// https://giscience.github.io/openrouteservice/api-reference/error-codes
const ORS_ERRORS = {
  2004: 'La ruta es demasiado larga',
  2009: 'No hay un camino posible entre esos puntos',
  2010: 'Algún punto quedó lejos de una calle: movelo más cerca de un camino',
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function isPoint(p) {
  return (
    Array.isArray(p) &&
    p.length === 2 &&
    Number.isFinite(p[0]) &&
    Number.isFinite(p[1]) &&
    Math.abs(p[0]) <= 180 &&
    Math.abs(p[1]) <= 90
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const key = Deno.env.get('ORS_KEY')
  if (!key) return json({ error: 'Falta configurar ORS_KEY' }, 500)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'El cuerpo no es JSON válido' }, 400)
  }

  const { coordinates, preference = 'fastest', avoid = [] } = body ?? {}

  if (!Array.isArray(coordinates) || coordinates.length < 2 || coordinates.length > MAX_POINTS) {
    return json({ error: `La ruta necesita entre 2 y ${MAX_POINTS} puntos` }, 400)
  }
  if (!coordinates.every(isPoint)) {
    return json({ error: 'Hay coordenadas inválidas' }, 400)
  }
  if (!PREFERENCES.includes(preference)) {
    return json({ error: 'Preferencia de ruta inválida' }, 400)
  }
  if (!Array.isArray(avoid) || !avoid.every((a) => AVOID.includes(a))) {
    return json({ error: 'Opciones para evitar inválidas' }, 400)
  }

  const orsBody = { coordinates, preference }
  if (avoid.length) orsBody.options = { avoid_features: avoid }

  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: { Authorization: key, 'Content-Type': 'application/json' },
    body: JSON.stringify(orsBody),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    // ORS devuelve { error: { code, message } } en inglés
    const code = data?.error?.code ?? null
    const message = ORS_ERRORS[code] ?? 'No se pudo calcular la ruta'
    return json({ error: message, code }, res.status >= 500 ? 502 : 400)
  }

  return json(data)
})
