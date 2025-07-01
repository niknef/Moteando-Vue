<!-- src/pages/Events.vue -->
<template>
  <div class="flex flex-col items-center justify-center min-h-screen text-center p-6">
    <!-- Ícono Lucide -->
    <HammerIcon class="w-24 h-24 text-orange-500 mb-6 animate-pulse" />

    <BaseHeading1>Eventos</BaseHeading1>
    <p class="text-lg text-gray-600 mb-6 max-w-md">
      Estamos trabajando en esta funcionalidad. Muy pronto vas a poder encontrar y participar de eventos moteros organizados por la comunidad.
    </p>
    <BaseButton type="orange" @click="$router.push('/')">
      Volver al inicio
    </BaseButton>
  </div>
</template>

<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { HammerIcon } from 'lucide-vue-next'

export default {
  name: 'Events',
  components: {
    BaseHeading1,
    BaseButton,
    HammerIcon
  }
}
</script>
