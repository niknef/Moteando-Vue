<script>
import Logo from '@/assets/moteando.svg' // Import el logo
import BaseButton from '@/components/ui/BaseButton.vue' // Importo el componente BaseButton
import { logout, subscribeToAuth } from '@/services/auth' // Importo los métodos de autenticación
import { ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon, UserIcon, HomeIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'AppNavbar',
  components: {
    BaseButton,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    UserIcon,
    HomeIcon
  },
  data() {
    return {
      Logo,
      user: {
        id: null,
        email: null
      },
      showMenu: false
    }
  },
  mounted() {
    // En el mounted llamo a la función subscribeToAuth para subscribirme a los cambios de auth 
    subscribeToAuth(newUserData => {
      this.user = newUserData
    })
  },
  methods: {
    // Metodo para cerar la sesión
    handleLogout() {
      logout()
      this.$router.push('/login')
      this.showMenu = false
    },
    closeMenu() {
      this.showMenu = false
    }
  }
}
</script>

<template>
  <nav class="bg-neutral-900 text-gray-100 px-6 py-3 shadow-md relative z-50">
    <div class="container mx-auto flex items-center justify-between w-11/12">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 z-50" @click="closeMenu">
        <img :src="Logo" alt="Moteando" class="h-10 w-auto" />
        <span class="sr-only">Moteando</span>
      </router-link>

      <!-- Hamburguesa -->
      <button class="text-3xl sm:hidden z-50 transition-all" @click="showMenu = !showMenu">
        {{ showMenu ? '✕' : '☰' }}
      </button>

      <!-- Menú para vista desktop -->
      <ul class="hidden sm:flex items-center gap-4">
        <li>
          <router-link to="/" class="hover:text-orange-400 flex items-center gap-1">
            <HomeIcon class="w-5 h-5" />
            Inicio
          </router-link>
        </li>

        <!-- Hacemos un condicional para mostrar el botón de ingresar o el de cerrar sesión dependiendo si el usuario está logueado o no -->
        <template v-if="!user.id">
          <li>
            <router-link to="/login" class="hover:text-orange-400">
              <BaseButton type="orange">
                <template #icon>
                  <ArrowRightOnRectangleIcon class="w-5 h-5" />
                </template>
                Ingresar
              </BaseButton>
            </router-link>
          </li>
        </template>

        <!-- Si el usuario está logueado mostramos el botón de cerrar sesión y las vistas de usuario  -->
        <template v-else>
          <li>
            <router-link to="/post" class="hover:text-orange-400">Posteos</router-link>
          </li>
          <li>
            <router-link to="/my-profile" class="hover:text-orange-400 flex items-center gap-1">
              <UserIcon class="w-5 h-5" />
              Perfil
            </router-link>
          </li>
          <li>
            <form @submit.prevent="handleLogout">
              <BaseButton type="error" htmlType="submit">
                <template #icon>
                  <ArrowLeftOnRectangleIcon class="w-5 h-5" />
                </template>
                Cerrar sesión
              </BaseButton>
            </form>
          </li>
        </template>
      </ul>
    </div>

    <!-- Menú hamburguesa para disp moviles -->
    <transition name="fade">
      <!-- Si showMenu es true, mostramos el menú -->
      <div v-if="showMenu"
        class="sm:hidden fixed inset-0 bg-neutral-900 text-white flex flex-col items-center justify-center z-40">
        <ul class="flex flex-col items-center gap-6 text-xl">
          <li>
            <router-link to="/" class="flex items-center gap-2" @click="closeMenu">
              <HomeIcon class="w-6 h-6" />
              Inicio
            </router-link>
          </li>

          <!-- Mismo condicional que en el menú desktop -->
          <template v-if="!user.id">
            <li>
              <router-link to="/login" @click="closeMenu">
                <BaseButton type="orange">
                  <template #icon>
                    <ArrowRightOnRectangleIcon class="w-5 h-5" />
                  </template>
                  Ingresar
                </BaseButton>
              </router-link>
            </li>
          </template>

          <template v-else>
            <li>
              <router-link to="/post" @click="closeMenu">Posteos</router-link>
            </li>
            <li>
              <router-link to="/my-profile" class="flex items-center gap-2" @click="closeMenu">
                <UserIcon class="w-6 h-6" />
                Perfil
              </router-link>
            </li>
            <li>
              <form @submit.prevent="handleLogout">
                <BaseButton type="error" htmlType="submit">
                  <template #icon>
                    <ArrowLeftOnRectangleIcon class="w-5 h-5" />
                  </template>
                  Cerrar sesión
                </BaseButton>
              </form>
            </li>
          </template>
        </ul>
      </div>
    </transition>
  </nav>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
