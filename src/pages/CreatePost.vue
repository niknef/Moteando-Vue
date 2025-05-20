<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseLabel from '@/components/ui/BaseLabel.vue'
import Loader from '@/components/ui/Loader.vue'
import { createPost } from '@/services/posts'
import { subscribeToAuth } from '@/services/auth'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import BaseAlert from '../components/ui/BaseAlert.vue'

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
        start_point: '',
        end_point: '',
        duration: '',
        rating: 3,
        description: ''
      },
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
    async handleSubmit() {
      if (!this.userId) {
        this.error = 'Usuario no autenticado'
        return
      }

      this.loading = true
      this.error = null
      this.success = false

      try {
        await createPost({
          ...this.post,
          user_id: this.userId
        })
        this.success = true
        this.post = {
          start_point: '',
          end_point: '',
          duration: '',
          rating: 3,
          description: ''
        }
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
      <router-link to="/post">
        <BaseButton type="gray">
          <template #icon>
            <ArrowLeftIcon class="w-5 h-5" />
          </template>
          Volver
        </BaseButton>
      </router-link>

      <BaseHeading1>Crear publicación</BaseHeading1>
    </div>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <div>
        <BaseLabel for="start_point">Punto de inicio</BaseLabel>
        <BaseInput id="start_point" v-model="post.start_point" required placeholder="Ej: Av. Córdoba y Callao" />
      </div>

      <div>
        <BaseLabel for="end_point">Punto de finalización</BaseLabel>
        <BaseInput id="end_point" v-model="post.end_point" required placeholder="Ej: La Cumbre, Córdoba" />
      </div>

      <div>
        <BaseLabel for="duration">Duración estimada</BaseLabel>
        <BaseInput id="duration" v-model="post.duration" required placeholder="Ej: 3 horas y media" />
      </div>

      <div>
        <BaseLabel for="rating">Puntaje</BaseLabel>
        <select id="rating" v-model="post.rating" class="w-full px-4 py-2 bg-neutral-600 rounded">
          <option disabled value="">Seleccioná un puntaje</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <div>
        <BaseLabel for="description">Descripción</BaseLabel>
        <textarea id="description" v-model="post.description" required class="w-full px-4 py-2 bg-neutral-600 rounded"
          placeholder="Contanos cómo fue el recorrido, si lo hiciste solo o en grupo..."></textarea>
      </div>

      <div class="flex justify-end gap-4 items-center">
        <template v-if="loading">
          <BaseButton type="loading">
            <Loader size="sm" />
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton type="orange" htmlType="submit">Publicar</BaseButton>
        </template>
      </div>

      <BaseAlert :message="success && '¡Perfil actualizado!'" type="success" />
      <BaseAlert :message="error" type="error" />
    </form>
  </section>
</template>
