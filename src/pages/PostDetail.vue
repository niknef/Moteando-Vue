<script>
//componente de detalle de un post en especifico 

import { getPostById } from '@/services/posts'  // Importo el método para obtener un post por id
import { getCommentsByPost, createComment, subscribeToNewComments } from '@/services/comments' // Importo los métodos para obtener y crear comentarios

import { subscribeToAuth } from '@/services/auth' // Importo el método para subscribirme a los cambios de auth
import BaseHeading1 from '@/components/ui/BaseHeading1.vue' // h1
import Loader from '@/components/ui/Loader.vue' // Loader
import BaseAlert from '@/components/ui/BaseAlert.vue' // Alertas
import { ArrowLeftIcon } from '@heroicons/vue/24/outline' // Iconos
import { nextTick } from 'vue' // Importo nextTick para hacer scroll al final de la lista de comentarios - chat global 

export default {
  name: 'PostDetail',
  components: {
    BaseHeading1,
    Loader,
    BaseAlert,
    ArrowLeftIcon
  },
  data() {
    return {
      post: null,
      comments: [], // Array de comentarios
      newComment: '',
      loading: true,
      error: null,
      commentLoading: false,
      commentSuccess: false,
      commentError: null,
      userId: null,
    }
  },
  async mounted() {
    try {
      // En el mounted llamo a la función subscribeToAuth para subscribirme a los cambios de auth
      subscribeToAuth(user => {
        this.userId = user.id
      })

      // Obtengo el id del post de la ruta
      const id = this.$route.params.id
      this.post = await getPostById(id) // Llamo al método getPostById para obtener el post por id
      this.comments = await getCommentsByPost(id) // Llamo al método getCommentsByPost para obtener los comentarios del post

      await nextTick()
      this.scrollToBottom() // Hago scroll al final de la lista de comentarios

      // Subscribo a los nuevos comentarios para el manejo en real time
      subscribeToNewComments(id, async comment => {
        this.comments.push(comment)
        await nextTick()
        this.scrollToBottom()
      })
    } catch (e) {
      this.error = 'No se pudo cargar el post.'
      console.error('[PostDetail] Error:', e)
    } finally {
      this.loading = false
    }
  },
  methods: {
    async submitComment() {
      if (!this.newComment.trim()) return // Valido que el comentario no esté vacío

      this.commentLoading = true
      this.commentSuccess = false
      this.commentError = null

      try {
        await createComment({ // Llamo al método createComment para crear un nuevo comentario donde le pasamos el id del post y el contenido del comentario
          post_id: this.post.id,
          content: this.newComment.trim()
        })

        this.newComment = '' // Reinicio el campo de comentario
        this.commentSuccess = true
        setTimeout(() => this.commentSuccess = false, 2000) // Oculto el mensaje de éxito después de 2 segundos
      } catch (e) {
        this.commentError = 'No se pudo enviar el comentario.'
        console.error('[submitComment] Error:', e)
      } finally {
        this.commentLoading = false
      }
    },
    scrollToBottom() {
      const el = this.$refs.commentsContainer
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }
}
</script>

<template>
  <section class="max-w-4xl mx-auto mt-8 px-4 text-white">
    <div class="mb-6 flex justify-between items-center">
      
      <BaseHeading1>Detalle del Post</BaseHeading1>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-40">
      <Loader class="w-10 h-10" />
    </div>

    <div v-else-if="error" class="text-red-400 text-center">{{ error }}</div>

    <div v-else class="bg-neutral-800 p-6 rounded-lg shadow">
      <!-- Usuario -->
      <div class="flex items-center gap-4 mb-3">
        <img :src="post.user_profiles?.avatar_url || '/assets/user.jpg'" alt="Avatar"
          class="w-10 h-10 rounded-full object-cover border" />
        <div>
          <router-link :to="`/usuario/${post.user_profiles?.id}`"
            class="font-semibold hover:underline hover:text-orange-400">
            {{ post.user_profiles?.first_name }} {{ post.user_profiles?.last_name }}
          </router-link>
          <p class="text-sm text-gray-400">{{ new Date(post.created_at).toLocaleDateString() }}</p>
        </div>
      </div>

      <hr class="border-t border-neutral-700 mb-4" />

      <p class="text-orange-400 font-semibold mb-1 flex items-center gap-2">
        Desde: {{ post.start_point }} → {{ post.end_point }}
      </p>
      <p class="text-sm text-gray-300 mb-2">Duración: {{ post.duration }}</p>
      <p class="text-gray-200 mb-2">Puntaje: {{ post.rating }}/5</p>
      <p class="bg-neutral-700 text-white p-3 rounded-md border-l-4 border-orange-500 italic shadow-sm mb-6">
        {{ post.description }}
      </p>
      <hr class="border-t border-neutral-700 mb-4" />

      <!-- Comentarios -->
      <h2 class="text-xl font-semibold text-orange-400 mb-4">Comentarios</h2>
      <div ref="commentsContainer" class="max-h-60 overflow-y-auto pr-2 space-y-4 mb-6">
        <div v-for="c in comments" :key="c.id" class="bg-neutral-700 p-3 rounded-lg">
          <div class="flex items-start gap-3">
            <img :src="c.user_profiles?.avatar_url || '/assets/user.jpg'"
              class="w-8 h-8 rounded-full object-cover border" alt="Avatar" />
            <div class="flex-1">
              <p class="text-sm font-semibold text-orange-300">
                <router-link :to="`/usuario/${c.user_profiles?.id}`" class="hover:underline">
                  {{ c.user_profiles?.first_name || 'Sin nombre' }} {{ c.user_profiles?.last_name || '' }}
                </router-link>
                <span class="text-xs text-gray-400 ml-2">{{ new Date(c.created_at).toLocaleString() }}</span>
              </p>
              <p class="text-sm text-gray-200 mt-1">{{ c.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Formulario -->
      <div>
        <textarea v-model="newComment" class="w-full p-3 bg-neutral-700 rounded text-white"
          placeholder="Escribí tu comentario..."></textarea>
        <div class="flex justify-end gap-4 ">
          <a href="/post" class="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
        <ArrowLeftIcon class="w-5 h-5" /> Volver
      </a>
          <button @click="submitComment" :disabled="commentLoading"
            class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm transition">
            <template v-if="commentLoading">
              <Loader class="w-4 h-4 border-2 inline" /> Enviando...
            </template>
            <template v-else>
              Enviar comentario
            </template>
          </button>
        </div>
        <div class="mt-2">
          <BaseAlert v-if="commentSuccess" type="success" message="Comentario enviado con éxito." />
          <BaseAlert v-if="commentError" type="error" :message="commentError" />
        </div>
      </div>
    </div>
  </section>
</template>
