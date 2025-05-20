<script>
import AppNavbar from './components/layout/AppNavbar.vue'
import AppFooter from './components/layout/AppFooter.vue'

export default {
  name: 'App',
  components: {
    AppNavbar,
    AppFooter
  }
}
</script>

<template>
  
  <div class="flex flex-col min-h-screen bg-black/95 text-gray-100">
    <AppNavbar />

    
    <main class="flex-grow container mx-auto">
      <router-view />
    </main>

    <AppFooter />
  </div>
</template>
