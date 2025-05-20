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
  <section class="max-w-xl mx-auto mt-8 mb-6 px-4 sm:px-10 bg-neutral-800 text-white p-6 rounded-lg shadow-md">

    <BaseHeading1 class="text-center">Mi perfil</BaseHeading1>

    <div class="mt-6 flex flex-col items-center gap-4">
      <!-- Avatar -->
      <img
        :src="user.avatar_url || '/assets/user.jpg'"
        alt="Foto de perfil"
        class="w-32 h-32 rounded-full object-cover border border-gray-500"
      />
    </div>

  <!-- Datos personales -->
<!-- Datos personales centrados pero alineados a la izquierda -->
<div class="my-6 flex justify-center">
  <div class="space-y-4 text-left w-full max-w-md text-sm sm:text-base">
      <div class="flex flex-col sm:flex-row sm:justify-between gap-4 justify mx-auto">
        <div class="flex-1">
          <p class="text-gray-300 font-semibold">Nombre:</p>
          <p>{{ user.first_name || 'Agregar información en editar perfil' }}</p>
        </div>
        <div class="flex-1">
          <p class="text-gray-300 font-semibold">Apellido:</p>
          <p>{{ user.last_name || 'Agregar información en editar perfil' }}</p>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row sm:justify-between gap-4 justify mx-auto">
        <div class="flex-1">
          <p class="text-gray-300 font-semibold">Email:</p>
        <p>{{ user.email }}</p>
        </div>
        <div class="flex-1">
          <p class="text-gray-300 font-semibold">Moto:</p>
        <p >{{ user.bike_model || 'Agregar información en editar perfil' }}</p>
        </div>
      </div>

      <div>
        <p class="text-gray-300 font-semibold">Biografía:</p>
        <p>{{ user.bio || 'Agregar información en editar perfil' }}</p>
      </div>

      
    </div>
  </div>

    <!-- Botón editar -->
    <div class="mt-6 text-center">
      <router-link to="/my-profile/edit">
        <BaseButton type="orange">Editar perfil</BaseButton>
      </router-link>
    </div>
  </section>
</template>

