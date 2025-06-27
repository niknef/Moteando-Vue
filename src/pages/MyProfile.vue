<script setup>
/* ────────── imports ────────── */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import IconLucide     from '@/components/ui/IconLucide.vue'
import BaseHeading1   from '@/components/ui/BaseHeading1.vue'
import BaseButton     from '@/components/ui/BaseButton.vue'
import { subscribeToAuth, logout } from '@/services/auth'

/* ────────── estado ────────── */
const user = ref({
  id: null,
  email: null,
  first_name: '',
  last_name: '',
  bio: '',
  bike_model: '',
  avatar_url: ''
})

/* ────────── auth listener ────────── */
onMounted(() => {
  subscribeToAuth(u => {
    if (u.id) user.value = { ...user.value, ...u }
  })
})

/* ────────── acciones ────────── */
const router = useRouter()

function handleLogout () {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-black/95">
    <section
      class="w-full max-w-xl bg-neutral-800 text-white p-8 sm:rounded-lg shadow-md"
    >
      <BaseHeading1 class="text-center">Mi perfil</BaseHeading1>

      <!-- Avatar -->
      <div class="mt-6 flex justify-center">
        <img
          :src="user.avatar_url || '/assets/user.jpg'"
          class="w-32 h-32 rounded-full object-cover border border-gray-500"
          alt="Foto de perfil"
        />
      </div>

      <!-- Datos personales -->
      <div class="my-6 grid gap-4 sm:grid-cols-2 text-sm sm:text-base">
        <div class="bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Nombre</h2>
          <p class="text-white/50 mt-1">
            {{ user.first_name || 'Agregar en editar perfil' }}
          </p>
        </div>

        <div class="bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Apellido</h2>
          <p class="text-white/50 mt-1">
            {{ user.last_name || 'Agregar en editar perfil' }}
          </p>
        </div>

        <div class="bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Email</h2>
          <p class="text-white/50 mt-1">{{ user.email }}</p>
        </div>

        <div class="bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Moto</h2>
          <p class="text-white/50 mt-1">
            {{ user.bike_model || 'Agregar en editar perfil' }}
          </p>
        </div>

        <div class="sm:col-span-2 bg-neutral-100/10 p-3 rounded-sm">
          <h2 class="text-gray-300 font-semibold">Biografía</h2>
          <p class="text-white/50 mt-1 whitespace-pre-wrap">
            {{ user.bio || 'Agregar en editar perfil' }}
          </p>
        </div>
      </div>

      <!-- Botones -->
      <div class="mt-6 flex flex-col sm:flex-row justify-center gap-4">
        <router-link to="/profile/edit">
          <BaseButton type="orange">
            <template #icon>
              <IconLucide name="PencilLine" :size="20" />
            </template>
            Editar perfil
          </BaseButton>
        </router-link>

        <BaseButton type="error" @click="handleLogout">
          <template #icon>
            <IconLucide name="LogOut" :size="20" />
          </template>
          Cerrar sesión
        </BaseButton>
      </div>
    </section>
  </div>
</template>
