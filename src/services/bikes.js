/* ------------------------------------------------------------------ */
/*  services/bikes.js                                                 */
/* ------------------------------------------------------------------ */
import supabase from './supabase'

/* --------------------------- CONSTANTES --------------------------- */
const BUCKET = 'bikes'                         // bucket de Storage

/* --------------------------- UTILIDADES --------------------------- */

/**
 * Genera un UUID v4 (navegadores modernos).
 */
function uuid() {
  return crypto.randomUUID()
}

/**
 * Sube una imagen al bucket `bikes/<uid>/` y devuelve su URL pública.
 * @param {File} file  – imagen seleccionada por el usuario
 * @returns {Promise<string>}  URL pública
 */
export async function uploadBikePhoto(file) {
  const uid = (await supabase.auth.getUser()).data.user.id
  const ext = file.name.split('.').pop()
  const filename = `${uuid()}.${ext}`
  const path = `${uid}/${filename}` // carpeta por usuario

  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    })

  if (error) throw new Error('No se pudo subir la imagen: ' + error.message)

  return supabase
    .storage
    .from(BUCKET)
    .getPublicUrl(path).data.publicUrl
}

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
 * Obtiene la moto activa o null.
 */
export async function getActiveBike() {
  const { data, error } = await supabase
    .from('user_bikes')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw new Error('Error al obtener la moto activa: ' + error.message)

  return data ?? null
}

/**
 * Actualiza una moto.
 */
export async function updateBike(bikeId, data) {
  const { error } = await supabase
    .from('user_bikes')
    .update(data)
    .eq('id', bikeId)

  if (error) throw new Error('No se pudo actualizar la moto: ' + error.message)
}

/**
 * Elimina una moto.
 */
export async function deleteBike(bikeId) {
  const { error } = await supabase
    .from('user_bikes')
    .delete()
    .eq('id', bikeId)

  if (error) throw new Error('No se pudo eliminar la moto: ' + error.message)
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
  const { error } = await supabase
    .from('user_bikes')
    .update({ is_active: true })
    .eq('id', bikeId)

  if (error) throw new Error('No se pudo activar la moto: ' + error.message)

  // 3) Guardar referencia en el perfil
  await supabase
    .from('user_profiles')
    .update({ active_bike_id: bikeId })
    .eq('id', uid)
}

/* ------------------------ LÍMITE (5 MOTOS) ----------------------- */

export async function hasReachedBikeLimit() {
  const { count, error } = await supabase
    .from('user_bikes')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count >= 5
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
