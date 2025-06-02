import { ref } from 'vue'
import axios from 'axios'
import debounce from 'lodash.debounce'

export function useGeocoding () {
  const results = ref([])

  const search = debounce(async q => {
    if (q.trim().length < 3) return (results.value = [])

    const { data } = await axios.get(
      `${import.meta.env.VITE_NOMINATIM_URL}/search`,
      { params: { q, format: 'json', addressdetails: 1, limit: 5 } }
    )
    results.value = data
  }, 500)

  return { results, search }
}
              