import supabase from "./supabase";
/**
 * Agrega un nuevo perfil de usuario a la tabla "profiles"
 * 
 * @param {{id: string, email: string}} data 
 * @returns {Promise<void>}
 */
export async function addUserProfile(data) {
  // Esta función se encargará de crear el perfil extendido al momento del registro
  const { error } = await supabase
    .from('user_profiles')
    .insert({
      ...data
    });

  if (error) {
    console.error('[user-profile.js addUserProfile] No se pudo crear el perfi: ', error);
    throw new Error('No se pudo crear el perfil' + error );
  }
}

/**
 * Obtiene el perfil extendido del usuario por su ID
 * 
 * @param {string} id 
 * @returns {Promise<Object>}
 */
export async function getUserProfileByPK(id) {
    // Esta función traerá el perfil completo desde Supabase
    const { data, error } = await supabase
          .from('user_profiles')
          .select()
          .eq('id', id);

      if(error) {
          console.error('[user-profile.js getUserProfileByPK] No se pudo traer el perfil, ya que hay uno o más errores en el valor recibido.', error);
          
          throw new Error('No se pudo traer el perfil, ya que hay uno o más errores en el valor recibido.' + error);
      }
      // hard-codeamos la posición 0 del array.
      return data[0];
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
