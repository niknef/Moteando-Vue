<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import RouteCard from '@/components/route/RouteCard.vue'
import RoutePreview from '@/components/route/RoutePreview.vue'
import { getUserProfileByPK } from '@/services/user-profile'
import { getBikeById, listBikes, setActiveBike } from '@/services/bikes'
import { listPublicRoutes } from '@/services/routes'
import { listUserPosts } from '@/services/posts'
import { useAuthStore } from '@/stores/auth'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { formatKm, formatShortDate } from '@/lib/format'

// Perfil como vitrina: identidad (foto, nombre, moto activa), resumen y pestañas
// Rutas · Salidas · Garaje. La misma plantilla para el propio y el ajeno.

const props = defineProps({
  userId: { type: String, required: true },
  isOwn: { type: Boolean, default: false },
})

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { canInstall, showIosHint, install } = usePwaInstall()

const profile = ref(null)
const activeBike = ref(null)
const bikes = ref([]) // solo el propio: el garaje de otros es privado salvo la moto activa
const routes = ref([])
const posts = ref([])
const loading = ref(true)
const error = ref('')

const TABS = [
  { key: 'rutas', label: 'Rutas' },
  { key: 'salidas', label: 'Salidas' },
  { key: 'garaje', label: 'Garaje' },
]
const tab = computed(() =>
  TABS.some((t) => t.key === route.query.tab) ? route.query.tab : 'rutas',
)
const setTab = (key) => router.replace({ query: { tab: key === 'rutas' ? undefined : key } })

const fullName = computed(() =>
  [profile.value?.first_name, profile.value?.last_name].filter(Boolean).join(' '),
)
const stats = computed(() => [
  {
    label: routes.value.length === 1 ? 'ruta pública' : 'rutas públicas',
    value: routes.value.length,
  },
  { label: posts.value.length === 1 ? 'salida' : 'salidas', value: posts.value.length },
  {
    label: 'km compartidos',
    value: Math.round(routes.value.reduce((sum, r) => sum + Number(r.distance_km || 0), 0)),
  },
])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [p, r, ps] = await Promise.all([
      getUserProfileByPK(props.userId),
      listPublicRoutes({ userId: props.userId, limit: 100 }),
      listUserPosts(props.userId),
    ])
    if (!p) throw new Error('No encontramos ese perfil')
    profile.value = p
    routes.value = r
    posts.value = ps
    if (props.isOwn) bikes.value = await listBikes()
    activeBike.value = p.active_bike_id
      ? (bikes.value.find((b) => b.id === p.active_bike_id) ??
        (await getBikeById(p.active_bike_id)))
      : null
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function activate(bike) {
  try {
    await setActiveBike(bike.id)
    await auth.loadProfile()
    activeBike.value = bike
    profile.value = { ...profile.value, active_bike_id: bike.id }
  } catch (e) {
    error.value = e.message
  }
}

async function logout() {
  await auth.logout()
  router.replace('/ingresar')
}

