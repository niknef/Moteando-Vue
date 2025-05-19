<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { subscribeToAuth } from '@/services/auth'



export default {
  name: 'MyProfile',
  components: {
    BaseHeading1,
    BaseButton
  },
  data() {
    return {
      user: {
        id: null,
        email: null,
        first_name: '',
        last_name: '',
        bio: '',
        bike_model: '',
        avatar_url: ''
      }
    }
  },
  mounted() {
    subscribeToAuth(userData => {
      if (userData.id) {
        this.user = { ...this.user, ...userData }
      }
    })
  }
}
</script>

<template>
  <section class="max-w-xl mx-auto mt-8 bg-gray-800 text-white p-6 rounded-lg shadow-md text-center">
    <BaseHeading1>Mi perfil</BaseHeading1>

    <div class="mt-6 flex flex-col items-center gap-4">
      <img
        :src="user.avatar_url || '/assets/user.jpg'"
        alt="Foto de perfil"
        class="w-32 h-32 rounded-full object-cover"
      />

      <p class="text-xl font-semibold">
        {{ user.first_name || 'Agregar información en editar perfil' }}
        {{ user.last_name || '' }}
      </p>

      <p class="text-sm text-gray-400">{{ user.email }}</p>

      <p class="italic text-sm text-gray-300">
        {{ user.bio || 'Agregar información en editar perfil' }}
      </p>

      <p class="text-sm mt-1 text-orange-400">
        Moto: {{ user.bike_model || 'Agregar información en editar perfil' }}
      </p>

      <router-link to="/my-profile/edit">
        <BaseButton type="orange">Editar perfil</BaseButton>
      </router-link>
    </div>
  </section>
</template>
