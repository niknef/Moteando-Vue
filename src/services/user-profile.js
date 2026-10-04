import supabase from "./supabase";

/**
 * Obtiene el perfil extendido del usuario por su ID
 * 
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getUserProfileByPK(id) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle() 

  if (error) {
    console.error('[user-profile.js getUserProfileByPK] Error al traer el perfil:', error)
    throw new Error('Error al traer el perfil: ' + error.message)
  }

  if (!data) {
    console.warn('[user-profile.js getUserProfileByPK] No se encontró el perfil.')
    return null
  }

  return data
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
  const { error } = await supabase
        .from('user_profiles')
        .update({...data})
        .eq('id', id);
        

    
    if(error) {
        console.error('[user-profile.js updateUserProfile] No se pudo editar el perfil: ', error);
        
        throw new Error('No se pudo editar el perfil:' + error);
    }
}
