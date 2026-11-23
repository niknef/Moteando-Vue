import { computed, toValue } from 'vue'
import { useRoute } from 'vue-router'

// Devuelve la dirección activa entre las de una barra de navegación:
// la más larga que coincide con el principio de la ruta actual.
// Así /rutas/nueva marca "Crear" (no "Mis rutas") y /comunidad/123 sigue marcando "Comunidad".
export function useActiveNav(paths) {
  const route = useRoute()

  return computed(() => {
    // Editar una ruta es seguir en el diseñador: marca "Crear", no "Mis rutas".
    // Los posts (/comunidad/…) son parte de Descubrir.
    let path = route.path
    if (/^\/rutas\/[^/]+\/editar$/.test(path)) path = '/rutas/nueva'
    else if (path.startsWith('/comunidad')) path = '/descubrir'
    return toValue(paths)
      .filter((to) => path === to || path.startsWith(to + '/'))
      .sort((a, b) => b.length - a.length)[0]
  })
}
