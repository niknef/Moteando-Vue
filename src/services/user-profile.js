/**
 * Agrega un nuevo perfil de usuario a la tabla "profiles"
 * 
 * @param {{id: string, email: string}} data 
 * @returns {Promise<void>}
 */
export async function addUserProfile(data) {
  // Esta función se encargará de crear el perfil extendido al momento del registro
  // TODO: Implementar insert en Supabase
}

/**
 * Obtiene el perfil extendido del usuario por su ID
 * 
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getUserProfileByPK(id) {
  // Esta función traerá el perfil completo desde Supabase
  // TODO: Implementar select by primary key
  return {}
}

/**
 * Actualiza los campos del perfil extendido del usuario
 * 
 * @param {string} id 
 * @param {Object} data 
 * @returns {Promise<void>}
 */
export async function updateUserProfile(id, data) {
  // Esta función actualizará nombre, apellido, bio, moto, etc.
  // TODO: Implementar update en Supabase
}
