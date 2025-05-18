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
  
  <div class="flex flex-col min-h-screen bg-gray-900 text-gray-100">
    <AppNavbar />

    
    <main class="flex-grow container mx-auto p-4">
      <router-view />
    </main>

    <AppFooter />
  </div>
</template>
