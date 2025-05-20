<script>
import Logo from '@/assets/moteando.svg'
import BaseButton from '@/components/ui/BaseButton.vue'
import { logout, subscribeToAuth } from '@/services/auth'
import {
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  UserIcon,
  HomeIcon
} from '@heroicons/vue/24/outline'

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
    subscribeToAuth(newUserData => {
      this.user = newUserData
    })
  },
  methods: {
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

      <!-- Ícono hamburguesa -->
      <button class="text-3xl sm:hidden z-50 transition-all" @click="showMenu = !showMenu">
        {{ showMenu ? '✕' : '☰' }}
      </button>

      <!-- Menú horizontal desktop -->
      <ul class="hidden sm:flex items-center gap-4">
        <li>
  <router-link to="/" class="hover:text-orange-400 flex items-center gap-1">
    <HomeIcon class="w-5 h-5" />
    Inicio
  </router-link>
</li>


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

    <!-- Menú hamburguesa mobile -->
    <transition name="fade">
      <div v-if="showMenu" class="sm:hidden fixed inset-0 bg-neutral-900 text-white flex flex-col items-center justify-center z-40">
        <ul class="flex flex-col items-center gap-6 text-xl">
          <li>
  <router-link to="/" class="flex items-center gap-2" @click="closeMenu">
    <HomeIcon class="w-6 h-6" />
    Inicio
  </router-link>
</li>


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
