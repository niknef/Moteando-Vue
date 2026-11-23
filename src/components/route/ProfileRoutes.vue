<script setup>
import { ref, watch } from 'vue'
import RouteCard from '@/components/route/RouteCard.vue'
import { listPublicRoutes } from '@/services/routes'

// Rutas públicas de un usuario, para su perfil.

const props = defineProps({
  userId: { type: String, default: null },
  title: { type: String, default: 'Rutas' },
  emptyText: { type: String, default: 'Todavía no compartió rutas.' },
  // link opcional a la lista completa (en el perfil propio, Mis rutas)
  moreTo: { type: String, default: '' },
  limit: { type: Number, default: 5 },
})

const routes = ref([])
const loading = ref(true)
const error = ref('')

async function load() {
  if (!props.userId) return
  loading.value = true
  error.value = ''
  try {
    routes.value = await listPublicRoutes({ userId: props.userId, limit: props.limit })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => props.userId, load, { immediate: true })
</script>

<template>
  <section class="space-y-3">
    <div class="flex items-baseline justify-between">
      <h2 class="font-semibold text-muted-foreground">{{ title }}</h2>
      <router-link v-if="moreTo" :to="moreTo" class="text-sm text-primary hover:underline">
        Ver todas
      </router-link>
    </div>
    <p v-if="loading" class="text-sm text-muted-foreground">Cargando rutas…</p>
    <p v-else-if="error" class="text-sm text-destructive">{{ error }}</p>
    <p v-else-if="!routes.length" class="text-sm text-muted-foreground">{{ emptyText }}</p>
    <ul v-else class="space-y-2">
      <li v-for="route in routes" :key="route.id">
        <RouteCard :route="route" :show-author="false" />
      </li>
    </ul>
  </section>
</template>
