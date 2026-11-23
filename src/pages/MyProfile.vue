<script setup>
/* ────────── imports ────────── */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import IconLucide from '@/components/ui/IconLucide.vue'
import ProfileRoutes from '@/components/route/ProfileRoutes.vue'
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import { useAuthStore } from '@/stores/auth'
import { listBikes, setActiveBike } from '@/services/bikes'

/* ────────── estado ────────── */
const auth = useAuthStore()

// El email sale de la sesión de Auth, el resto del perfil
const profile = computed(() => ({ ...auth.profile, email: auth.user?.email }))
const bikes = ref([])

/* ────────── cargar datos ────────── */
onMounted(async () => {
  bikes.value = await listBikes()
})

/* ────────── acciones ────────── */
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  router.replace('/ingresar')
}

async function activate(id) {
  await setActiveBike(id)
  await auth.loadProfile() // trae el active_bike_id actualizado
  bikes.value = await listBikes()
}
</script>

<template>
  <div class="min-h-full flex items-center justify-center">
    <section class="w-full max-w-xl bg-card text-foreground p-8 sm:rounded-lg shadow-md">
      <!-- Título -->
      <BaseHeading1 class="text-center">Mi perfil</BaseHeading1>

      <!-- Avatar -->
      <div class="mt-6 flex justify-center">
        <img
          :src="profile.avatar_url || '/assets/user.jpg'"
          class="w-32 h-32 rounded-full object-cover border border-border"
          alt="Foto de perfil"
        />
      </div>

      <!-- Datos personales -->
      <div class="my-6 grid gap-4 sm:grid-cols-2 text-sm sm:text-base">
        <div class="bg-muted p-3 rounded-lg">
          <h2 class="text-foreground/80 font-semibold">Nombre</h2>
          <p class="text-muted-foreground mt-1">
            {{ profile.first_name || 'Agregar en editar perfil' }}
          </p>
        </div>

        <div class="bg-muted p-3 rounded-lg">
          <h2 class="text-foreground/80 font-semibold">Apellido</h2>
          <p class="text-muted-foreground mt-1">
            {{ profile.last_name || 'Agregar en editar perfil' }}
          </p>
        </div>

        <div class="bg-muted p-3 rounded-lg">
          <h2 class="text-foreground/80 font-semibold">Email</h2>
          <p class="text-muted-foreground mt-1">{{ profile.email }}</p>
        </div>

        <!-- Moto activa -->
        <div class="bg-muted p-3 rounded-lg">
          <h2 class="text-foreground/80 font-semibold">Moto activa</h2>
          <p class="text-muted-foreground mt-1">
            {{
              bikes.find((b) => b.id === profile.active_bike_id)
                ? `${bikes.find((b) => b.id === profile.active_bike_id).brand}
                   ${bikes.find((b) => b.id === profile.active_bike_id).model}
                   (${bikes.find((b) => b.id === profile.active_bike_id).year})`
                : 'Seleccioná o cargá una moto'
            }}
          </p>
        </div>

        <div class="sm:col-span-2 bg-muted p-3 rounded-lg">
          <h2 class="text-foreground/80 font-semibold">Biografía</h2>
          <p class="text-muted-foreground mt-1 whitespace-pre-wrap">
            {{ profile.bio || 'Agregar en editar perfil' }}
          </p>
        </div>
      </div>

      <!-- Listado de motos -->
      <div v-if="bikes.length" class="space-y-3 mb-6">
        <h2 class="text-foreground/80 font-semibold mb-1">Mis motos</h2>

        <div
          v-for="b in bikes"
          :key="b.id"
          class="flex items-center gap-3 p-2 rounded-lg bg-muted/60"
        >
          <img :src="b.photo_url" class="w-12 h-12 rounded-lg object-cover" />
          <div class="flex-1 text-sm">{{ b.brand }} {{ b.model }} ({{ b.year }})</div>

          <IconLucide
            v-if="b.id === profile.active_bike_id"
            name="CheckCircle2"
            :size="20"
            class="text-primary"
          />
          <BaseButton v-else size="xs" type="orange" @click="activate(b.id)"> Activar </BaseButton>
        </div>
      </div>

      <!-- Rutas públicas (lo que ven los demás en tu perfil) -->
      <ProfileRoutes
        :user-id="auth.user?.id"
        title="Mis rutas públicas"
        empty-text="Todavía no hiciste pública ninguna ruta."
        more-to="/rutas"
        class="mb-6"
      />

      <!-- Botonera -->
      <div class="flex justify-center gap-4 items-center mt-4">
        <router-link to="/garaje">
          <BaseButton type="gray">
            <template #icon><IconLucide name="Warehouse" :size="20" /></template>
            Mis motos
          </BaseButton>
        </router-link>

        <router-link to="/perfil/editar">
          <BaseButton type="orange">
            <template #icon><IconLucide name="PencilLine" :size="20" /></template>
            Editar perfil
          </BaseButton>
        </router-link>
      </div>

      <!-- Cerrar sesión -->
      <p class="mt-4 text-center">
        <button class="text-destructive hover:text-destructive underline" @click="handleLogout">
          Cerrar sesión
        </button>
      </p>
    </section>
  </div>
</template>
