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
  // El id se genera acá: pedir la fila de vuelta (insert + select) choca con las policies de
  // lectura de user_bikes y user_profiles (recursión). Así no hace falta.
  const row = { ...bike, id: crypto.randomUUID() }
  const { error } = await supabase.from('user_bikes').insert(row)
  if (error) {
    // la policy "máx. 5" es restrictiva: el insert de la sexta falla por RLS
    if (error.code === '42501') throw new Error('Llegaste al máximo de 5 motos')
    throw new Error('No se pudo guardar la moto: ' + error.message)
  }
  return row
}

/**
 * Lista las motos del usuario logueado (máx 5).
 * Filtra por user_id a propósito: RLS también deja leer la moto activa de otros perfiles.
 */
export async function listBikes() {
  // getSession lee la sesión guardada (sin pedirla al servidor): así funciona sin señal.
  // Es una lectura: la que decide qué filas se ven es RLS.
  const user = (await supabase.auth.getSession()).data.session?.user
  if (!user) throw new Error('Iniciá sesión para ver tus motos')

  const { data, error } = await supabase
    .from('user_bikes')
    .select('*')
    .eq('user_id', user.id)
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
export async function deleteBike(bike, others = []) {
  // el perfil apunta a la moto activa (FK sin ON DELETE): antes de borrarla, la activa pasa a
  // otra moto o el perfil queda sin moto
  if (bike.is_active) {
    if (others.length) await setActiveBike(others[0].id)
    else await clearActiveBike()
  }

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
 * Deja el perfil sin moto activa.
 */
async function clearActiveBike() {
  const uid = (await supabase.auth.getUser()).data.user.id
  const { error } = await supabase
    .from('user_profiles')
    .update({ active_bike_id: null })
    .eq('id', uid)
  if (error) throw new Error('No se pudo quitar la moto activa: ' + error.message)
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
