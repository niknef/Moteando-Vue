/* ------------------------------------------------------------------ */
/*  services/bikes.js                                                 */
/* ------------------------------------------------------------------ */
import supabase from './supabase'

/* --------------------------- CONSTANTES --------------------------- */
const BUCKET = 'bikes'                         // bucket de Storage

/* --------------------------- UTILIDADES --------------------------- */

/**
 * Devuelve un UUID v4 (browser o Node).
 */
function uuid () {
  return (crypto?.randomUUID)                 // navegador moderno
    ? crypto.randomUUID()
    : ([1e7]+-1e3+-4e3+-8e3+-1e11)            // fallback
        .replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16))
}

/**
 * Sube una imagen al bucket `bikes/<uid>/` y devuelve su URL pública.
 * @param {File} file  – imagen seleccionada por el usuario
 * @returns {Promise<string>}  URL pública
 */
export async function uploadBikePhoto (file) {
  const uid      = (await supabase.auth.getUser()).data.user.id
  const ext      = file.name.split('.').pop()
  const filename = `${uuid()}.${ext}`
  const path     = `${uid}/${filename}`               // 👈 folder del usuario

  const { error } = await supabase
    .storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert     : false
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
export async function addBike (bike) {
  const { error } = await supabase.from('user_bikes').insert(bike)
  if (error) throw new Error('No se pudo guardar la moto: ' + error.message)
}

/**
 * Lista todas las motos ordenadas (máx 5).
 */
export async function listBikes () {
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
export async function getActiveBike () {
  const { data, error } = await supabase
    .from('user_bikes')
    .select('*')
    .eq('is_active', true)
    .single()

  if (error && error.code !== 'PGRST116')   // 116 = no rows
    throw new Error(error.message)

  return data ?? null
}

/**
 * Actualiza una moto.
 */
export async function updateBike (bikeId, data) {
  const { error } = await supabase
    .from('user_bikes')
    .update(data)
    .eq('id', bikeId)

  if (error) throw new Error('No se pudo actualizar la moto: ' + error.message)
}

/**
 * Elimina una moto.
 */
export async function deleteBike (bikeId) {
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
export async function setActiveBike (bikeId) {
  const uid = (await supabase.auth.getUser()).data.user.id

  // 1) desactivar la actual
  await supabase
    .from('user_bikes')
    .update({ is_active: false })
    .eq('user_id', uid)
    .eq('is_active', true)

  // 2) activar la elegida
  const { error } = await supabase
    .from('user_bikes')
    .update({ is_active: true })
    .eq('id', bikeId)

  if (error) throw new Error('No se pudo activar la moto: ' + error.message)

  // 3) guardar referencia en el perfil
  await supabase
    .from('user_profiles')
    .update({ active_bike_id: bikeId })
    .eq('id', uid)
}

/* ------------------------ LÍMITE (5 MOTOS) ----------------------- */

export async function hasReachedBikeLimit () {
  const { count, error } = await supabase
    .from('user_bikes')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count >= 5
}

export async function getBikeById(bikeId) {
  const { data, error } = await supabase
    .from('user_bikes') // ← nombre correcto
    .select('*')
    .eq('id', bikeId)
    .single()

  if (error) throw error
  return data
}
