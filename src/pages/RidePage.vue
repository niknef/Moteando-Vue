<script setup>
import { Marker } from 'maplibre-gl'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'

import Logo from '@/assets/moteando.svg'
import Loader from '@/components/ui/Loader.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMap } from '@/composables/useMap'
import { cancelRide, getRide, joinRide, leaveRide } from '@/services/rides'
import { useAuthStore } from '@/stores/auth'
import { formatDuration, formatKm } from '@/lib/format'
import { downloadGpx, openInGoogleMaps } from '@/lib/share'
import { boundsOf, setRouteLine, waypointMarkerElement } from '@/lib/map-route'

// Página de una rodada (/s/:id): el link que se manda al grupo. Se abre sin cuenta y
// cualquiera se anota con "Voy" (sin cuenta, solo con el nombre).

defineOptions({ name: 'RidePage' })

const ROUTE_SOURCE = 'ride-route'
const DESKTOP = '(min-width: 1024px)'

const route = useRoute()
const auth = useAuthStore()
const { map, init } = useMap()

const mapContainer = ref(null)
const card = ref(null)
const ride = ref(null)
const loading = ref(true)
const notFound = ref(false)
const toast = ref('')
const busy = ref(false)
let markers = []

// Sin cuenta, el "Voy" se recuerda en este navegador para no anotarse dos veces
const anonJoined = useLocalStorage(`moteando:ride:${route.params.id}`, null, {
  serializer: { read: (v) => (v ? JSON.parse(v) : null), write: (v) => JSON.stringify(v) },
})
const name = ref(
  [auth.profile?.first_name, auth.profile?.last_name].filter(Boolean).join(' ') || '',
)
const withPassenger = ref(false)

/* ───────── Datos derivados ───────── */
const r = computed(() => ride.value?.routes)
const attendees = computed(() => ride.value?.ride_attendees ?? [])
const passengers = computed(() => attendees.value.filter((a) => a.with_passenger).length)
const startsAt = computed(() => (ride.value ? new Date(ride.value.starts_at) : null))
const isPast = computed(() => startsAt.value && startsAt.value.getTime() < Date.now() - 12 * 3600e3)
const isOrganizer = computed(() => !!auth.user && ride.value?.organizer_id === auth.user.id)
const myAttendance = computed(() =>
  auth.user
    ? attendees.value.find((a) => a.user_id === auth.user.id)
    : attendees.value.find((a) => a.id === anonJoined.value?.id),
)
const canJoin = computed(() => ride.value && !ride.value.cancelled && !isPast.value)

const dayText = computed(() =>
  startsAt.value?.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
)
const timeText = computed(() =>
  startsAt.value?.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }),
)
const inDays = computed(() => {
  if (!startsAt.value) return ''
  // copia: setHours modifica la fecha y startsAt se usa también para la hora
  const days = Math.round(
    (new Date(startsAt.value).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5,
  )
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  return days > 1 ? `En ${days} días` : ''
})

/* ───────── Mapa ───────── */
function mapPadding() {
  if (window.matchMedia(DESKTOP).matches) return { top: 48, right: 48, bottom: 48, left: 448 }
  const cardHeight = card.value?.offsetHeight ?? 0
  const mapHeight = mapContainer.value?.offsetHeight ?? 0
  return { top: 96, right: 32, bottom: Math.min(cardHeight, mapHeight * 0.6) + 24, left: 32 }
}

function drawOnMap() {
  const m = map.value
  setRouteLine(m, ROUTE_SOURCE, r.value.geometry)
  const list = r.value.waypoints
  markers = list.map((wp, i) =>
    new Marker({ element: waypointMarkerElement(i, list.length) })
      .setLngLat([wp.lng, wp.lat])
      .addTo(m),
  )
  const coords = r.value.geometry?.coordinates
  if (coords?.length > 1)
    m.fitBounds(boundsOf(coords), { padding: mapPadding(), maxZoom: 14, duration: 0 })
}

/* ───────── Acciones ───────── */
let toastTimer
function showToast(text) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2500)
}

async function reload() {
  ride.value = await getRide(route.params.id)
}

