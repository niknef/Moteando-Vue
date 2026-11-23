<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import debounce from 'lodash.debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import RouteCard from '@/components/route/RouteCard.vue'
import PostList from '@/pages/PostList.vue'
import { copyRouteToMine, listPublicRoutes } from '@/services/routes'
import { useAuthStore } from '@/stores/auth'

// Descubrir: un solo lugar para "qué hago este finde". Rutas públicas (con filtros, puntaje y
// salidas) y Salidas (lo que publicó la comunidad), que antes eran Explorar y Comunidad.

defineOptions({ name: 'DiscoverRoutes' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

/* ───────── Pestaña (en la URL para que "volver" respete dónde estabas) ───────── */
const tab = computed(() => (route.query.tab === 'salidas' ? 'salidas' : 'rutas'))
const setTab = (value) =>
  router.replace({ query: { ...route.query, tab: value === 'rutas' ? undefined : value } })

/* ───────── Filtros ───────── */
const DISTANCES = [
  { key: 'all', label: 'Todas' },
  { key: 'short', label: 'Hasta 100 km', max: 100 },
  { key: 'mid', label: '100 a 300 km', min: 100, max: 300 },
  { key: 'long', label: 'Más de 300 km', min: 300 },
]
const SORTS = [
  { key: 'recent', label: 'Recientes' },
  { key: 'rating', label: 'Mejor puntuadas' },
  { key: 'near', label: 'Cerca mío' },
]
const search = ref('')
const distance = ref('all')
const noHighways = ref(false)
const sort = ref('recent')

/* ───────── Datos ───────── */
const routes = ref([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const here = ref(null) // { lng, lat } para "Cerca mío"
let requestId = 0

async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  const range = DISTANCES.find((d) => d.key === distance.value)
  try {
    const data = await listPublicRoutes({
      search: search.value,
      minKm: range.min,
      maxKm: range.max,
      noHighways: noHighways.value,
    })
    if (id === requestId) routes.value = data
  } catch (e) {
    if (id === requestId) error.value = e.message
  } finally {
    if (id === requestId) loading.value = false
  }
}

// km en línea recta (alcanza para ordenar por cercanía)
function kmBetween(a, b) {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLng = (b.lng - a.lng) * rad
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(h))
}

const sorted = computed(() => {
  const list = [...routes.value]
  if (sort.value === 'rating') {
    return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.rides - a.rides)
  }
  if (sort.value === 'near' && here.value) {
    return list.sort(
      (a, b) => kmBetween(here.value, a.waypoints[0]) - kmBetween(here.value, b.waypoints[0]),
    )
  }
  return list
})

function pickSort(key) {
  notice.value = ''
  if (key !== 'near' || here.value) {
    sort.value = key
    return
  }
  if (!navigator.geolocation) {
    notice.value = 'Tu navegador no comparte la ubicación'
    return
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      here.value = { lng: coords.longitude, lat: coords.latitude }
      sort.value = 'near'
    },
    () => (notice.value = 'No pudimos saber dónde estás: revisá el permiso de ubicación'),
    { timeout: 8000, maximumAge: 300000 },
  )
}

/* ───────── Guardar en mis rutas ───────── */
const saved = ref(new Set())
const saving = ref(null)

async function saveRoute(r) {
  saving.value = r.id
  notice.value = ''
  try {
    await copyRouteToMine(r)
    saved.value = new Set(saved.value).add(r.id)
  } catch (e) {
    notice.value = e.message
  } finally {
    saving.value = null
  }
}

