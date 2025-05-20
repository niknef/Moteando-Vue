<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseButtonOutline from '@/components/ui/BaseButtonOutline.vue'
import { logout, subscribeToAuth } from '@/services/auth'
import {
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  UserIcon
} from '@heroicons/vue/24/outline'


export default {
  name: 'Home',
  components: {
    BaseHeading1,
    BaseButton,
    BaseButtonOutline,
    UserPlusIcon,
    ArrowRightOnRectangleIcon,
    UserIcon
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
  <section
    class="relative text-center py-20 overflow-hidden rounded-md shadow-md mt-0 max-w-5xl mx-auto sm:w-full sm:mt-6">
    <!-- Imagen de fondo -->
    <img src="@/assets/ruta-motos-banner.jpg" alt="Ruta motera"
      class="absolute inset-0 w-full h-full object-cover opacity-40" />

    <!-- Capa oscura -->
    <div class="absolute inset-0 bg-black opacity-30"></div>

    <!-- Contenido -->
    <div class="relative z-10">
      <div v-if="user.id && user.email" class="mb-4 text-xl text-orange-400 font-semibold">
        ¡Hola, {{ user.email }}!
      </div>
      <BaseHeading1><span class="text-white">Mote</span><span class="font-bold">ando</span>: Motos, amigos y aventuras
      </BaseHeading1>
      <p class="max-w-2xl mx-auto text-gray-300 text-lg mb-6">
        Unite a la comunidad motera donde podés compartir rutas, experiencias, y conectarte con otros fanáticos de las
        dos ruedas.
      </p>

      <div class="flex flex-col sm:flex-row justify-center gap-4 mx-auto aling-items-center">
        <!-- Si NO está autenticado -->
        <template v-if="!user.id">
          <router-link to="/register">
            <BaseButton type="orange">
              <template #icon>
                <UserPlusIcon class="w-5 h-5" />
              </template>
              Crear cuenta
            </BaseButton>
          </router-link>
          <router-link to="/login">
            <BaseButtonOutline type="orange">
              <template #icon>
                <ArrowRightOnRectangleIcon class="w-5 h-5" />
              </template>
              Iniciar sesión
            </BaseButtonOutline>
          </router-link>
        </template>

        <!-- Si SÍ está autenticado -->
        <template v-else>
          <router-link to="/my-profile">
            <BaseButton type="orange">
              <template #icon>
                <UserIcon class="w-5 h-5" />
              </template>
              Mi perfil
            </BaseButton>
          </router-link>
        </template>
      </div>
    </div>
  </section>

  <section class="bg-neutral-900 text-white py-16 px-6 sm:px-12 mt-12">
    <div class="max-w-5xl mx-auto text-center">
      <h2 class="text-3xl font-bold mb-6 text-orange-400">¿Qué podés hacer en Moteando?</h2>
      <p class="text-gray-300 mb-12">
        Estas son solo algunas de las funciones que hacen de Moteando la app ideal para tu vida sobre dos ruedas.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 text-left">
        <div class="bg-neutral-800 p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 class="text-xl font-semibold text-orange-300 mb-2">📍 Crear y compartir rutas</h3>
          <p class="text-gray-400">Planeá tus recorridos favoritos y compartilos con la comunidad.</p>
        </div>
        <div class="bg-neutral-800 p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 class="text-xl font-semibold text-orange-300 mb-2">🎉 Participar en eventos</h3>
          <p class="text-gray-400">Sumate a encuentros moteros en todo el país organizados por otros usuarios.</p>
        </div>
        <div class="bg-neutral-800 p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 class="text-xl font-semibold text-orange-300 mb-2">💬 Conectar con moteros</h3>
          <p class="text-gray-400">Chateá, hacé amigos y armá grupo para salir a rodar con seguridad.</p>
        </div>
      </div>
    </div>
    <div class="mt-12 flex justify-center">
      <img src="@/assets/moteros-en-ruta.jpg" alt="Grupo de motos en ruta"
        class="rounded-lg shadow-md max-h-96 w-full object-cover sm:w-2/3" />
    </div>
  </section>
</template>
