<!-- src/components/ui/AppBottomNav.vue -->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import IconLucide from '@/components/ui/IconLucide.vue'

const route = useRoute()

/* ítems de izquierda a derecha */
const items = [
  { to: '/comunidad', icon: 'Users', label: 'Comunidad' },
  { to: '/rutas', icon: 'Map', label: 'Mis rutas' },
  { to: '/rutas/nueva', icon: 'CirclePlus', label: 'Crear' },
  { to: '/perfil', icon: 'User', label: 'Perfil' },
]

// Activo = el ítem con la dirección más larga que coincide con el principio de la ruta.
// Así /rutas/nueva marca "Crear" (no "Mis rutas") y /comunidad/123 sigue marcando "Comunidad".
const activeTo = computed(
  () =>
    items
      .map((item) => item.to)
      .filter((to) => route.path === to || route.path.startsWith(to + '/'))
      .sort((a, b) => b.length - a.length)[0],
)
</script>

<template>
  <!-- El relleno de abajo deja lugar a la barra de gestos del iPhone sin achicar los ítems -->
  <nav class="shrink-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
    <div class="flex h-16 items-center justify-around">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="flex h-full min-w-16 flex-col items-center justify-center gap-1 transition-colors"
        :class="
          item.to === activeTo ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        "
        :aria-current="item.to === activeTo ? 'page' : undefined"
      >
        <IconLucide :name="item.icon" :size="24" />
        <span class="text-[11px] font-medium">{{ item.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
