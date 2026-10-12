<script setup>
import { Button } from '@/components/ui/button'
import IconLucide from '@/components/ui/IconLucide.vue'

defineOptions({ name: 'MyRoutes' })
</script>

<template>
  <!-- Por ahora solo el estado vacío: el listado llega cuando se guarden rutas de verdad -->
  <div class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
    <span class="flex size-16 items-center justify-center rounded-full bg-primary/15">
      <IconLucide name="Route" :size="30" class="text-primary" />
    </span>
    <h1 class="text-2xl font-semibold tracking-tight">Todavía no tenés rutas</h1>
    <p class="max-w-xs text-muted-foreground">
      Armá tu primera ruta en el mapa y compartila con quien quieras.
    </p>
    <Button as-child class="mt-2 h-12 px-6 text-base font-semibold hover:bg-primary/90">
      <router-link to="/rutas/nueva">Crear ruta</router-link>
    </Button>
  </div>
</template>
