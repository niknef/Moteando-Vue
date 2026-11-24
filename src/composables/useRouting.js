import supabase from '@/services/supabase'

// Calcula la ruta con OpenRouteService a través de la Edge Function `route`
// (la key de ORS no viaja al navegador). Devuelve el GeoJSON de ORS.
export async function getRouteGeoJSON(coords, preference = 'fastest', avoid = []) {
  const { data, error } = await supabase.functions.invoke('route', {
    body: { coordinates: coords, preference, avoid },
  })

  if (error) {
    if (!navigator.onLine)
      throw new Error('Sin conexión: la ruta se calcula cuando vuelva la señal')
    // El mensaje de la función viene en el body de la respuesta
    const detail = await error.context?.json?.().catch(() => null)
    throw new Error(detail?.error ?? 'No se pudo calcular la ruta')
  }
  return data
}
