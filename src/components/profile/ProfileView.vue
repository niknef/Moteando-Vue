<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import RouteCard from '@/components/route/RouteCard.vue'
import RoutePreview from '@/components/route/RoutePreview.vue'
import GarageTab from '@/components/profile/GarageTab.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getUserProfileByPK } from '@/services/user-profile'
import { getBikeById, listBikes } from '@/services/bikes'
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
// Cada número lleva a su pestaña
const stats = computed(() => [
  {
    label: routes.value.length === 1 ? 'ruta pública' : 'rutas públicas',
    value: routes.value.length,
    tab: 'rutas',
  },
  {
    label: posts.value.length === 1 ? 'salida' : 'salidas',
    value: posts.value.length,
    tab: 'salidas',
  },
  {
    label: 'km en rutas públicas',
    value: Math.round(routes.value.reduce((sum, r) => sum + Number(r.distance_km || 0), 0)),
    tab: 'rutas',
  },
])
const iosHelp = ref(false)

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

// El garaje cambió (moto activa, borrada): se recargan motos y perfil
async function onGarageChanged() {
  try {
    await auth.loadProfile()
    bikes.value = await listBikes()
    const p = auth.profile
    profile.value = { ...profile.value, active_bike_id: p?.active_bike_id ?? null }
    activeBike.value = bikes.value.find((b) => b.id === p?.active_bike_id) ?? null
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
  <div class="mx-auto w-full max-w-2xl px-4 py-6 lg:max-w-5xl lg:py-10">
    <div v-if="loading" class="grid place-items-center py-20"><Loader size="lg" /></div>
    <BaseAlert v-else-if="error && !profile" :message="error" type="error" />

    <div v-else class="lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-10">
      <!-- Columna del perfil (a la izquierda en escritorio) -->
      <aside class="lg:sticky lg:top-6">
        <header class="flex items-start gap-4 lg:flex-col lg:items-start">
          <UserAvatar
            :profile="profile"
            size="size-20 text-2xl lg:size-28 lg:text-3xl"
            class="border border-border"
          />
          <div class="min-w-0 flex-1">
            <h1 class="text-2xl font-semibold tracking-tight break-words">
              {{ fullName || 'Motero sin nombre' }}
            </h1>
            <p
              v-if="activeBike"
              class="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <IconLucide name="Motorbike" :size="16" class="shrink-0 text-primary" />
              <span class="truncate">
                {{ activeBike.brand }} {{ activeBike.model }}
                <template v-if="activeBike.year">· {{ activeBike.year }}</template>
              </span>
            </p>

            <!-- Propio: editar y el resto en el menú (salir no queda a mano) -->
            <div v-if="isOwn" class="mt-3 flex items-center gap-2">
              <Button as-child variant="outline" size="sm" class="h-9">
                <router-link to="/perfil/editar">
                  <IconLucide name="PencilLine" :size="14" />
                  Editar perfil
                </router-link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-9"
                    aria-label="Más opciones de la cuenta"
                  >
                    <IconLucide name="Settings" :size="18" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="w-56">
                  <DropdownMenuItem v-if="canInstall" @select="install">
                    <IconLucide name="Smartphone" :size="16" />
                    Instalar la app
                  </DropdownMenuItem>
                  <DropdownMenuItem v-else-if="showIosHint" @select="iosHelp = true">
                    <IconLucide name="Smartphone" :size="16" />
                    Instalar la app
                  </DropdownMenuItem>
                  <DropdownMenuItem as-child>
                    <router-link to="/rutas">
                      <IconLucide name="Map" :size="16" />
                      Mis rutas (también privadas)
                    </router-link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" @select="logout">
                    <IconLucide name="LogOut" :size="16" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <p v-if="profile.bio" class="mt-4 text-[15px] whitespace-pre-wrap text-foreground/85">
          {{ profile.bio }}
        </p>
        <p v-else-if="isOwn" class="mt-4 text-sm text-muted-foreground">
          Contale a la comunidad qué moto tenés y qué rutas te gustan:
          <router-link to="/perfil/editar" class="text-primary hover:underline">
            agregá una bio
          </router-link>
        </p>

        <!-- Resumen: cada número lleva a su pestaña -->
        <div
          class="mt-5 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card"
        >
          <button
            v-for="s in stats"
            :key="s.label"
            type="button"
            class="flex flex-col px-1 py-3 text-center transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
            @click="setTab(s.tab)"
          >
            <span class="text-xl font-semibold">{{ s.value.toLocaleString('es-AR') }}</span>
            <span class="text-xs leading-tight text-muted-foreground">{{ s.label }}</span>
          </button>
        </div>
      </aside>

      <!-- Pestañas -->
      <div class="mt-6 lg:mt-0">
        <div class="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="tablist">
          <button
            v-for="t in TABS"
            :key="t.key"
            type="button"
            role="tab"
            :aria-selected="tab === t.key"
            class="h-10 rounded-md text-sm font-medium transition-colors"
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
          <Button v-if="isOwn" as-child variant="outline" class="h-12 w-full">
            <router-link to="/rutas">
              <IconLucide name="Map" :size="16" />
              Todas mis rutas, también las privadas
            </router-link>
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
                  v-if="p.photos?.find(Boolean) || p.image_url"
                  :src="p.photos?.find(Boolean) || p.image_url"
                  alt=""
                  class="size-16 shrink-0 rounded-lg object-cover"
                />
                <RoutePreview
                  v-else-if="p.routes"
                  :geometry="p.routes.geometry"
                  class="size-16 shrink-0 rounded-lg"
                />
                <span v-else class="grid size-16 shrink-0 place-items-center rounded-lg bg-muted">
                  <IconLucide name="Camera" :size="22" class="text-muted-foreground/60" />
                </span>
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
          <Button v-if="isOwn" as-child variant="outline" class="mt-3 h-12 w-full">
            <router-link to="/comunidad/publicar">
              <IconLucide name="Plus" :size="16" />
              Contá tu salida
            </router-link>
          </Button>
        </section>

        <!-- Garaje -->
        <template v-else>
          <GarageTab
            v-if="isOwn"
            :bikes="bikes"
            :active-id="profile.active_bike_id"
            @changed="onGarageChanged"
            @error="(m) => (error = m)"
          />
          <section v-else aria-label="Garaje">
            <article
              v-if="activeBike"
              class="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div class="aspect-[16/10] bg-muted">
                <img
                  v-if="activeBike.photo_url"
                  :src="activeBike.photo_url"
                  :alt="`${activeBike.brand} ${activeBike.model}`"
                  class="size-full object-cover"
                />
                <span v-else class="grid size-full place-items-center">
                  <IconLucide name="Motorbike" :size="56" class="text-muted-foreground/50" />
                </span>
              </div>
              <div class="p-4">
                <p class="text-lg font-semibold">{{ activeBike.brand }} {{ activeBike.model }}</p>
                <p class="text-sm text-muted-foreground">
                  {{ [activeBike.year, activeBike.color].filter(Boolean).join(' · ') }}
                </p>
              </div>
            </article>
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              Todavía no cargó su moto.
            </p>
          </section>
        </template>
      </div>
    </div>

    <!-- Instalar en iPhone: no hay botón posible, se explica -->
    <Dialog v-model:open="iosHelp">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Instalar Moteando</DialogTitle>
          <DialogDescription>
            En Safari, tocá Compartir y después "Agregar a inicio". Queda como una app, con su
            ícono, y abre lo último que cargaste aunque no tengas señal.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  </div>
</template>
