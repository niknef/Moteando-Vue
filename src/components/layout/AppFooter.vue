<script>
//Importo el logo de la carpeta assets
import Logo from '@/assets/moteando.svg'

export default {
  name: 'AppFooter',
  data() {
    return {
      Logo
    }
  }
}
</script>

<template>
  <footer class="bg-neutral-900 text-gray-400 py-4 px-10 mt-4">
    <div class="container mx-auto flex flex-col sm:flex-row items-center justify-between w-11/12">

      <router-link to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img :src="Logo" alt="Moteando" class="h-8 w-auto" />
      </router-link>


      <p class="text-sm text-center sm:text-right">
        Moteando © 2025 – Nicolás Firpo
      </p>
    </div>
  </footer>
</template>
