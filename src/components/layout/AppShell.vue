
<script setup>
import AppBottomNav from '@/components/ui/AppBottomNav.vue'
import AppNavbar    from '@/components/ui/AppNavbar.vue'   // versión desktop

defineOptions({ name: 'AppShell' })
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- Top nav solo desktop -->
    <AppNavbar class="hidden lg:flex" />

   <main class="flex-1 lg:pb-0">
      <router-view />
    </main>

    <!-- Bottom nav solo mobile -->
    <AppBottomNav />
  </div>
</template>
