<script>
// componente para mostrar una lista de los ultimos posteos

import { getLastPosts, subscribeToNewPosts } from '@/services/posts' // Importo el método para obtener los últimos posteos y subscribirme a nuevos posteos
import { createComment, getCommentCounts } from '@/services/comments' // Importo los métodos para crear comentarios y obtener los counts de comentarios
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import Loader from '@/components/ui/Loader.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { EyeIcon, MapPinIcon, StarIcon, ClockIcon } from '@heroicons/vue/24/outline'

export default {
    name: 'PostList',
    components: {
        BaseHeading1,
        Loader,
        BaseAlert,
        MapPinIcon,
        StarIcon,
        ClockIcon,
        EyeIcon
    },
    data() {
        return {
            posts: [], // Array de posteos
            loading: true,
            error: null,
            expandedComments: {}, // Objeto para manejar el estado de los comentarios
            commentCounts: {}, // Objeto para manejar los counts de comentarios
            commentTexts: {}, // Objeto para manejar los textos de los comentarios
            commentLoading: {}, // Objeto para manejar el loading de los comentarios
            commentSuccess: {}, // Objeto para manejar el éxito de los comentarios
            commentError: {} // Objeto para manejar el error de los comentarios
        }
    },
    async mounted() {
        try {
            const data = await getLastPosts() // Llamo al método getLastPosts para obtener los últimos posteos
            this.posts = data // Asigno los posteos a la variable posts
            this.commentCounts = await getCommentCounts() // Llamo al método getCommentCounts para obtener los counts de comentarios

            // Suscribirse a nuevos posts en real time
            subscribeToNewPosts(newPost => {
                this.posts.unshift(newPost)
                this.commentCounts[newPost.id] = 0
            })

        } catch (e) {
            this.error = 'No se pudieron cargar los posteos.'
            console.error('[PostList] Error:', e)
        } finally {
            this.loading = false
        }
    },
    methods: {

        toggleComments(postId) { // Método para alternar la visibilidad de los comentarios
            this.expandedComments = { // Alterno el estado de los comentarios
                ...this.expandedComments,
                [postId]: !this.expandedComments[postId]
            }
        },
        async submitComment(postId) {
            this.commentLoading[postId] = true
            this.commentSuccess[postId] = false
            this.commentError[postId] = null

            try {

                await createComment({ // Llamo al método createComment para crear un nuevo comentario
                    post_id: postId,
                    content: this.commentTexts[postId] || ''
                })

                this.commentSuccess[postId] = true
                this.commentTexts[postId] = ''

                //  Volvemos a consultar los counts actualizados desde la DB
                const counts = await getCommentCounts()
                this.commentCounts = counts
                //Oculta el form y el mensaje de éxito a los 2 segundos
                setTimeout(() => {
                    this.expandedComments[postId] = false
                    this.commentSuccess[postId] = false
                }, 2000)

            } catch (error) {
                this.commentError[postId] = 'No se pudo enviar el comentario.'
                console.error('[submitComment] Error:', error)
            } finally {
                this.commentLoading[postId] = false
            }
        }
    }
}
</script>

<template>
    <section class="max-w-4xl mx-auto mt-8 px-4">
        <div class="flex items-center justify-between mb-4">
            <BaseHeading1>Últimos posteos</BaseHeading1>
            <router-link to="/create-post">
                <button
                    class="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded transition text-sm">
                    + Nuevo post
                </button>
            </router-link>
        </div>

        <div v-if="loading" class="flex justify-center mt-6">
            <Loader class="w-20 h-20 border-4" />
        </div>

        <div v-if="error" class="text-center text-red-400 mt-6">{{ error }}</div>

        <div v-if="!loading && posts.length === 0" class="text-center text-gray-300 mt-6">
            No hay publicaciones aún.
        </div>

        <div v-for="post in posts" :key="post.id" class="bg-neutral-800 text-white p-6 mt-6 rounded-lg shadow">
            <div class="flex items-center justify-between gap-4 mb-3">
                <div class="flex items-center gap-4">
                    <img :src="post.user_profiles?.avatar_url || '/assets/user.jpg'" alt="Avatar"
                        class="w-10 h-10 rounded-full object-cover border" />
                    <div>
                        <router-link :to="`/usuario/${post.user_profiles?.id}`"
                            class="font-semibold hover:underline hover:text-orange-400">
                            {{ post.user_profiles?.first_name || 'Sin nombre' }} {{ post.user_profiles?.last_name || ''
                            }}
                        </router-link>
                        <p class="text-sm text-gray-400">{{ post.created_at.split('T')[0] }}</p>
                    </div>
                </div>

                <router-link :to="`/post/${post.id}`"
                    class="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-white transition">
                    <EyeIcon class="w-5 h-5" />
                    Ver más
                </router-link>
            </div>
            <hr class="border-t border-neutral-700 mb-4" />

            <p class="text-orange-400 font-semibold mb-1 flex items-center gap-2">
                <MapPinIcon class="w-5 h-5" />
                De: {{ post.start_point }} → {{ post.end_point }}
            </p>
            <p class="text-sm text-gray-300 mb-2 flex items-center gap-2">
                <ClockIcon class="w-5 h-5 text-gray-400" />
                Duración: {{ post.duration }}
            </p>
            <p class="text-gray-200 mb-2 flex items-center gap-2">
                <StarIcon class="w-5 h-5 text-yellow-400" />
                Puntaje: {{ post.rating }}/5
            </p>
            <p class="bg-neutral-700 text-white p-3 rounded-md border-l-4 border-orange-500 italic shadow-sm mb-4">
                {{ post.description }}
            </p>

            <div class="flex gap-4 text-sm justify-end text-orange-400">
                <button class="hover:underline" @click="toggleComments(post.id)">
                    💬 Comentar ({{ commentCounts[post.id] || 0 }})
                </button>
            </div>

            <div v-if="expandedComments[post.id]" class="mt-4">
                <textarea v-model="commentTexts[post.id]" class="w-full p-3 bg-neutral-700 rounded text-white"
                    placeholder="Escribí tu comentario..."></textarea>
                <div class="text-right mt-2">
                    <button @click="submitComment(post.id)" :disabled="commentLoading[post.id]"
                        class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm transition">
                        <template v-if="commentLoading[post.id]">
                            <Loader class="w-4 h-4 border-2 inline" /> Enviando...
                        </template>
                        <template v-else>
                            Enviar
                        </template>
                    </button>
                </div>

                <div class="mt-2">
                    <BaseAlert v-if="commentSuccess[post.id]" type="success" message="Comentario enviado con éxito." />
                    <BaseAlert v-if="commentError[post.id]" type="error" :message="commentError[post.id]" />
                </div>
            </div>
        </div>
    </section>
</template>
