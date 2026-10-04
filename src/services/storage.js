import supabase from './supabase'

const MAX_SIZE_MB = 1 // defatul max size for images
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] //default allowed types for images

/**
 * Valida y sube una img a {uid}/{uuid}.{ext} dentro del bucket
 * devuelve la url publica
 */
export async function uploadImage(bucket, file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('La imagen debe ser JPG, PNG O Webp.')
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`La imagen debe pesar menos de ${MAX_SIZE_MB}MB.`)
  }

  const { data } = await supabase.auth.getUser()
  const ext = file.name.split('.').pop() // obtiene la extension del archivo
  const path = `${data.user.id}/${crypto.randomUUID()}.${ext}` // carpeta por usuario

  const { error } = await supabase.storage.from(bucket).upload(path, file) // sube la imagen al bucket
  if (error) throw new Error('No se pudo subir la imagen: ' + error.message)

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/**
 * Borra una imagen a partir de una URL publica
 * Si la URL no es de ese bucket no hace nada
 */
export async function deleteImageByUrl(bucket, url) {
  const marker = `/storage/v1/object/public/${bucket}/`
  if (!url || !url.includes(marker)) return // si no es del bucket no hace nada

  const path = url.split(marker)[1] // obtiene la ruta del archivo dentro del bucket
  const { error } = await supabase.storage.from(bucket).remove([path]) // borra la imagen del bucket
  if (error) console.warn('No se pudo borrar la imagen:', error.message)
  // si hay error lanza la excepcion
}
