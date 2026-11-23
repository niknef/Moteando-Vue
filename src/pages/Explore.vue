<script setup>
import { onMounted, ref, watch } from 'vue'
import debounce from 'lodash.debounce'
import { Input } from '@/components/ui/input'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import RouteCard from '@/components/route/RouteCard.vue'
import { listPublicRoutes } from '@/services/routes'

// Explorar: rutas públicas de todos los moteros, con búsqueda por nombre.

defineOptions({ name: 'ExploreRoutes' })

const routes = ref([])
const search = ref('')
const loading = ref(true)
const error = ref('')
let requestId = 0

async function load() {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const data = await listPublicRoutes({ search: search.value })
    if (id === requestId) routes.value = data
  } catch (e) {
    if (id === requestId) error.value = e.message
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(search, debounce(load, 350))
onMounted(load)
</script>

<template>
  <div class="mx-auto w-full max-w-2xl px-4 py-6 lg:py-10">
    <header class="mb-5">
      <h1 class="text-2xl font-semibold tracking-tight">Explorar</h1>
      <p class="text-sm text-muted-foreground">Rutas que compartieron otros moteros</p>
    </header>

    <div class="relative mb-5">
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

    <BaseAlert :message="error" type="error" class="mb-4" />

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
        {{ search ? 'No hay rutas con ese nombre' : 'Todavía no hay rutas públicas' }}
      </p>
      <p class="max-w-xs text-sm text-muted-foreground">
        Las rutas aparecen acá cuando sus dueños las hacen públicas.
      </p>
    </div>

    <ul v-else class="space-y-3" :class="{ 'opacity-60': loading }">
      <li v-for="route in routes" :key="route.id">
        <RouteCard :route="route" />
      </li>
    </ul>
  </div>
</template>