watch(() => props.userId, load, { immediate: true })
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-6 lg:py-10">
    <div v-if="loading" class="grid place-items-center py-20"><Loader size="lg" /></div>
    <BaseAlert v-else-if="error && !profile" :message="error" type="error" />

    <template v-else>
      <!-- Identidad -->
      <header class="flex items-start gap-4">
        <img
          v-if="profile.avatar_url"
          :src="profile.avatar_url"
          :alt="`Foto de ${fullName}`"
          class="size-20 shrink-0 rounded-full border border-border object-cover"
        />
        <span
          v-else
          class="grid size-20 shrink-0 place-items-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground"
          aria-hidden="true"
        >
          {{ (profile.first_name || '?').charAt(0) }}
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-2xl font-semibold tracking-tight">
            {{ fullName || 'Motero sin nombre' }}
          </h1>
          <p v-if="activeBike" class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <IconLucide name="Motorbike" :size="16" class="text-primary" />
            {{ activeBike.brand }} {{ activeBike.model }}
            <template v-if="activeBike.year">· {{ activeBike.year }}</template>
          </p>
          <div v-if="isOwn" class="mt-3 flex flex-wrap gap-2">
            <Button as-child variant="outline" size="sm">
              <router-link to="/perfil/editar">
                <IconLucide name="PencilLine" :size="14" />
                Editar perfil
              </router-link>
            </Button>
            <Button variant="ghost" size="sm" class="text-muted-foreground" @click="logout">
              <IconLucide name="LogOut" :size="14" />
              Salir
            </Button>
          </div>
          <Button v-if="isOwn && canInstall" size="sm" class="mt-2" @click="install">
            <IconLucide name="Smartphone" :size="14" />
            Instalar la app
          </Button>
          <p v-else-if="isOwn && showIosHint" class="mt-2 text-xs text-muted-foreground">
            Para tenerla como app: Compartir → Agregar a inicio.
          </p>
        </div>
      </header>

      <p v-if="profile.bio" class="mt-4 text-sm whitespace-pre-wrap text-foreground/80">
        {{ profile.bio }}
      </p>
      <p v-else-if="isOwn" class="mt-4 text-sm text-muted-foreground">
        Contale a la comunidad qué moto tenés y qué rutas te gustan:
        <router-link to="/perfil/editar" class="text-primary hover:underline">
          agregá una bio
        </router-link>
      </p>

      <!-- Resumen -->
      <dl
        class="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card"
      >
        <div v-for="s in stats" :key="s.label" class="px-2 py-3 text-center">
          <dd class="text-xl font-semibold">{{ s.value.toLocaleString('es-AR') }}</dd>
          <dt class="text-xs text-muted-foreground">{{ s.label }}</dt>
        </div>
      </dl>

      <!-- Pestañas -->
      <div class="mt-6 mb-4 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="tablist">
        <button
          v-for="t in TABS"
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

      <BaseAlert v-if="error" :message="error" type="error" class="mb-4" />

      <!-- Rutas -->
      <section v-if="tab === 'rutas'" class="space-y-3">
        <p v-if="!routes.length" class="py-8 text-center text-sm text-muted-foreground">
          {{ isOwn ? 'Todavía no hiciste pública ninguna ruta.' : 'Todavía no compartió rutas.' }}
        </p>
        <ul v-else class="space-y-2">
          <li v-for="r in routes" :key="r.id">
            <RouteCard :route="r" :show-author="false" />
          </li>
        </ul>
        <Button v-if="isOwn" as-child variant="ghost" class="w-full">
          <router-link to="/rutas">Ver todas mis rutas (también las privadas)</router-link>
        </Button>
      </section>

      <!-- Salidas -->
      <section v-else-if="tab === 'salidas'">
        <p v-if="!posts.length" class="py-8 text-center text-sm text-muted-foreground">
          {{ isOwn ? 'Todavía no contaste ninguna salida.' : 'Todavía no publicó salidas.' }}
        </p>
        <ul v-else class="space-y-2">
          <li v-for="p in posts" :key="p.id">
            <router-link
              :to="`/comunidad/${p.id}`"
              class="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:bg-accent/40"
            >
              <img
                v-if="p.photos?.[0] || p.image_url"
                :src="p.photos?.[0] || p.image_url"
                alt=""
                class="size-16 shrink-0 rounded-lg object-cover"
              />
              <RoutePreview
                v-else-if="p.routes"
                :geometry="p.routes.geometry"
                class="size-16 shrink-0 rounded-lg"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ p.routes?.name || p.route_name }}</p>
                <p class="flex items-center gap-2 text-xs text-muted-foreground">
                  <span v-if="p.rating" class="flex items-center gap-1">
                    <IconLucide name="Star" :size="12" class="fill-current text-rating" />
                    {{ Number(p.rating).toLocaleString('es-AR') }}
                  </span>
                  <span v-if="p.routes">{{ formatKm(p.routes.distance_km) }}</span>
                  <span>{{
                    formatShortDate(p.ride_date ? p.ride_date + 'T12:00' : p.created_at)
                  }}</span>
                </p>
              </div>
            </router-link>
          </li>
        </ul>
        <Button v-if="isOwn" as-child variant="ghost" class="mt-3 w-full">
          <router-link to="/comunidad/publicar">
            <IconLucide name="Plus" :size="16" />
            Contá tu salida
          </router-link>
        </Button>
      </section>

      <!-- Garaje -->
      <section v-else>
        <template v-if="isOwn">
          <p v-if="!bikes.length" class="py-8 text-center text-sm text-muted-foreground">
            Todavía no cargaste ninguna moto.
          </p>
          <ul v-else class="space-y-2">
            <li
              v-for="b in bikes"
              :key="b.id"
              class="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
            >
              <img
                v-if="b.photo_url"
                :src="b.photo_url"
                alt=""
                class="size-16 shrink-0 rounded-lg object-cover"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ b.brand }} {{ b.model }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ [b.year, b.color].filter(Boolean).join(' · ') }}
                </p>
              </div>
              <span
                v-if="b.id === profile.active_bike_id"
                class="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
              >
                Activa
              </span>
              <Button v-else variant="outline" size="sm" @click="activate(b)">Usar esta</Button>
            </li>
          </ul>
          <Button as-child variant="ghost" class="mt-3 w-full">
            <router-link to="/garaje">
              <IconLucide name="Warehouse" :size="16" />
              Administrar garaje ({{ bikes.length }}/5)
            </router-link>
          </Button>
        </template>
        <template v-else>
          <div
            v-if="activeBike"
            class="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
          >
            <img
              v-if="activeBike.photo_url"
              :src="activeBike.photo_url"
              alt=""
              class="size-20 shrink-0 rounded-lg object-cover"
            />
            <div>
              <p class="font-medium">{{ activeBike.brand }} {{ activeBike.model }}</p>
              <p class="text-xs text-muted-foreground">
                {{ [activeBike.year, activeBike.color].filter(Boolean).join(' · ') }}
              </p>
              <span class="mt-1 inline-block text-xs text-primary">Moto activa</span>
            </div>
          </div>
          <p v-else class="py-8 text-center text-sm text-muted-foreground">
            No tiene una moto activa.
          </p>
        </template>
      </section>
    </template>
  </div>
</template>
