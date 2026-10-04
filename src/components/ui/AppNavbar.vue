<script setup>
import IconLucide from '@/components/ui/IconLucide.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Logo from '@/assets/moteando.svg'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <nav class="hidden lg:flex bg-neutral-900 text-gray-100 h-16 items-center px-8 shadow-md w-full">
    <!-- Logo -->
    <router-link to="/map" class="flex items-center gap-2 shrink-0">
      <img :src="Logo" alt="Moteando" class="h-9" />
      <span class="sr-only">Moteando</span>
    </router-link>

    <!-- Contenido cuando NO hay sesión -->
    <template v-if="!auth.isLoggedIn">
      <div class="flex ml-auto gap-4">
        <router-link to="/login">
          <BaseButton type="orange">
            <template #icon><IconLucide name="LogIn" :size="20" /></template>
            Ingresar
          </BaseButton>
        </router-link>
        <router-link to="/register">
          <BaseButton type="ghost"> Registrarse </BaseButton>
        </router-link>
      </div>
    </template>

    <!-- Contenido cuando SÍ hay sesión -->
    <template v-else>
      <ul class="flex items-center gap-6 ml-auto">
        <li>
          <router-link to="/map" class="group flex items-center gap-1 hover:text-orange-400">
            <IconLucide name="MapPinned" :size="20" class="group-hover:text-orange-400" />
            Mapa
          </router-link>
        </li>
        <li>
          <router-link to="/posts" class="group flex items-center gap-1 hover:text-orange-400">
            <IconLucide name="Newspaper" :size="20" class="group-hover:text-orange-400" />
            Posts
          </router-link>
        </li>
        <li>
          <router-link to="/events" class="group flex items-center gap-1 hover:text-orange-400">
            <IconLucide name="CalendarClock" :size="20" class="group-hover:text-orange-400" />
            Eventos
          </router-link>
        </li>
        <li>
          <router-link to="/profile/me" class="group flex items-center gap-1 hover:text-orange-400">
            <IconLucide name="UserCircle" :size="22" class="group-hover:text-orange-400" />
            Perfil
          </router-link>
        </li>
      </ul>
    </template>
  </nav>
</template>
