<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import IconLucide from '@/components/ui/IconLucide.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Logo from '@/assets/moteando.svg'
import { useAuthStore } from '@/stores/auth'
import { useActiveNav } from '@/composables/useActiveNav'

const auth = useAuthStore()
const router = useRouter()

/* ítems de izquierda a derecha (Perfil va en el avatar de la derecha) */
const items = [
  { to: '/comunidad', icon: 'Users', label: 'Comunidad' },
  { to: '/rutas', icon: 'Map', label: 'Mis rutas' },
  { to: '/rutas/nueva', icon: 'CirclePlus', label: 'Crear ruta' },
]

// Perfil y Garaje no tienen ítem propio: se marcan en el avatar
const activeTo = useActiveNav([...items.map((item) => item.to), '/perfil', '/garaje'])
const accountActive = computed(() => activeTo.value === '/perfil' || activeTo.value === '/garaje')

const fullName = computed(() =>
  [auth.profile?.first_name, auth.profile?.last_name].filter(Boolean).join(' '),
)

// Iniciales para el avatar cuando no hay foto ("Nicolás Firpo" → "NF")
const initials = computed(() => {
  // ?? y no valores por defecto: la base devuelve null, y el default solo cubre undefined
  const first = auth.profile?.first_name ?? ''
  const last = auth.profile?.last_name ?? ''
  return (first.charAt(0) + last.charAt(0)).toUpperCase() || '?'
})

async function handleLogout() {
  await auth.logout()
  router.replace('/ingresar')
}
</script>

<template>
  <!-- Solo se monta dentro de AppShell (siempre con sesión).
       Sin "flex" propio: lo pone AppShell con "hidden lg:flex" para mostrarla solo en escritorio -->
  <header class="h-16 shrink-0 items-center gap-10 border-b border-border bg-background px-6">
    <router-link to="/" class="shrink-0">
      <img :src="Logo" alt="Moteando" class="h-8 w-auto" />
    </router-link>

    <nav class="flex gap-1">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="group flex h-10 items-center gap-2 rounded-md px-3.5 text-[15px] transition-colors"
        :class="
          item.to === activeTo
            ? 'bg-card font-medium text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        "
        :aria-current="item.to === activeTo ? 'page' : undefined"
      >
        <!-- En el activo, solo el ícono va en naranja -->
        <IconLucide
          :name="item.icon"
          :size="18"
          :class="item.to === activeTo ? 'text-primary' : undefined"
        />
        {{ item.label }}
      </RouterLink>
    </nav>

    <!-- Menú de la cuenta: se abre al tocar el avatar -->
    <DropdownMenu>
      <DropdownMenuTrigger
        class="ml-auto flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary text-[13px] font-semibold text-primary-foreground ring-offset-2 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :class="{ 'ring-2 ring-primary': accountActive }"
        aria-label="Menú de la cuenta"
      >
        <img
          v-if="auth.profile?.avatar_url"
          :src="auth.profile.avatar_url"
          alt=""
          class="size-full object-cover"
        />
        <span v-else>{{ initials }}</span>
      </DropdownMenuTrigger>

      <!-- w-56: el ancho por defecto copia el del disparador (el avatar, 36px) -->
      <DropdownMenuContent align="end" :side-offset="8" class="w-56 p-1">
        <DropdownMenuLabel class="flex flex-col gap-0.5 px-3 py-2">
          <span class="text-sm font-medium text-foreground">{{ fullName || 'Mi cuenta' }}</span>
          <span class="truncate text-xs font-normal">{{ auth.user?.email }}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem as-child class="h-10 gap-2.5 px-3">
          <router-link to="/perfil"><IconLucide name="User" />Mi perfil</router-link>
        </DropdownMenuItem>
        <DropdownMenuItem as-child class="h-10 gap-2.5 px-3">
          <router-link to="/garaje"><IconLucide name="Warehouse" />Mi garaje</router-link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" class="h-10 gap-2.5 px-3" @select="handleLogout">
          <IconLucide name="LogOut" />Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
