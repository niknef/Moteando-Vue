<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import Loader from '@/components/ui/Loader.vue'
import { getUserProfileByPK } from '@/services/user-profile'
import { ArrowLeftIcon, Cog8ToothIcon } from '@heroicons/vue/24/outline'


export default {
  name: 'UserProfile',
  components: {
  BaseHeading1,
  Loader,
  ArrowLeftIcon,
  Cog8ToothIcon
    },
  data() {
    return {
      user: {
        id: null,
        first_name: '',
        last_name: '',
        avatar_url: '',
        bio: '',
        bike_model: ''
      },
      loading: true,
      error: null
    }
  },
  async mounted() {
    const id = this.$route.params.id

    if (!id) {
      this.error = 'No se proporcionó un ID válido.'
      return
    }

    try {
      this.user = await getUserProfileByPK(id)
    } catch (error) {
      this.error = 'No se pudo cargar el perfil.'
      console.error('[UserProfile] Error:', error)
    } finally {
      this.loading = false
    }
  }
}
</script>

<template>
  <section class="max-w-xl mx-auto mt-8 bg-neutral-800 text-white p-6 rounded-lg shadow-md mb-6">


    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <Loader class="w-16 h-16 border-4" />
    </div>

    <div v-else>
    <div class="flex items-center justify-between mb-4">
      <!-- volver -->
      <router-link to="/post">
        <button class="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded text-sm transition mb-4">
            <ArrowLeftIcon class="w-5 h-5" />
            Volver
        </button>
        </router-link>
 

      
      <BaseHeading1 class="text-left">Perfil de {{ user.first_name }} {{ user.last_name }}</BaseHeading1>
    </div>
      <hr class="border-t border-gray-600 mt-2 mb-6" />

      <!-- Foto -->
      <div class="flex justify-center mb-6">
        <img
          :src="user.avatar_url || '/assets/user.jpg'"
          alt="Avatar"
          class="w-32 h-32 rounded-full object-cover border border-gray-600"
        />
      </div>

      <!-- Bio -->
      <p class="text-gray-300 text-center mb-6 italic">
        {{ user.bio || 'Este usuario aún no escribió su biografía.' }}
      </p>

      <!-- Moto -->
      <div
        class="bg-neutral-700 p-4 rounded-md border-l-4 border-orange-500 flex items-center gap-2 text-white"
      >
        <Cog8ToothIcon class="w-5 h-5 text-orange-400" />
        <span><strong>Moto:</strong> {{ user.bike_model || 'No especificada' }}</span>
      </div>
    </div>
  </section>
</template>
