<script setup>
/* ────────── imports ────────── */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import IconLucide     from '@/components/ui/IconLucide.vue'
import BaseHeading1   from '@/components/ui/BaseHeading1.vue'
import BaseButton     from '@/components/ui/BaseButton.vue'
import { subscribeToAuth, logout } from '@/services/auth'
import { listBikes, setActiveBike } from '@/services/bikes'

/* ────────── estado ────────── */
const profile = ref({
  id: null,
  email: null,
  first_name: '',
  last_name: '',
  bio: '',
  avatar_url: '',
  active_bike_id: null
})
const bikes = ref([])

/* ────────── cargar datos ────────── */
onMounted(async () => {
  subscribeToAuth(async u => {
    if (!u.id) return
    profile.value = { ...profile.value, ...u }

    // lista de motos del usuario
    bikes.value = await listBikes()
  })
})

/* ────────── acciones ────────── */
const router = useRouter()

function handleLogout () {
  logout()
  router.push('/login')
}

async function activate (id) {
  await setActiveBike(id)
  profile.value.active_bike_id = id
  bikes.value = await listBikes()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-black/95">
    <section class="w-full max-w-xl bg-neutral-800 text-white p-8 sm:rounded-lg shadow-md">
      <BaseHeading1 class="text-center">Mi perfil</BaseHeading1>

      <!-- Avatar -->
      <div class="mt-6 flex justify-center">
        <img
          :src="profile.avatar_url || '/assets/user.jpg'"
          class="w-32 h-32 rounded-full object-cover border border-gray-500"
          alt="Foto de perfil"
        />
      </div>

      <!-- Datos personales -->
      <div class="my-6 grid gap-4 sm:grid-cols-2 text-sm sm:text-base">
        <div class="bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Nombre</h2>
          <p class="text-white/50 mt-1">
            {{ profile.first_name || 'Agregar en editar perfil' }}
          </p>
        </div>

        <div class="bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Apellido</h2>
          <p class="text-white/50 mt-1">
            {{ profile.last_name || 'Agregar en editar perfil' }}
          </p>
        </div>

        <div class="bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Email</h2>
          <p class="text-white/50 mt-1">{{ profile.email }}</p>
        </div>

        <!-- Moto activa -->
        <div class="bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Moto activa</h2>
          <p class="text-white/50 mt-1">
            {{
              bikes.find(b => b.id === profile.active_bike_id)
                ? `${bikes.find(b => b.id === profile.active_bike_id).brand}
                   ${bikes.find(b => b.id === profile.active_bike_id).model}
                   (${bikes.find(b => b.id === profile.active_bike_id).year})`
                : 'Seleccioná o cargá una moto'
            }}
          </p>
        </div>

        <div class="sm:col-span-2 bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Biografía</h2>
          <p class="text-white/50 mt-1 whitespace-pre-wrap">
            {{ profile.bio || 'Agregar en editar perfil' }}
          </p>
        </div>
      </div>

      <!-- Listado de motos (máx 5) -->
      <div class="space-y-3 mb-6" v-if="bikes.length">
        <h2 class="text-gray-300 font-semibold mb-1">Mis motos</h2>
        <div
          v-for="b in bikes"
          :key="b.id"
          class="flex items-center gap-3 p-2 rounded bg-neutral-700/40"
        >
          <img :src="b.photo_url" class="w-12 h-12 rounded object-cover" />
          <div class="flex-1 text-sm">
            {{ b.brand }} {{ b.model }} ({{ b.year }})
          </div>

          <IconLucide
            v-if="b.id === profile.active_bike_id"
            name="CheckCircle2"
            :size="20"
            class="text-orange-400"
          />
          <BaseButton
            v-else
            size="xs"
            type="orange"
            @click="activate(b.id)"
          >
            Activar
          </BaseButton>
        </div>
      </div>

      <!-- Botones -->
      <div class="flex flex-col sm:flex-row justify-center gap-4">

        <!-- Mis motos -->
        <router-link to="/my-bikes">
          <BaseButton type="gray">
            <template #icon>
              <IconLucide name="Warehouse" :size="20" />
            </template>
            Mis motos
          </BaseButton>
        </router-link>

        <!-- Editar perfil (ya existente) -->
        <router-link to="/profile/edit">
          <BaseButton type="orange">
            <template #icon><IconLucide name="PencilLine" :size="20" /></template>
            Editar perfil
          </BaseButton>
        </router-link>
      </div>

      <!-- Cerrar sesión como link -->
      <p class="mt-4 text-center">
        <button
          class="text-red-400 hover:text-red-500 underline"
          @click="handleLogout"
        >
          Cerrar sesión
        </button>
      </p>

    </section>
  </div>
</template>
