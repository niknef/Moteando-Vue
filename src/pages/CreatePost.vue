<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseLabel from '@/components/ui/BaseLabel.vue'
import Loader from '@/components/ui/Loader.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

import { createPost, uploadPostPhoto } from '@/services/posts'
import { subscribeToAuth } from '@/services/auth'

export default {
  name: 'CreatePost',
  components: {
    BaseHeading1,
    BaseButton,
    BaseInput,
    BaseLabel,
    Loader,
    ArrowLeftIcon,
    BaseAlert
  },
  data() {
    return {
      userId: null,
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
        image_url: ''
      },
      durationHours: 0,
      durationMinutes: 0,

      file: null,
      preview: '',
      success: false,
      error: null,
      loading: false
    }
  },
  mounted() {
    subscribeToAuth(user => {
      this.userId = user.id
    })
  },
  methods: {
    handleFile(e) {
      const f = e.target.files[0]
      if (!f) return
      if (!f.type.startsWith('image/')) {
        this.error = 'El archivo debe ser una imagen.'
        return
      }
      const maxSizeMB = 1
      if (f.size > maxSizeMB * 1024 * 1024) {
        this.error = `La imagen debe pesar menos de ${maxSizeMB} MB.`
        return
      }
      this.file = f
      this.preview = URL.createObjectURL(f)
    },
    async handleSubmit() {
      if (!this.userId) {
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
          this.post.image_url = await uploadPostPhoto(this.file)
        }

        await createPost({
          ...this.post,
          user_id: this.userId
        })

        this.success = true
        this.$router.push('/posts')
      } catch (e) {
        this.error = 'No se pudo guardar el post.'
        console.error('[CreatePost] Error al guardar:', e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <section class="max-w-xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md">
    <div class="flex items-center justify-between mb-4">
      <BaseHeading1>Crear publicación</BaseHeading1>
    </div>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <!-- Nombre de la ruta -->
      <div>
        <BaseLabel for="route_name">Nombre de la ruta</BaseLabel>
        <BaseInput id="route_name" v-model="post.route_name" required placeholder="Ej: Paseo por Palermo" />
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
            <select v-model="durationHours" class="w-full px-4 py-2 bg-neutral-600 rounded">
              <option v-for="n in 24" :key="n" :value="n - 1">{{ n - 1 }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block mb-1 text-sm">Minutos</label>
            <select v-model="durationMinutes" class="w-full px-4 py-2 bg-neutral-600 rounded">
              <option v-for="n in [0, 15, 30, 45]" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
        <p class="text-sm text-gray-400 mt-2">
          Duración seleccionada: {{ durationHours }} h {{ durationMinutes }} min
        </p>
      </div>

      <!-- Puntaje -->
      <div>
        <BaseLabel for="rating">Puntaje</BaseLabel>
        <select id="rating" v-model="post.rating" class="w-full px-4 py-2 bg-neutral-600 rounded">
          <option disabled value="">Seleccioná un puntaje</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <!-- Descripción -->
      <div>
        <BaseLabel for="description">Descripción</BaseLabel>
        <textarea id="description" v-model="post.description" required class="w-full px-4 py-2 bg-neutral-600 rounded"
          placeholder="Contanos cómo fue el recorrido, si lo hiciste solo o en grupo..."></textarea>
      </div>

      <!-- Imagen -->
      <div>
        <BaseLabel>Imagen</BaseLabel>
        <input type="file" accept="image/*" @change="handleFile" class="text-sm mt-1" />
        <div v-if="preview" class="mt-4 flex justify-center">
          <img :src="preview" class="w-48 h-48 object-cover rounded border border-gray-500" />
        </div>
      </div>

      <!-- Botones -->
      <div class="flex justify-end gap-4">
        <router-link to="/posts">
          <BaseButton type="gray">
            <template #icon><ArrowLeftIcon class="w-5 h-5" /></template>
            Volver
          </BaseButton>
        </router-link>

        <template v-if="loading">
          <BaseButton type="loading">
            <Loader size="sm" />
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton type="orange" htmlType="submit">Publicar</BaseButton>
        </template>
      </div>

      <!-- Mensajes -->
      <BaseAlert v-if="success" message="Post creado exitosamente" type="success" />
      <BaseAlert v-if="error" :message="error" type="error" />
    </form>
  </section>
</template>
