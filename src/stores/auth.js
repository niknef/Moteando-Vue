import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import supabase from '@/services/supabase'
import { getUserProfileByPK, updateUserProfile } from '@/services/user-profile'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const session = ref(null)
  const profile = ref(null)

  // Derivados
  const user = computed(() => session.value?.user ?? null)
  const isLoggedIn = computed(() => !!session.value)

  // Acciones
  async function loadProfile() {
    // Si no hay usuario, no hay perfil
    if (!user.value) {
      profile.value = null
      return
    }
    // Cargar el perfil del usuario
    profile.value = await getUserProfileByPK(user.value.id)
  }

  let initPromise = null

  function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const { data } = await supabase.auth.getSession()
      session.value = data.session
      await loadProfile()

      supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession
        setTimeout(loadProfile, 0)
      })
    })()
    return initPromise
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    // Se asigna acá (además de onAuthStateChange) para que el perfil
    // esté cargado cuando la página navega después del login
    session.value = data.session
    await loadProfile()
  }

  async function register(email, password, firstName, lastName) {
    // first_name y last_name los lee el trigger que crea el perfil
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    })
    if (error) throw error

    session.value = data.session
    await loadProfile()
  }

  async function logout() {
    await supabase.auth.signOut()
    session.value = null
    profile.value = null
  }

  async function updateProfile(data) {
    await updateUserProfile(user.value.id, data)
    profile.value = { ...profile.value, ...data }
  }

  return {
    session,
    profile,
    user,
    isLoggedIn,
    init,
    loadProfile,
    login,
    register,
    logout,
    updateProfile,
  }
})
