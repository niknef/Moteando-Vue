/* ------------------------------------------------------------------ */
/*  services/bikes.js                                                 */
/* ------------------------------------------------------------------ */
import supabase from './supabase'
import { deleteImageByUrl } from './storage'

/* --------------------------- CRUD MOTOS --------------------------- */

/**
 * Añade una moto a la tabla `user_bikes`.
 */
export async function addBike(bike) {
  const { error } = await supabase.from('user_bikes').insert(bike)
  if (error) throw new Error('No se pudo guardar la moto: ' + error.message)
}

/**
 * Lista todas las motos ordenadas (máx 5).
 */
export async function listBikes() {
  const { data, error } = await supabase
    .from('user_bikes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error('No se pudieron obtener las motos: ' + error.message)
  return data
}

/**
 * Actualiza una moto.
 */
export async function updateBike(bikeId, data) {
  const { error } = await supabase.from('user_bikes').update(data).eq('id', bikeId)

  if (error) throw new Error('No se pudo actualizar la moto: ' + error.message)
}

/**
 * Elimina una moto y su foto del Storage.
 * Recibe la moto entera porque necesita el id y la URL de la foto.
 */
export async function deleteBike(bike) {
  const { error } = await supabase.from('user_bikes').delete().eq('id', bike.id)

  if (error) throw new Error('No se pudo eliminar la moto: ' + error.message)

  // Recién cuando la fila se borró, se borra la foto
  await deleteImageByUrl('bikes', bike.photo_url)
}

/* ---------------------- MARCAR MOTO ACTIVA ----------------------- */

/**
 * Marca la moto `bikeId` como activa y desactiva la anterior.
 */
export async function setActiveBike(bikeId) {
  const uid = (await supabase.auth.getUser()).data.user.id

  // 1) Desactivar la moto actual
  await supabase
    .from('user_bikes')
    .update({ is_active: false })
    .eq('user_id', uid)
    .eq('is_active', true)

  // 2) Activar la moto elegida
  const { error } = await supabase.from('user_bikes').update({ is_active: true }).eq('id', bikeId)

  if (error) throw new Error('No se pudo activar la moto: ' + error.message)

  // 3) Guardar referencia en el perfil
  await supabase.from('user_profiles').update({ active_bike_id: bikeId }).eq('id', uid)
}

/**
 * Busca una moto por ID y devuelve null si no existe.
 */
export async function getBikeById(bikeId) {
  const { data, error } = await supabase
    .from('user_bikes')
    .select('*')
    .eq('id', bikeId)
    .maybeSingle()

  if (error) throw new Error('Error al obtener la moto: ' + error.message)

  if (!data) return null

  return data
}
