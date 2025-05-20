<script>
//Componente del perfil de usuario

import BaseHeading1 from '@/components/ui/BaseHeading1.vue' // h1
import BaseButton from '@/components/ui/BaseButton.vue' // Botón
import { subscribeToAuth } from '@/services/auth' // Importo el método para subscribirme a los cambios de auth



export default {
  name: 'MyProfile',
  components: {
    BaseHeading1,
    BaseButton
  },
  data() {
    return {
      // Defino el objeto user con los campos necesarios
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
      if (userData.id) { // Si el usuario está autenticado
        this.user = { ...this.user, ...userData } // Actualizo el objeto user con los datos del usuario
      }
    })
  }
}
</script>

<template>
  <section class="max-w-xl mx-auto sm:mt-8 mb-6 px-4 sm:px-10 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md">

    <BaseHeading1 class="text-center">Mi perfil</BaseHeading1>

    <div class="mt-6 flex flex-col items-center gap-4">
      <!-- Avatar -->
      <img :src="user.avatar_url || '/assets/user.jpg'" alt="Foto de perfil"
        class="w-32 h-32 rounded-full object-cover border border-gray-500" />
    </div>

    <!-- Datos personales -->

    <div class="my-6 flex justify-center">
      <div class="space-y-4 text-left w-full max-w-md text-sm sm:text-base">
        <div class="flex flex-col sm:flex-row sm:justify-between gap-4 justify mx-auto">
          <div class="flex-1 bg-neutral-100/10 p-2 rounded-sm">
            <h2 class="text-gray-300 font-semibold">Nombre:</h2>
            <hr class="border-t border-orange-500/20 mb-0" />

            <p class="text-sm text-white/50 mt-1">{{ user.first_name || 'Agregar información en editar perfil' }}</p>
          </div>
          <div class="flex-1 bg-neutral-100/10 p-2 rounded-sm">
            <h2 class="text-gray-300 font-semibold">Apellido:</h2>
            <hr class="border-t border-orange-500/20 mb-0" />
            <p class="text-sm text-white/50 mt-1">{{ user.last_name || 'Agregar información en editar perfil' }}</p>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row sm:justify-between gap-4 justify mx-auto">
          <div class="flex-1 bg-neutral-100/10 p-2 rounded-sm">
            <h2 class="text-gray-300 font-semibold">Email:</h2>
            <hr class="border-t border-orange-500/20 mb-0" />
            <p class="text-sm text-white/50 mt-1">{{ user.email }}</p>
          </div>
          <div class="flex-1 bg-neutral-100/10 p-2 rounded-sm">
            <h2 class="text-gray-300 font-semibold">Moto:</h2>
            <hr class="border-t border-orange-500/20 mb-0" />
            <p class="text-sm text-white/50 mt-1">{{ user.bike_model || 'Agregar información en editar perfil' }}</p>
          </div>
        </div>

        <div class="bg-neutral-100/10 p-2 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Biografía:</h2>
          <hr class="border-t border-orange-500/20 mb-0" />
          <p class="text-sm text-white/50 mt-1">{{ user.bio || 'Agregar información en editar perfil' }}</p>
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
