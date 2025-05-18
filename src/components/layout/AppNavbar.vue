<script>
import Logo from '@/assets/moteando.svg'

export default {
  name: 'AppNavbar',
  data() {
    return {
      Logo
    }
  }
}
</script>

<template>
  <nav class="bg-gray-800 text-gray-100 px-10 py-3 shadow-md">
    <div class="container mx-auto flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2">
        <img :src="Logo" alt="Moteando" class="h-12 w-auto" />
        <span class="sr-only">Moteando</span>
      </router-link>

      <!-- Links -->
      <ul class="flex items-center gap-4">
        <li>
          <router-link to="/" class="hover:text-orange-400 transition-colors">Inicio</router-link>
        </li>
        <li>
          <router-link to="/chat" class="hover:text-orange-400 transition-colors">Chat</router-link>
        </li>
        <li>
          <router-link to="/login" class="hover:text-orange-400 transition-colors">Ingresar</router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>
