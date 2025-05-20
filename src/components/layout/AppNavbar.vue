<script>
import Logo from '@/assets/moteando.svg'
import BaseButton from '@/components/ui/BaseButton.vue'
import { logout, subscribeToAuth } from '@/services/auth'

export default {
  name: 'AppNavbar',
  components: { BaseButton },
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

      <!-- Links en horizontal -->
      <ul class="hidden sm:flex items-center gap-4">
        <li>
          <router-link to="/" class="hover:text-orange-400 transition-colors">Inicio</router-link>
        </li>
        <template v-if="user.id === null">
          <li>
            <BaseButton type="orange">
              <router-link to="/login">Ingresar</router-link>
            </BaseButton>
          </li>
        </template>
        <template v-else>
          <li>
            <router-link to="/my-profile" class="hover:text-orange-400">Perfil</router-link>
          </li>
          <li>
            <router-link to="/post" class="hover:text-orange-400">Posteos</router-link>
          </li>
          <li>
            <form @submit.prevent="handleLogout">
              <BaseButton type="error" htmlType="submit">Cerrar sesión</BaseButton>
            </form>
          </li>
        </template>
      </ul>
    </div>

    <!-- Menú hamburguesa -->
    <transition name="fade">
      <div v-if="showMenu" class="sm:hidden fixed inset-0 bg-gray-900 text-white flex flex-col items-center justify-center gap-6 z-40">
        <router-link to="/" class="text-xl" @click="closeMenu">Inicio</router-link>

        <template v-if="user.id === null">
          <BaseButton type="orange">
            <router-link to="/login">Ingresar</router-link>
          </BaseButton>
        </template>

        <template v-else>
          <router-link to="/profile" class="text-xl" @click="closeMenu">Perfil</router-link>
          <router-link to="/post" class="text-xl" @click="closeMenu">Posteos</router-link>
          <form @submit.prevent="handleLogout">
            <BaseButton type="error" htmlType="submit">Cerrar sesión</BaseButton>
          </form>
        </template>
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
