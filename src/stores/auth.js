import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import supabase from '@/services/supabase'
import { getUserProfileByPK } from '@/services/user-profile'

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

  return { session, profile, user, isLoggedIn, init, loadProfile }
})