async function join() {
  if (!name.value.trim()) {
    showToast('Poné tu nombre para anotarte')
    return
  }
  busy.value = true
  try {
    const row = await joinRide(ride.value.id, {
      name: name.value,
      withPassenger: withPassenger.value,
      userId: auth.user?.id ?? null,
    })
    if (!auth.user) anonJoined.value = { id: row.id, name: row.name }
    await reload()
    showToast('¡Anotado! Nos vemos en la rodada')
  } catch (e) {
    showToast(e.message)
  } finally {
    busy.value = false
  }
}

async function leave() {
  busy.value = true
  try {
    await leaveRide(myAttendance.value.id)
    await reload()
    showToast('Te bajaste de la rodada')
  } catch (e) {
    showToast(e.message)
  } finally {
    busy.value = false
  }
}

async function cancel() {
  if (!window.confirm('¿Cancelar la rodada? Los anotados la van a ver como cancelada.')) return
  try {
    await cancelRide(ride.value.id)
    await reload()
  } catch (e) {
    showToast(e.message)
  }
}

async function share() {
  const url = window.location.href
  const text = `Rodada: ${r.value.name} · ${dayText.value} ${timeText.value} h · Encuentro: ${ride.value.meeting_point}`
  if (navigator.share) {
    try {
      await navigator.share({ title: `Rodada: ${r.value.name}`, text, url })
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    showToast('Copiado para pegar en el grupo')
  } catch {
    showToast('No se pudo copiar el link')
  }
}

/* ───────── Carga ───────── */
onMounted(async () => {
  init(mapContainer.value)
  try {
    await reload()
    if (!r.value) throw new Error('La ruta de esta rodada ya no está disponible')
    document.title = `Rodada: ${r.value.name} · Moteando`
  } catch {
    notFound.value = true
  } finally {
    loading.value = false
  }
  if (ride.value && r.value) {
    if (map.value.loaded()) drawOnMap()
    else map.value.once('load', drawOnMap)
  }
})

onBeforeUnmount(() => {
  markers.forEach((m) => m.remove())
  document.title = 'Moteando'
})
</script>

<template>
  <div class="relative h-dvh overflow-hidden bg-surface-deep">
    <!-- MapLibre le pone position: relative: el alto sale de h-full -->
    <div ref="mapContainer" class="absolute inset-0 h-full w-full" />

    <router-link
      to="/"
      class="absolute top-3 left-3 z-10 flex items-center rounded-full bg-card/90 px-3 py-2 shadow-lg backdrop-blur lg:left-[25rem]"
      aria-label="Ir a Moteando"
    >
      <img :src="Logo" alt="Moteando" class="h-6 w-auto" />
    </router-link>

    <p
      v-if="toast"
      class="absolute top-3 right-3 z-20 max-w-[60%] rounded-full bg-card px-3 py-1.5 text-sm shadow-lg"
      role="status"
    >
      {{ toast }}
    </p>

    <div v-if="loading" class="absolute inset-0 z-20 grid place-items-center">
      <Loader size="lg" />
    </div>

    <div
      v-else-if="notFound"
      class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/90 px-6 text-center"
    >
      <span class="flex size-16 items-center justify-center rounded-full bg-primary/15">
        <IconLucide name="CalendarClock" :size="28" class="text-primary" />
      </span>
      <h1 class="text-2xl font-semibold tracking-tight">Esta rodada no está disponible</h1>
      <p class="max-w-xs text-muted-foreground">
        No existe o su ruta dejó de ser pública. Pedile el link de nuevo a quien la organiza.
      </p>
      <Button as-child size="lg" class="mt-2"
        ><router-link to="/">Ir a Moteando</router-link></Button
      >
    </div>

    <section
      v-else
      ref="card"
      class="absolute inset-x-0 bottom-0 z-10 flex max-h-[68%] flex-col rounded-t-2xl border-t border-border bg-card shadow-2xl lg:inset-y-4 lg:right-auto lg:left-4 lg:max-h-none lg:w-96 lg:rounded-2xl lg:border"
      aria-label="Datos de la rodada"
    >
      <div class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <p class="text-xs font-medium tracking-wide text-primary uppercase">
            {{ ride.cancelled ? 'Rodada cancelada' : isPast ? 'Rodada terminada' : 'Rodada' }}
            <template v-if="inDays && !ride.cancelled && !isPast"> · {{ inDays }}</template>
          </p>
          <h1
            class="mt-1 text-xl font-semibold tracking-tight first-letter:uppercase"
            :class="{ 'line-through opacity-60': ride.cancelled }"
          >
            {{ dayText }} · {{ timeText }} h
          </h1>
          <p class="mt-1 text-sm text-muted-foreground">
            {{ r.name }} · {{ formatKm(r.distance_km) }} · {{ formatDuration(r.duration_min) }}
          </p>
        </div>

        <ul class="space-y-2 text-sm">
          <li class="flex gap-2">
            <IconLucide name="MapPin" :size="16" class="mt-0.5 shrink-0 text-brand-teal" />
            <span
              ><span class="text-muted-foreground">Encuentro:</span> {{ ride.meeting_point }}</span
            >
          </li>
          <li class="flex gap-2">
            <IconLucide name="User" :size="16" class="mt-0.5 shrink-0 text-muted-foreground" />
            <span
              ><span class="text-muted-foreground">Organiza:</span> {{ ride.organizer_name }}</span
            >
          </li>
        </ul>

        <p v-if="ride.notes" class="text-sm whitespace-pre-line">{{ ride.notes }}</p>

        <!-- Anotados -->
        <div>
          <p class="text-sm font-medium">
            {{ attendees.length === 1 ? 'Va 1' : `Van ${attendees.length}` }}
            <span v-if="passengers" class="font-normal text-muted-foreground">
              · {{ passengers === 1 ? '1 con acompañante' : `${passengers} con acompañante` }}
            </span>
          </p>
          <p v-if="attendees.length" class="mt-1 text-sm text-muted-foreground">
            {{
              attendees
                .slice(0, 20)
                .map((a) => a.name)
                .join(', ')
            }}<template v-if="attendees.length > 20"> y {{ attendees.length - 20 }} más</template>
          </p>
        </div>
      </div>

      <div class="shrink-0 space-y-2 border-t border-border p-4">
        <!-- Voy -->
        <template v-if="canJoin">
          <div
            v-if="myAttendance"
            class="flex items-center justify-between gap-2 rounded-lg bg-primary/10 p-3"
          >
            <span class="flex items-center gap-2 text-sm">
              <IconLucide name="UserCheck" :size="18" class="text-primary" />
              Vas como {{ myAttendance.name }}
            </span>
            <Button v-if="auth.user" variant="ghost" size="sm" :disabled="busy" @click="leave">
              No voy
            </Button>
          </div>
          <form v-else class="space-y-2" @submit.prevent="join">
            <Input
              v-if="!auth.user"
              v-model="name"
              maxlength="40"
              placeholder="Tu nombre"
              aria-label="Tu nombre"
              autocomplete="given-name"
            />
            <label class="flex items-center gap-2 text-sm">
              <input v-model="withPassenger" type="checkbox" class="size-4 accent-primary" />
              Voy con acompañante
            </label>
            <Button type="submit" size="lg" class="h-12 w-full text-base" :disabled="busy">
              <IconLucide name="UserCheck" :size="18" />
              Voy
            </Button>
          </form>
        </template>

        <Button variant="outline" size="lg" class="w-full" @click="openInGoogleMaps(r)">
          <IconLucide name="ExternalLink" :size="16" />
          Abrir la ruta en Google Maps
        </Button>
        <div class="grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" @click="downloadGpx(r)">
            <IconLucide name="Download" :size="16" />
            GPX
          </Button>
          <Button variant="outline" size="lg" @click="share">
            <IconLucide name="Share2" :size="16" />
            Compartir
          </Button>
        </div>
        <Button
          v-if="isOrganizer && !ride.cancelled && !isPast"
          variant="ghost"
          size="lg"
          class="w-full text-destructive"
          @click="cancel"
        >
          Cancelar rodada
        </Button>
        <p v-if="!auth.isLoggedIn" class="pt-1 text-center text-xs text-muted-foreground">
          ¿Querés armar tus propias rodadas?
          <router-link
            :to="{ path: '/registro', query: { redirect: `/s/${ride.id}` } }"
            class="text-primary underline-offset-4 hover:underline"
          >
            Creá tu cuenta
          </router-link>
        </p>
      </div>
    </section>
  </div>
</template>

<style>
@import 'maplibre-gl/dist/maplibre-gl.css';
</style>
