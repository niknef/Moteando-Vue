<script setup>
import { useRoute } from 'vue-router'
import AppFooter from '@/components/layout/AppFooter.vue'

const route = useRoute()

/* Ocultar footer en pantallas móviles siempre que exista el bottom-nav
   (todas las rutas privadas) */
const hideFooter = () => route.path !== '/login' && route.path !== '/register'
</script>

<template>
  <div class="flex flex-col min-h-screen bg-black/95 text-gray-100">
    <main class="flex-1 overflow-y-auto pb-[4rem] lg:pb-0">
      <!-- 4 rem = altura del bottom-nav -->
      <router-view />
    </main>

    <!-- footer solo ≥ lg -->
    <AppFooter v-if="hideFooter()" class="hidden lg:block" />
  </div>
</template>
