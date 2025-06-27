import supabase from './supabase'
import {
  addUserProfile,
  getUserProfileByPK,
  updateUserProfile
} from './user-profile'

/* ------------------------------------------------------------------ */
/* Estado local                                                        */
/* ------------------------------------------------------------------ */
let user = {
  id: null,
  email: null,
  first_name: null,
  last_name: null,
  bio: null,
  avatar_url: null,
  active_bike_id: null          // ← FK a user_bikes
}

let observers = []

/* ------------------------------------------------------------------ */
/* Sesión persistida                                                   */
/* ------------------------------------------------------------------ */
if (localStorage.getItem('user')) {
  user = JSON.parse(localStorage.getItem('user'))
}
loadCurrentUser()

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function notify (cb)     { cb({ ...user }) }
function notifyAll ()    { observers.forEach(notify) }
function updateUser (d)  {
  user = { ...user, ...d }
  user.id ? localStorage.setItem('user', JSON.stringify(user))
          : localStorage.removeItem('user')
  notifyAll()
}

/* ------------------------------------------------------------------ */
/* Cargar usuario actual (Auth + perfil)                               */
/* ------------------------------------------------------------------ */
async function loadCurrentUser () {
  const { data } = await supabase.auth.getUser()
  if (!data?.user) return null

  updateUser({ id: data.user.id, email: data.user.email })
  await loadCurrentUserProfile()
}

async function loadCurrentUserProfile () {
  try {
    const profile = await getUserProfileByPK(user.id)
    updateUser(profile)
  } catch (err) {
    console.error('[auth] loadCurrentUserProfile:', err)
  }
}

/* ------------------------------------------------------------------ */
/* Registro                                                            */
/* ------------------------------------------------------------------ */
export async function register (email, password, first, last) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  await addUserProfile({
    id: data.user.id,
    email,
    first_name: first,
    last_name : last
  })

  updateUser({
    id: data.user.id,
    email: data.user.email,
    first_name: first,
    last_name : last
  })

  return data.user
}

/* ------------------------------------------------------------------ */
/* Login / Logout                                                      */
/* ------------------------------------------------------------------ */
export async function login (email, password) {
  const { data, error } =
    await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  updateUser({ id: data.user.id, email: data.user.email })
  await loadCurrentUserProfile()
  return data.user
}

export async function logout () {
  await supabase.auth.signOut()
  updateUser({
    id: null,
    email: null,
    first_name: null,
    last_name: null,
    bio: null,
    avatar_url: null,
    active_bike_id: null
  })
}

/* ------------------------------------------------------------------ */
/* Perfil: update (sin bike_model)                                     */
/* ------------------------------------------------------------------ */
export async function updateAuthProfile (data) {
  try {
    await updateUserProfile(user.id, data)
    updateUser(data)
  } catch (err) {
    console.error('[auth] updateAuthProfile:', err)
    throw err
  }
}

/* ------------------------------------------------------------------ */
/* Observer                                                            */
/* ------------------------------------------------------------------ */
export async function subscribeToAuth (cb) {
  observers.push(cb)
  notify(cb)
}
