<!-- src/components/ui/AppBottomNav.vue -->
<script setup>
import IconLucide from '@/components/ui/IconLucide.vue'
import { useActiveNav } from '@/composables/useActiveNav'

/* ítems de izquierda a derecha; "Crear" es la acción principal y va resaltada */
const items = [
  { to: '/descubrir', icon: 'Compass', label: 'Descubrir' },
  { to: '/rutas/nueva', icon: 'Plus', label: 'Crear', primary: true },
  { to: '/rutas', icon: 'Map', label: 'Mis rutas' },
  { to: '/perfil', icon: 'User', label: 'Perfil' },
]

const activeTo = useActiveNav(items.map((item) => item.to))
</script>

<template>
  <!-- El relleno de abajo deja lugar a la barra de gestos del iPhone sin achicar los ítems -->
  <nav
    class="shrink-0 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    aria-label="Navegación principal"
  >
    <div class="mx-auto grid h-16 max-w-md grid-cols-4 px-2">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="group flex flex-col items-center justify-center gap-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-current="item.to === activeTo ? 'page' : undefined"
      >
        <!-- Crear: botón naranja; el resto, una píldora detrás del ícono cuando está activo -->
        <span
          v-if="item.primary"
          class="grid h-8 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform group-active:scale-95"
          :class="{ 'ring-2 ring-primary/40 ring-offset-2 ring-offset-card': item.to === activeTo }"
        >
          <IconLucide :name="item.icon" :size="22" :stroke-width="2.5" />
        </span>
        <span
          v-else
          class="grid h-8 w-14 place-items-center rounded-full transition-colors"
          :class="
            item.to === activeTo
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground group-hover:text-foreground'
          "
        >
          <IconLucide :name="item.icon" :size="22" />
        </span>
        <span
          class="text-[11px] leading-none"
          :class="
            item.to === activeTo
              ? 'font-semibold text-foreground'
              : 'font-medium text-muted-foreground'
          "
        >
          {{ item.label }}
        </span>
      </RouterLink>
    </div>
  </nav>
</template>
