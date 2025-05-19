import supabase from './supabase'
import { addUserProfile, getUserProfileByPK, updateUserProfile } from './user-profile'

//--------------------------------------------------------------------
// Definimos la variable para los datos del usuario
//--------------------------------------------------------------------
let user = {
  id: null,
  email: null,
  first_name: null,
  last_name: null,
  bio: null,
  bike_model: null,
  avatar_url: null
}

//--------------------------------------------------------------------
// Definimos un array para los observers 
//--------------------------------------------------------------------
let observers = []

//--------------------------------------------------------------------
// Invocamos la función para cargar los datos actuales del usuario 
//--------------------------------------------------------------------
loadCurrentUser()

//--------------------------------------------------------------------
// Si hay datos en localStorage, los usamos para facilitar el reload
//--------------------------------------------------------------------
if (localStorage.getItem('user')) {
  user = JSON.parse(localStorage.getItem('user'))
}

/**
 * Verificamos si el usuario ya estaba autenticado en Supabase
 * y en caso afirmativo, lo cargamos al sistema.
 */
async function loadCurrentUser() {
  const { data } = await supabase.auth.getUser()

  // Si no hay un usuario, retornamos null.
  if (!data?.user) return null

  // Actualizamos los datos del usuario, y notificamos a los observers.
  updateUser({
    id: data.user.id,
    email: data.user.email
  })

  // Cargamos el perfil del usuario extendido
  loadCurrentUserProfile()
}

/**
 * Carga el perfil extendido del usuario autenticado.
 */
async function loadCurrentUserProfile() {
  try {
    const profile = await getUserProfileByPK(user.id)
    updateUser(profile)
  } catch (error) {
    console.error('[auth.js loadCurrentUserProfile] Error al obtener el perfil del usuario:', error)
  }
}

/**
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise}
 */
export async function register(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    console.error('[auth.js register] Error al registrarse:', error)
    throw error
  }

  // Creamos el perfil del usuario
  try {
    await addUserProfile({
      id: data.user.id,
      email
    })
  } catch (error) {
    console.error('[auth.js register] Error al crear el perfil del usuario:', error)
  }

  // Actualizamos los datos del usuario, y notificamos a los observers.
  updateUser({
    id: data.user.id,
    email: data.user.email
  })

  return data.user
}

/**
 * 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise}
 */
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('[auth.js login] Error al iniciar sesión:', error)
    throw error
  }

  // Actualizamos los datos básicos
  updateUser({
    id: data.user.id,
    email: data.user.email
  })

  // Cargamos el resto del perfil
  loadCurrentUserProfile()

  return data.user
}

export async function logout() {
  supabase.auth.signOut()

  // Vaciamos el usuario.
  updateUser({
    id: null,
    email: null,
    first_name: null,
    last_name: null,
    bio: null,
    bike_model: null,
    avatar_url: null
  })
}

/**
 * Actualiza el perfil del usuario autenticado.
 * 
 * @param {{first_name?: string, last_name?: string, bio?: string, bike_model?: string, avatar_url?: string}} data 
 */
export async function updateAuthProfile(data) {
  try {
    await updateUserProfile(user.id, { ...data })
    updateUser(data)
  } catch (error) {
    console.error('[auth.js updateAuthProfile] Error al actualizar el perfil del usuario autenticado:', error)
    throw error
  }
}

/*--------------------------------------------------------------------
| Métodos del observer
+---------------------------------------------------------------------*/

/**
 * Registra un "observer" que será notificado con los datos del usuario cada vez que el estado de autenticación, o los
 * datos del usuario, cambien.
 * 
 * @param {(user: typeof user) => void} callback 
 */
export async function subscribeToAuth(callback) {
  // Guardamos el observer en el array.
  observers.push(callback)

  // Notificamos al observer de los datos actuales.
  notify(callback)
}

/**
 * Ejecuta un "observer" para notificarle el estado del usuario actual.
 * 
 * @param {(user: typeof user) => void} callback 
 */
function notify(callback) {
  // Invocamos el observer, y le pasamos una copia de los datos del objeto "user".
  callback({ ...user })
}

/**
 * Notifica a todos los observers del estado actual del "user".
 * La idea es que cada vez que "user" cambie, se notifique a todos los observers.
 */
function notifyAll() {
  observers.forEach(callback => notify(callback))
}

/**
 * Actualiza la data del usuario con la info provista, y notifica a todos los observers.
 * 
 * @param {Partial<typeof user>} data 
 */
function updateUser(data) {
  user = {
    ...user,
    ...data
  }

  if (user.id !== null) {
    localStorage.setItem('user', JSON.stringify(user))
  } else {
    localStorage.removeItem('user')
  }

  notifyAll()
}
