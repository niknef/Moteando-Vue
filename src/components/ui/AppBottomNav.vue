<!-- src/components/ui/AppBottomNav.vue -->
<script setup>
import { useRoute } from 'vue-router'
import IconLucide   from '@/components/ui/IconLucide.vue'

const route = useRoute()
const isActive = p => route.path.startsWith(p)

/* ítems de izquierda a derecha */
const items = [
  { to: '/posts',       icon: 'Newspaper',     label: 'Posts'   },
  { to: '/events',      icon: 'CalendarClock', label: 'Eventos' },
  { to: '/map',         icon: 'MapPinned',     label: 'Mapa'    },
  { to: '/profile/me',  icon: 'UserCircle',    label: 'Perfil'  },
  { to: '/my-bikes',    icon: 'Warehouse',      label: 'Garage' }
]
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 bg-[#1c1c1c] border-t border-neutral-800
           h-16 flex justify-around items-center shadow-lg z-50"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
  >
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="group flex flex-col items-center justify-center transition-colors duration-200"
      :class="isActive(item.to) ? 'text-orange-400' : 'text-gray-400 opacity-80'"
      :aria-label="item.label"
    >
      <IconLucide
        :name="item.icon"
        :size="24"
        :active="isActive(item.to)"
        class="transition-colors duration-200 group-hover:text-orange-400"
      />
      <span class="text-[10px] mt-0.5">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
