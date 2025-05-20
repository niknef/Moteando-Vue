<script>
import { getLastPosts } from '@/services/posts'
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import Loader from '@/components/ui/Loader.vue'
import { MapPinIcon, StarIcon, ClockIcon } from '@heroicons/vue/24/outline'


export default {
    name: 'PostList',
    components: {
        BaseHeading1,
        Loader,
        MapPinIcon,
        StarIcon,
        ClockIcon
    },
    data() {
        return {
            posts: [],
            loading: true,
            error: null
        }
    },
    async mounted() {
        try {
            const data = await getLastPosts()
            this.posts = data
        } catch (e) {
            this.error = 'No se pudieron cargar los posteos.'
            console.error('[PostList] Error:', e)
        } finally {
            this.loading = false
        }
    }
}
</script>

<template>
    <section class="max-w-4xl mx-auto mt-8 px-4">
        <div class="flex items-center justify-between mb-4">
            <BaseHeading1>Últimos posteos</BaseHeading1>
            <router-link to="/create-post">
                <button class="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded transition text-sm">
                + Nuevo post
                </button>
            </router-link>
            </div>

        <!-- Loader centrado -->
        <div v-if="loading" class="flex justify-center mt-6">
            <Loader class="w-20 h-20 border-4" />
        </div>

        <!-- Error -->
        <div v-if="error" class="text-center text-red-400 mt-6">{{ error }}</div>

        <!-- Sin posts -->
        <div v-if="!loading && posts.length === 0" class="text-center text-gray-300 mt-6">
            No hay publicaciones aún.
        </div>

        <!-- Listado de posteos -->
        <div v-for="post in posts" :key="post.id" class="bg-neutral-800 text-white p-6 mt-6 rounded-lg shadow">
            <!-- Info del usuario -->
            <div class="flex items-center gap-4 mb-3">
                <img :src="post.user_profiles?.avatar_url || '/assets/user.jpg'" alt="Avatar"
                    class="w-10 h-10 rounded-full object-cover border" />
                <div>
                    <router-link
                    :to="`/usuario/${post.user_profiles?.id}`"
                    class="font-semibold hover:underline hover:text-orange-400"
                    >
                    {{ post.user_profiles?.first_name || 'Sin nombre' }}
                    {{ post.user_profiles?.last_name || '' }}
                    </router-link>
                    <p class="text-sm text-gray-400">{{ post.created_at.split('T')[0] }}</p>
                </div>
            </div>
            <hr class="border-t border-neutral-700 mb-4" />
            <!-- Info del post -->
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

            <!-- Acciones futuras -->
            <div class="flex gap-4 text-sm text-orange-400">
                <button class="hover:underline">❤️ Me gusta</button>
                <button class="hover:underline">💬 Comentar</button>
            </div>
        </div>
    </section>
</template>
