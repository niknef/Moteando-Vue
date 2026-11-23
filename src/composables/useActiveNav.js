import { computed, toValue } from 'vue'
import { useRoute } from 'vue-router'

// Devuelve la dirección activa entre las de una barra de navegación:
// la más larga que coincide con el principio de la ruta actual.
// Así /rutas/nueva marca "Crear" (no "Mis rutas") y /comunidad/123 sigue marcando "Comunidad".
export function useActiveNav(paths) {
  const route = useRoute()

  return computed(
    () =>
      toValue(paths)
        .filter((to) => route.path === to || route.path.startsWith(to + '/'))
        .sort((a, b) => b.length - a.length)[0],
  )
}
