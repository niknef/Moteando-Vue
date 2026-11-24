/* ------------------------------------------------------------------ */
/*  services/rides.js · rodadas (salidas grupales) y anotados         */
/* ------------------------------------------------------------------ */
import supabase from './supabase'

const ROUTE_EMBED =
  'routes ( id, name, waypoints, options, geometry, distance_km, duration_min, stats )'

/**
 * Crea una rodada sobre una ruta. Devuelve la fila creada.
 * organizerName se guarda en la rodada: el link es público y los perfiles no se leen sin cuenta.
 */
export async function createRide({ routeId, organizerName, startsAt, meetingPoint, notes }) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Iniciá sesión para organizar una rodada')

  const { data, error } = await supabase
    .from('group_rides')
    .insert({
      route_id: routeId,
      organizer_id: user.id,
      organizer_name: organizerName,
      starts_at: startsAt,
      meeting_point: meetingPoint,
      notes: notes || null,
    })
    .select('id')
    .single()

  if (error) throw new Error('No se pudo crear la rodada: ' + error.message)
  return data
}

/**
 * Una rodada con su ruta y la lista de anotados (orden de llegada).
 */
export async function getRide(id) {
  const { data, error } = await supabase
    .from('group_rides')
    .select(
      `id, route_id, organizer_id, organizer_name, starts_at, meeting_point, notes, cancelled,
       ${ROUTE_EMBED},
       ride_attendees ( id, user_id, name, with_passenger, created_at )`,
    )
    .eq('id', id)
    .order('created_at', { referencedTable: 'ride_attendees', ascending: true })
    .maybeSingle()

  if (error) throw new Error('No se pudo cargar la rodada: ' + error.message)
  if (!data) throw new Error('No encontramos esa rodada')
  return data
}

/**
 * Próximas rodadas (las que empiezan desde hace 6 h en adelante), la más cercana primero,
 * con la cantidad de anotados.
 */
export async function listUpcomingRides({ limit = 30 } = {}) {
  const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('group_rides')
    .select(
      `id, organizer_id, organizer_name, starts_at, meeting_point, cancelled,
       ${ROUTE_EMBED},
       ride_attendees ( count )`,
    )
    .eq('cancelled', false)
    .gte('starts_at', since)
    .order('starts_at', { ascending: true })
    .limit(limit)

  if (error) throw new Error('No se pudieron cargar las rodadas: ' + error.message)
  // si la ruta dejó de ser pública no se puede mostrar: se saltea
  return data
    .filter((r) => r.routes)
    .map((r) => ({ ...r, attendees: r.ride_attendees?.[0]?.count ?? 0 }))
}

/**
 * "Voy". Con cuenta va con el user_id; sin cuenta, solo con el nombre.
 */
export async function joinRide(rideId, { name, withPassenger = false, userId = null }) {
  const { data, error } = await supabase
    .from('ride_attendees')
    .insert({ ride_id: rideId, user_id: userId, name: name.trim(), with_passenger: withPassenger })
    .select('id, user_id, name, with_passenger, created_at')
    .single()

  if (error) {
    if (error.code === '23505') throw new Error('Ya estás anotado en esta rodada')
    if (error.code === '42501') throw new Error('Esta rodada ya no acepta anotados')
    throw new Error('No se pudo anotarte: ' + error.message)
  }
  return data
}

/**
 * Bajarse de una rodada (o, si sos quien organiza, sacar a alguien).
 */
export async function leaveRide(attendeeId) {
  const { error } = await supabase.from('ride_attendees').delete().eq('id', attendeeId)
  if (error) throw new Error('No se pudo quitar de la rodada: ' + error.message)
}

/**
 * Cancelar una rodada propia (queda visible como cancelada y no acepta anotados).
 */
export async function cancelRide(id) {
  const { error } = await supabase.from('group_rides').update({ cancelled: true }).eq('id', id)
  if (error) throw new Error('No se pudo cancelar la rodada: ' + error.message)
}
