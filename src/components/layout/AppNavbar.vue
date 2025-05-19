<script>
import Logo from '@/assets/moteando.svg'
import BaseButton from '@/components/ui/BaseButton.vue'

export default {
  name: 'AppNavbar',
  components: {
    BaseButton
  },
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
      
      <router-link to="/" class="flex items-center gap-2">
        <img :src="Logo" alt="Moteando" class="h-12 w-auto" />
        <span class="sr-only">Moteando</span>
      </router-link>

      
      <ul class="flex items-center gap-4">
        <li>
          <router-link to="/" class="hover:text-orange-400 transition-colors">Inicio</router-link>
        </li>
        <li>
          <router-link to="/chat" class="hover:text-orange-400 transition-colors">Chat</router-link>
        </li>
        <BaseButton type="orange" class="hidden sm:block">
          <router-link to="/login" >Ingresar</router-link>
        </BaseButton>
      </ul>
    </div>
  </nav>
</template>