watch(search, debounce(load, 350))
watch([distance, noHighways], load)
onMounted(load)
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-6 lg:py-10">
    <header class="mb-4">
      <h1 class="text-2xl font-semibold tracking-tight">Descubrir</h1>
      <p class="text-sm text-muted-foreground">Rutas y salidas que compartieron otros moteros</p>
    </header>

    <!-- Pestañas -->
    <div class="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
      <button
        v-for="t in [
          { key: 'rutas', label: 'Rutas' },
          { key: 'salidas', label: 'Salidas' },
        ]"
        :key="t.key"
        type="button"
        role="tab"
        :aria-selected="tab === t.key"
        class="rounded-md py-2 text-sm font-medium transition-colors"
        :class="
          tab === t.key
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        "
        @click="setTab(t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- ───────── Rutas ───────── -->
    <template v-if="tab === 'rutas'">
      <div class="relative mb-3">
        <IconLucide
          name="Search"
          :size="16"
          class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="search"
          type="search"
          class="h-10 pl-9"
          placeholder="Buscar por nombre"
          aria-label="Buscar rutas por nombre"
        />
      </div>

      <!-- Filtros: distancia y sin autopista -->
      <div class="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filtros">
        <button
          v-for="d in DISTANCES"
          :key="d.key"
          type="button"
          class="h-9 shrink-0 rounded-full border px-3.5 text-sm transition-colors"
          :class="
            distance === d.key
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          "
          :aria-pressed="distance === d.key"
          @click="distance = d.key"
        >
          {{ d.label }}
        </button>
        <button
          type="button"
          class="h-9 shrink-0 rounded-full border px-3.5 text-sm transition-colors"
          :class="
            noHighways
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          "
          :aria-pressed="noHighways"
          @click="noHighways = !noHighways"
        >
          Sin autopista
        </button>
      </div>

      <!-- Orden -->
      <div
        class="-mx-4 mb-4 flex items-center gap-2 overflow-x-auto px-4 text-sm whitespace-nowrap"
      >
        <span class="shrink-0 text-muted-foreground">Ordenar:</span>
        <button
          v-for="s in SORTS"
          :key="s.key"
          type="button"
          class="shrink-0 rounded-md px-2 py-1 transition-colors"
          :class="
            sort === s.key
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          "
          :aria-pressed="sort === s.key"
          @click="pickSort(s.key)"
        >
          {{ s.label }}
        </button>
      </div>

      <BaseAlert :message="error || notice" type="error" class="mb-4" />

      <div v-if="loading && !routes.length" class="grid place-items-center py-16">
        <Loader size="lg" />
      </div>

      <div
        v-else-if="!routes.length && !error"
        class="flex flex-col items-center gap-3 py-16 text-center"
      >
        <span class="flex size-14 items-center justify-center rounded-full bg-primary/15">
          <IconLucide name="Compass" :size="26" class="text-primary" />
        </span>
        <p class="font-medium">
          {{
            search || distance !== 'all' || noHighways
              ? 'No hay rutas con esos filtros'
              : 'Todavía no hay rutas públicas'
          }}
        </p>
        <p class="max-w-xs text-sm text-muted-foreground">
          Las rutas aparecen acá cuando sus dueños las hacen públicas.
        </p>
      </div>

      <ul v-else class="space-y-3" :class="{ 'opacity-60': loading }">
        <li v-for="r in sorted" :key="r.id">
          <RouteCard :route="r">
            <template v-if="r.user_id !== auth.user?.id" #actions>
              <Button
                variant="ghost"
                size="icon-lg"
                :disabled="saved.has(r.id) || saving === r.id"
                :aria-label="
                  saved.has(r.id) ? 'Guardada en Mis rutas' : `Guardar ${r.name} en Mis rutas`
                "
                @click="saveRoute(r)"
              >
                <IconLucide
                  :name="saved.has(r.id) ? 'CheckCircle2' : 'BookmarkPlus'"
                  :size="20"
                  :class="saved.has(r.id) ? 'text-primary' : ''"
                />
              </Button>
            </template>
          </RouteCard>
        </li>
      </ul>
    </template>

    <!-- ───────── Salidas ───────── -->
    <template v-else>
      <router-link
        to="/comunidad/publicar"
        class="mb-5 flex items-center gap-3 rounded-xl border border-dashed border-border p-4 transition-colors hover:bg-accent/40"
      >
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15">
          <IconLucide name="Plus" :size="20" class="text-primary" />
        </span>
        <span class="min-w-0">
          <span class="block font-medium">Contá tu salida</span>
          <span class="block text-sm text-muted-foreground">
            Elegí una de tus rutas y publicala con fotos
          </span>
        </span>
      </router-link>
      <PostList embedded />
    </template>
  </div>
</template>
