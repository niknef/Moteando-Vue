<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseLabel from '@/components/ui/BaseLabel.vue'
import Loader from '@/components/ui/Loader.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'

import RoutePreview from '@/components/route/RoutePreview.vue'
import { createPost } from '@/services/posts'
import { getRouteById } from '@/services/routes'
import { formatDuration, formatKm } from '@/lib/format'
import { uploadImage, validateImage, IMAGE_ACCEPT } from '@/services/storage'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'CreatePost',
  components: {
    BaseHeading1,
    BaseButton,
    BaseInput,
    BaseLabel,
    Loader,
    IconLucide,
    BaseAlert,
    RoutePreview,
  },
  data() {
    return {
      post: {
        route_name: '',
        start_point: this.$route.query.start_point || '',
        end_point: this.$route.query.end_point || '',
        start_geom: this.$route.query.start_geom || '',
        end_geom: this.$route.query.end_geom || '',
        route_type: this.$route.query.route_type || '',
        duration: '', // Se va a armar antes de enviar
        rating: 3,
        description: '',
        image_url: '',
        route_id: null,
      },
      // ruta guardada que se publica (viene de ?route=<id> desde el diseñador)
      linkedRoute: null,
      loadingRoute: false,
      durationHours: 0,
      durationMinutes: 0,

      file: null,
      preview: '',
      imageAccept: IMAGE_ACCEPT,
      success: false,
      error: null,
      loading: false,
    }
  },
  async created() {
    const routeId = this.$route.query.route
    if (routeId) await this.loadRoute(routeId)
  },
  methods: {
    formatKm,
    formatDuration,
    // Completa el post con los datos de la ruta: nombre, salida, llegada y duración estimada
    async loadRoute(id) {
      this.loadingRoute = true
      try {
        const route = await getRouteById(id)
        const start = route.waypoints[0]
        const end = route.waypoints[route.waypoints.length - 1]
        this.linkedRoute = route
        Object.assign(this.post, {
          route_id: route.id,
          route_name: route.name,
          start_point: start.label || `${start.lat}, ${start.lng}`,
          end_point: end.label || `${end.lat}, ${end.lng}`,
          start_geom: `POINT (${start.lng} ${start.lat})`,
          end_geom: `POINT (${end.lng} ${end.lat})`,
          route_type: route.options?.preference ?? 'fastest',
          description: this.post.description || route.description || '',
        })
        // el selector va de a 15 minutos: se redondea el total (55 min → 1 h, no 0 h 0 min)
        const minutes = Math.round((Number(route.duration_min) || 0) / 15) * 15
        this.durationHours = Math.min(Math.floor(minutes / 60), 23)
        this.durationMinutes = minutes % 60
      } catch (e) {
        this.error = e.message
      } finally {
        this.loadingRoute = false
      }
    },
    handleFile(e) {
      const f = e.target.files[0]
      if (!f) return
      try {
        validateImage(f)
      } catch (err) {
        this.error = err.message
        return
      }
      this.error = null
      this.file = f
      this.preview = URL.createObjectURL(f)
    },
    async handleSubmit() {
      const userId = useAuthStore().user?.id
      if (!userId) {
        this.error = 'Usuario no autenticado'
        return
      }

      // Armamos duración en formato HH:MM:SS
      this.post.duration = `${String(this.durationHours).padStart(2, '0')}:${String(this.durationMinutes).padStart(2, '0')}:00`

      this.loading = true
      this.error = null
      this.success = false

      try {
        if (this.file) {
          this.post.image_url = await uploadImage('posts', this.file)
        }

        await createPost({
          ...this.post,
          user_id: userId,
        })

        this.success = true
        this.$router.push({ path: '/descubrir', query: { tab: 'salidas' } })
      } catch (e) {
        this.error = 'No se pudo guardar el post: ' + (e.message ?? 'error desconocido')
        console.error('[CreatePost] Error al guardar:', e)
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<template>
  <section class="max-w-xl mx-auto sm:mt-8 bg-card text-foreground p-6 sm:rounded-lg shadow-md">
    <div class="flex items-center justify-between mb-4">
      <BaseHeading1>Crear publicación</BaseHeading1>
    </div>

    <Loader v-if="loadingRoute" size="md" class="mx-auto my-6" />

    <!-- Ruta que se publica -->
    <div
      v-if="linkedRoute"
      class="mt-4 flex items-center gap-4 rounded-xl border border-border bg-card p-3"
    >
      <RoutePreview :geometry="linkedRoute.geometry" class="size-20 shrink-0 rounded-lg" />
      <div class="min-w-0">
        <p class="truncate font-medium">{{ linkedRoute.name }}</p>
        <p class="text-sm text-muted-foreground">
          {{ formatKm(linkedRoute.distance_km) }} · {{ formatDuration(linkedRoute.duration_min) }}
        </p>
        <p class="text-xs text-muted-foreground">El post va a mostrar esta ruta</p>
      </div>
    </div>

    <form class="flex flex-col gap-4 mt-4" @submit.prevent="handleSubmit">
      <!-- Nombre de la ruta -->
      <div>
        <BaseLabel for="route_name">Nombre de la ruta</BaseLabel>
        <BaseInput
          id="route_name"
          v-model="post.route_name"
          required
          placeholder="Ej: Paseo por Palermo"
        />
      </div>

      <!-- Punto de inicio -->
      <div>
        <BaseLabel for="start_point">Punto de inicio</BaseLabel>
        <BaseInput id="start_point" :model-value="post.start_point" disabled />
      </div>

      <!-- Punto de finalización -->
      <div>
        <BaseLabel for="end_point">Punto de finalización</BaseLabel>
        <BaseInput id="end_point" :model-value="post.end_point" disabled />
      </div>

      <!-- Duración -->
      <div>
        <BaseLabel>Duración estimada</BaseLabel>
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block mb-1 text-sm">Horas</label>
            <select
              v-model="durationHours"
              class="w-full px-4 py-2 bg-muted border border-input rounded-lg"
            >
              <option v-for="n in 24" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block mb-1 text-sm">Minutos</label>
            <select
              v-model="durationMinutes"
              class="w-full px-4 py-2 bg-muted border border-input rounded-lg"
            >
              <option v-for="n in [0, 15, 30, 45]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
        <p class="text-sm text-muted-foreground mt-2">
          Duración seleccionada: {{ durationHours }} h {{ durationMinutes }} min
        </p>
      </div>

      <!-- Puntaje -->
      <div>
        <BaseLabel for="rating">Puntaje</BaseLabel>
        <select
          id="rating"
          v-model="post.rating"
          class="w-full px-4 py-2 bg-muted border border-input rounded-lg"
        >
          <option disabled value="">Seleccioná un puntaje</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <!-- Descripción -->
      <div>
        <BaseLabel for="description">Descripción</BaseLabel>
        <textarea
          id="description"
          v-model="post.description"
          required
          class="w-full px-4 py-2 bg-muted border border-input rounded-lg"
          placeholder="Contanos cómo fue el recorrido, si lo hiciste solo o en grupo..."
        ></textarea>
      </div>

      <!-- Imagen -->
      <div>
        <BaseLabel>Imagen</BaseLabel>
        <input type="file" :accept="imageAccept" class="text-sm mt-1" @change="handleFile" />
        <div v-if="preview" class="mt-4 flex justify-center">
          <img :src="preview" class="w-48 h-48 object-cover rounded-lg border border-border" />
        </div>
      </div>

      <!-- Botones -->
      <div class="flex justify-end gap-4">
        <router-link to="/comunidad">
          <BaseButton type="gray">
            <template #icon><IconLucide name="ArrowLeft" :size="20" /></template>
            Volver
          </BaseButton>
        </router-link>

        <template v-if="loading">
          <BaseButton type="loading">
            <Loader size="sm" />
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton type="orange" html-type="submit">Publicar</BaseButton>
        </template>
      </div>

      <!-- Mensajes -->
      <BaseAlert v-if="success" message="Post creado exitosamente" type="success" />
      <BaseAlert v-if="error" :message="error" type="error" />
    </form>
  </section>
</template>
