import { computed, ref } from 'vue'

// "Instalar la app": Chrome/Android avisan con beforeinstallprompt y guardamos el evento para
// mostrar el botón cuando el usuario quiera. En iPhone no existe: se instala desde Compartir.

const deferred = ref(null)
const installed = ref(window.matchMedia('(display-mode: standalone)').matches)

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred.value = e
})
window.addEventListener('appinstalled', () => {
  installed.value = true
  deferred.value = null
})

const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

export function usePwaInstall() {
  const canInstall = computed(() => !installed.value && !!deferred.value)
  // iPhone sin instalar: no hay botón posible, solo la indicación
  const showIosHint = computed(() => !installed.value && isIos)

  async function install() {
    const e = deferred.value
    if (!e) return false
    deferred.value = null
    await e.prompt()
    const { outcome } = await e.userChoice
    return outcome === 'accepted'
  }

  return { canInstall, showIosHint, installed, install }
}
