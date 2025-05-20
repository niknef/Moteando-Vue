<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Loader from '@/components/ui/Loader.vue'
import { createPost } from '@/services/posts'
import { subscribeToAuth } from '@/services/auth'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'CreatePost',
  components: {
    BaseHeading1,
    BaseButton,
    Loader,
    ArrowLeftIcon
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
      console.log('Enviando post...')
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
  

  <section class="max-w-xl mx-auto mt-8 bg-neutral-800 text-white p-6 rounded-lg shadow-md">
    
    <div class="flex items-center justify-between mb-4">
  <router-link to="/post" class="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded text-sm transition">
    <ArrowLeftIcon class="w-5 h-5" />
    Volver
  </router-link>

  <BaseHeading1>Crear publicación</BaseHeading1>
</div>
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <div>
        <label class="block mb-1 text-xl font-semibold">Punto de inicio</label>
        <input v-model="post.start_point" required class="w-full px-4 py-2 bg-neutral-600 rounded" placeholder="Ej: Av. Córdoba y Callao" />
      </div>

      <div>
        <label class="block mb-1 text-xl font-semibold">Punto de finalización</label>
        <input v-model="post.end_point" required class="w-full px-4 py-2 bg-neutral-600 rounded " placeholder="Ej: La Cumbre, Córdoba" />
      </div>

      <div>
        <label class="block mb-1 text-xl font-semibold">Duración estimada</label>
        <input v-model="post.duration" required class="w-full px-4 py-2 bg-neutral-600 rounded" placeholder="Ej: 3 horas y media" />
      </div>

      <div>
        <label class="block mb-1 text-xl font-semibold">Puntaje</label>
        <select v-model="post.rating" class="w-full px-4 py-2 bg-neutral-600 rounded">
          <option disabled value="">Seleccioná un puntaje</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>

      <div>
        <label class="block mb-1 text-xl font-semibold">Descripción</label>
        <textarea v-model="post.description" required class="w-full px-4 py-2 bg-neutral-600 rounded " placeholder="Contanos cómo fue el recorrido, si lo hiciste solo o en grupo..."></textarea>
      </div>

      <div class="flex justify-end gap-4 items-center">
        
        <template v-if="loading">
          <BaseButton type="loading"><Loader size="sm" /></BaseButton>
        </template>
        <template v-else>
          <BaseButton type="orange" htmlType="submit">
            Publicar
          </BaseButton>
        </template>
      </div>

      <p v-if="success" class="text-green-400 text-sm text-center">¡Publicación creada correctamente!</p>
      <p v-if="error" class="text-red-400 text-sm text-center">{{ error }}</p>
    </form>
  </section>
</template>
