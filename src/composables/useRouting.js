import axios from 'axios'

export async function getRouteGeoJSON (coords, profile = 'driving-car', preference = 'fastest') {
  const { data } = await axios.post(
    `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
    { coordinates: coords, preference },                 // ← agrega preference
    { params: { api_key: import.meta.env.VITE_ORS_KEY },
      headers: { 'Content-Type': 'application/json' } }
  )
  return data
}
