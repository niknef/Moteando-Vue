<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppBottomNav from '@/components/ui/AppBottomNav.vue'
import AppNavbar from '@/components/ui/AppNavbar.vue' // versión desktop

defineOptions({ name: 'AppShell' })

const route = useRoute()
const mainEl = ref(null)

// El scroll vive en <main> y no en la ventana: al cambiar de página lo volvemos arriba
watch(
  () => route.path,
  () => mainEl.value?.scrollTo({ top: 0 }),
)
</script>

<template>
  <!-- Alto fijo de la pantalla: las barras quedan quietas y solo scrollea el contenido -->
  <div class="flex h-dvh flex-col">
    <!-- Top nav solo desktop -->
    <AppNavbar class="hidden lg:flex" />

    <!-- min-h-0 deja que <main> se achique y scrollee adentro; las páginas con mapa usan h-full -->
    <main ref="mainEl" class="min-h-0 flex-1 overflow-y-auto">
      <router-view />
    </main>

    <!-- Bottom nav solo mobile -->
    <AppBottomNav class="lg:hidden" />
  </div>
</template>
