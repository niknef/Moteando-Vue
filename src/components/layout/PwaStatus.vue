<script setup>
import { useOnline } from '@vueuse/core'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { Button } from '@/components/ui/button'
import IconLucide from '@/components/ui/IconLucide.vue'

// Avisos de la PWA: sin conexión (se ve lo último que se cargó) y versión nueva disponible.

const online = useOnline()

const { needRefresh, updateServiceWorker } = useRegisterSW({
  // busca versión nueva cada hora si la app queda abierta (por ejemplo, instalada)
  onRegisteredSW(_url, registration) {
    if (registration) setInterval(() => registration.update(), 60 * 60 * 1000)
  },
})
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 top-[max(0.5rem,env(safe-area-inset-top))] z-50 flex flex-col items-center gap-2 px-4"
  >
    <p
      v-if="!online"
      class="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm shadow-lg ring-1 ring-border"
      role="status"
    >
      <IconLucide name="WifiOff" :size="16" class="text-note-caution" />
      Sin conexión · ves lo último que cargaste
    </p>
    <p
      v-if="needRefresh"
      class="pointer-events-auto flex items-center gap-2 rounded-full bg-card py-1.5 pr-1.5 pl-3 text-sm shadow-lg ring-1 ring-border"
      role="status"
    >
      <IconLucide name="Sparkles" :size="16" class="text-primary" />
      Hay una versión nueva
      <Button size="sm" class="rounded-full" @click="updateServiceWorker(true)">Actualizar</Button>
      <Button
        size="icon-sm"
        variant="ghost"
        class="rounded-full"
        aria-label="Más tarde"
        @click="needRefresh = false"
      >
        <IconLucide name="X" :size="14" />
      </Button>
    </p>
  </div>
</template>
