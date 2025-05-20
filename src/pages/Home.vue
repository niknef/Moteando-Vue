<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseButtonOutline from '@/components/ui/BaseButtonOutline.vue'
import { logout, subscribeToAuth } from '@/services/auth'

export default {
  name: 'Home',
  components: { 
    BaseHeading1,
    BaseButton,
    BaseButtonOutline
  },
  data() {
    return {
      user: {
        id: null,
        email: null
      }
    }
  },
  mounted() {
    subscribeToAuth(newUserData => {
      this.user = newUserData
    })
  },
  methods: {
    async handleLogout() {
      await logout()
      this.$router.push('/login')
    }
  }
}
</script>

<template>
  <section class="relative text-center py-20 overflow-hidden rounded-md shadow-md mt-6 max-w-5xl mx-auto">
    <!-- Imagen de fondo -->
    <img
      src="@/assets/ruta-motos-banner.jpg"
      alt="Ruta motera"
      class="absolute inset-0 w-full h-full object-cover opacity-40"
    />

    <!-- Capa oscura -->
    <div class="absolute inset-0 bg-black opacity-30"></div>

    <!-- Contenido -->
    <div class="relative z-10">
      <div v-if="user.id && user.email" class="mb-4 text-xl text-orange-400 font-semibold">
        ¡Hola, {{ user.email }}!
      </div>
      <BaseHeading1><span class="text-white">Mote</span><span class="font-bold">ando</span>: Motos, amigos y aventuras</BaseHeading1>
      <p class="max-w-2xl mx-auto text-gray-300 text-lg mb-6">
        Unite a la comunidad motera donde podés compartir rutas, experiencias, y conectarte con otros fanáticos de las dos ruedas.
      </p>

      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <!-- Si NO está autenticado -->
        <template v-if="!user.id">
          <router-link to="/register" class="w-full sm:w-auto">
            <BaseButton type="orange" class="w-full sm:w-auto" >Crear cuenta</BaseButton>
          </router-link>
          <router-link to="/login">
            <BaseButtonOutline type="orange" class="w-full sm:w-auto">Iniciar sesión</BaseButtonOutline>
          </router-link>
        </template>

        <!-- Si SÍ está autenticado -->
        <template v-else>
        <router-link to="/my-profile" class="w-full sm:w-auto">
          <BaseButton type="orange" class="w-full sm:w-auto">Mi perfil</BaseButton>
        </router-link>
      </template>
      </div>
    </div>
  </section>
</template>
