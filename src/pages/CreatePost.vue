<script>
//Componente para crear una publicación

//Importaciones necesarias para el componente
import BaseHeading1 from '@/components/ui/BaseHeading1.vue' // h1
import BaseButton from '@/components/ui/BaseButton.vue' // Botón 
import BaseInput from '@/components/ui/BaseInput.vue' // Input
import BaseLabel from '@/components/ui/BaseLabel.vue' // Label
import Loader from '@/components/ui/Loader.vue' // Loader
import { createPost } from '@/services/posts' // Importo el método para crear un post
import { subscribeToAuth } from '@/services/auth' // Importo el método para subscribirme a los cambios de auth
import { ArrowLeftIcon } from '@heroicons/vue/24/outline' // Iconos
import BaseAlert from '../components/ui/BaseAlert.vue' // Alertas 

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
      // Defino el objeto post con los campos necesarios
      post: {
        start_point: '',
        end_point: '',
        duration: '',
        rating: 3,
        description: ''
      },
      success: false, // para manejar el mensaje de éxito
      error: null, // para manejar el mensaje de error
      loading: false // para manejar el loader
    }
  },
  mounted() {
    // En el mounted llamo a la función subscribeToAuth para subscribirme a los cambios de auth
    subscribeToAuth(user => {
      this.userId = user.id
    })
  },
  methods: {
    // Método para manejar el submit del formulario
    async handleSubmit() {
      // Valido que el usuario esté autenticado

      if (!this.userId) {
        this.error = 'Usuario no autenticado' // Si no está autenticado, muestro un mensaje de error
        return
      }


      this.loading = true // Muestro el loader
      this.error = null  // Limpio el mensaje de error
      this.success = false // Limpio el mensaje de éxito

      // probamos el crear post
      try {

        await createPost({ // hago un await al método createPost
          ...this.post, // paso los datos del post
          user_id: this.userId // paso el id del usuario
        })

        this.success = true // Si se crea el post, muestro un mensaje de éxito

        this.post = { // Reinicio el objeto post
          start_point: '',
          end_point: '',
          duration: '',
          rating: 3,
          description: ''
        }
        this.$router.push('/post') // Redirijo al usuario a la página de publicaciones
      } catch (e) { // Si hay un error, muestro un mensaje de error
        this.error = 'No se pudo guardar el post.'
        console.error('[CreatePost] Error al guardar:', e)
      } finally { // Siempre se ejecuta, independientemente de si hubo error o no terminamos el loading
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <section class="max-w-xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md">
    <div class="flex items-center justify-between mb-4">
      <!-- Boton para volver -->
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

    <!-- Formulario de creacion de post -->
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <!-- punto de inicio -->
      <div>
        <BaseLabel for="start_point">Punto de inicio</BaseLabel>
        <BaseInput id="start_point" v-model="post.start_point" required placeholder="Ej: Av. Córdoba y Callao" />
      </div>
      <!-- punto de finalización -->
      <div>
        <BaseLabel for="end_point">Punto de finalización</BaseLabel>
        <BaseInput id="end_point" v-model="post.end_point" required placeholder="Ej: La Cumbre, Córdoba" />
      </div>
      <!-- duración -->
      <div>
        <BaseLabel for="duration">Duración estimada</BaseLabel>
        <BaseInput id="duration" v-model="post.duration" required placeholder="Ej: 3 horas y media" />
      </div>
      <!-- puntaje -->
      <div>
        <BaseLabel for="rating">Puntaje</BaseLabel>
        <select id="rating" v-model="post.rating" class="w-full px-4 py-2 bg-neutral-600 rounded">
          <option disabled value="">Seleccioná un puntaje</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <!-- descripción -->
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
      <!-- Mensajes de éxito y error -->
      <BaseAlert v-if="success" message="Post creado exitosamente" type="success" />


      <BaseAlert v-if="error" :message="error" type="error" />
    </form>
  </section>
</template>
