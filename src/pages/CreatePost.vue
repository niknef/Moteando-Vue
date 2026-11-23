<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import RoutePreview from '@/components/route/RoutePreview.vue'
import { createPost } from '@/services/posts'
import { getRouteById, listMyRoutes, updateRoute } from '@/services/routes'
import { IMAGE_ACCEPT, deleteImageByUrl, uploadImage, validateImage } from '@/services/storage'
import { useAuthStore } from '@/stores/auth'
import { formatDuration, formatKm } from '@/lib/format'

// "Contá tu salida": el post es la crónica de una salida sobre una ruta guardada.
// Con ?route=<id> la ruta ya está elegida; si no, se elige entre las propias.

defineOptions({ name: 'CreatePost' })

const MAX_PHOTOS = 6

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const ride = ref(null) // ruta elegida
const myRoutes = ref([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')

const today = new Date().toISOString().slice(0, 10)
const rideDate = ref(today)
const rating = ref(0)
const description = ref('')
const photos = ref([]) // [{ file, preview }]

const canPublish = computed(() => ride.value && rating.value > 0 && !saving.value)

/* ───────── Ruta ───────── */
function chooseRoute(r) {
  error.value = ''
  ride.value = r
  if (!description.value && r.description) description.value = r.description
  router.replace({ query: { route: r.id } })
}

async function changeRoute() {
  ride.value = null
  if (!myRoutes.value.length) {
    loading.value = true
    try {
      myRoutes.value = await listMyRoutes()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }
}

onMounted(async () => {
  try {
    if (route.query.route) {
      const r = await getRouteById(route.query.route)
      if (r.user_id !== auth.user?.id) throw new Error('Solo podés publicar salidas de tus rutas')
      chooseRoute(r)
    } else {
      myRoutes.value = await listMyRoutes()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

/* ───────── Fotos ───────── */
function addPhotos(event) {
  error.value = ''
  for (const file of event.target.files) {
    if (photos.value.length >= MAX_PHOTOS) {
      error.value = `Podés subir hasta ${MAX_PHOTOS} fotos`
      break
    }
    try {
      validateImage(file)
      photos.value.push({ file, preview: URL.createObjectURL(file) })
    } catch (e) {
      error.value = `${file.name}: ${e.message}`
    }
  }
  event.target.value = ''
}

function removePhoto(index) {
  URL.revokeObjectURL(photos.value[index].preview)
  photos.value.splice(index, 1)
}

onBeforeUnmount(() => photos.value.forEach((p) => URL.revokeObjectURL(p.preview)))

/* ───────── Publicar ───────── */
function toInterval(min) {
  const total = Math.round(Number(min) || 0)
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:00`
}

async function publish() {
  if (!canPublish.value) return
  error.value = ''

  const r = ride.value
  // La salida se ve en la comunidad junto con su ruta: tiene que ser pública
  if (!r.is_public) {
    const question = 'Para publicar la salida, la ruta tiene que ser pública. ¿Hacerla pública?'
    if (!window.confirm(question)) return
  }

  saving.value = true
  const uploaded = []
  try {
    if (!r.is_public) {
      await updateRoute(r.id, { is_public: true })
      r.is_public = true
    }
    // subir → guardar → (si falla) borrar lo subido
    for (const p of photos.value) uploaded.push(await uploadImage('posts', p.file))

    const start = r.waypoints[0]
    const end = r.waypoints[r.waypoints.length - 1]
    await createPost({
      user_id: auth.user.id,
      route_id: r.id,
      route_name: r.name,
      start_point: start.label || `${start.lat}, ${start.lng}`,
      end_point: end.label || `${end.lat}, ${end.lng}`,
      start_geom: `POINT (${start.lng} ${start.lat})`,
      end_geom: `POINT (${end.lng} ${end.lat})`,
      route_type: r.options?.preference ?? 'fastest',
      duration: toInterval(r.duration_min),
      rating: rating.value,
      description: description.value.trim() || null,
      ride_date: rideDate.value || null,
      photos: uploaded,
      image_url: uploaded[0] ?? null,
    })
    router.push({ path: '/descubrir', query: { tab: 'salidas' } })
  } catch (e) {
    await Promise.all(uploaded.map((url) => deleteImageByUrl('posts', url)))
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 py-6 lg:py-10">
    <header class="mb-5">
      <h1 class="text-2xl font-semibold tracking-tight">Contá tu salida</h1>
      <p class="text-sm text-muted-foreground">
        Se publica en Descubrir junto con la ruta, para que otros la puedan hacer.
      </p>
    </header>

    <div v-if="loading" class="grid place-items-center py-16"><Loader size="lg" /></div>

    <!-- Elegir la ruta -->
    <section v-else-if="!ride" class="space-y-3">
      <h2 class="font-medium">¿Qué ruta hiciste?</h2>
      <BaseAlert :message="error" type="error" />
      <template v-if="!myRoutes.length && !error">
        <p class="text-sm text-muted-foreground">
          Todavía no tenés rutas guardadas. Armá la que hiciste y después contá la salida.
        </p>
        <Button as-child size="lg">
          <router-link to="/rutas/nueva">
            <IconLucide name="CirclePlus" :size="16" />
            Armar una ruta
          </router-link>
        </Button>
      </template>
      <ul class="space-y-2">
        <li v-for="r in myRoutes" :key="r.id">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left transition-colors hover:bg-accent/40"
            @click="chooseRoute(r)"
          >
            <RoutePreview :geometry="r.geometry" class="size-14 shrink-0 rounded-lg" />
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ r.name }}</span>
              <span class="block text-sm text-muted-foreground">
                {{ formatKm(r.distance_km) }} · {{ formatDuration(r.duration_min) }}
              </span>
            </span>
          </button>
        </li>
      </ul>
    </section>

    <!-- Formulario -->
    <form v-else class="space-y-6" @submit.prevent="publish">
      <!-- La ruta, como héroe -->
      <div class="overflow-hidden rounded-xl border border-border bg-card">
        <RoutePreview :geometry="ride.geometry" class="aspect-[2/1] w-full" />
        <div class="flex items-center justify-between gap-3 p-3">
          <div class="min-w-0">
            <p class="truncate font-medium">{{ ride.name }}</p>
            <p class="text-sm text-muted-foreground">
              {{ formatKm(ride.distance_km) }} · {{ formatDuration(ride.duration_min) }}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" @click="changeRoute">Cambiar</Button>
        </div>
      </div>

      <div class="grid gap-2">
        <Label for="ride-date">¿Cuándo la hiciste?</Label>
        <input
          id="ride-date"
          v-model="rideDate"
          type="date"
          :max="today"
          class="h-11 rounded-lg border border-input bg-muted px-3.5 text-foreground [color-scheme:dark] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <fieldset class="grid gap-2">
        <legend class="mb-2 text-sm font-medium">¿Qué tal estuvo?</legend>
        <div class="flex gap-1" role="radiogroup" aria-label="Puntaje">
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            role="radio"
            :aria-checked="rating === n"
            :aria-label="`${n} de 5`"
            class="grid size-11 place-items-center rounded-lg transition-colors hover:bg-muted"
            @click="rating = n"
          >
            <IconLucide
              name="Star"
              :size="28"
              :class="n <= rating ? 'fill-current text-rating' : 'text-muted-foreground'"
            />
          </button>
        </div>
      </fieldset>

      <div class="grid gap-2">
        <Label for="ride-text">Contala (opcional)</Label>
        <Textarea
          id="ride-text"
          v-model="description"
          rows="4"
          maxlength="1000"
          placeholder="Cómo estuvo el camino, dónde paraste, qué recomendás…"
        />
      </div>

      <div class="grid gap-2">
        <div class="flex items-baseline justify-between">
          <Label>Fotos</Label>
          <span class="text-xs text-muted-foreground">{{ photos.length }}/{{ MAX_PHOTOS }}</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="(p, i) in photos"
            :key="p.preview"
            class="relative aspect-square overflow-hidden rounded-lg"
          >
            <img :src="p.preview" alt="" class="size-full object-cover" />
            <button
              type="button"
              class="absolute top-1 right-1 grid size-8 place-items-center rounded-full bg-background/80"
              :aria-label="`Quitar foto ${i + 1}`"
              @click="removePhoto(i)"
            >
              <IconLucide name="X" :size="16" />
            </button>
          </div>
          <label
            v-if="photos.length < MAX_PHOTOS"
            class="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-accent/40"
          >
            <span class="flex flex-col items-center gap-1 text-xs">
              <IconLucide name="Image" :size="22" />
              Agregar
            </span>
            <input
              type="file"
              :accept="IMAGE_ACCEPT"
              multiple
              class="sr-only"
              aria-label="Agregar fotos"
              @change="addPhotos"
            />
          </label>
        </div>
      </div>

      <BaseAlert :message="error" type="error" />

      <Button type="submit" size="lg" class="h-12 w-full text-base" :disabled="!canPublish">
        {{ saving ? 'Publicando…' : rating ? 'Publicar salida' : 'Elegí un puntaje para publicar' }}
      </Button>
    </form>
  </div>
</template>
