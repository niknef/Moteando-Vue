<script setup>
/* ────────── imports ────────── */
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import Loader from '@/components/ui/Loader.vue'
import IconLucide from '@/components/ui/IconLucide.vue'

import { getUserProfileByPK } from '@/services/user-profile'
import { getBikeById } from '@/services/bikes' // 👉 asegurate de tener este método

/* ────────── estado ────────── */
const profile = ref({
  id: null,
  first_name: '',
  last_name: '',
  avatar_url: '',
  bio: '',
  active_bike_id: null // 👉 necesario para buscar la moto activa
})

const activeBike = ref(null)
const loading = ref(true)
const error = ref('')

/* ────────── cargar perfil ────────── */
const { params } = useRoute()
const router = useRouter()

onMounted(async () => {
  if (!params.id) {
    error.value = 'Ruta inválida — falta ID de usuario.'
    loading.value = false
    return
  }

  try {
    const data = await getUserProfileByPK(params.id)
    if (!data) {
      error.value = 'Usuario no encontrado.'
    } else {
      profile.value = data

      // Si tiene moto activa, la traemos
      if (data.active_bike_id) {
        activeBike.value = await getBikeById(data.active_bike_id)
      }
    }
  } catch (e) {
    console.error('[UserProfile]', e)
    error.value = 'No se pudo cargar el perfil.'
  } finally {
    loading.value = false
  }
})

/* ────────── navegación ────────── */
const goBack = () => router.back()
</script>

<template>
  <section class="max-w-xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md mb-6">
    <!-- loader -->
    <div v-if="loading" class="flex justify-center my-16">
      <Loader class="w-12 h-12 border-4" />
    </div>

    <!-- errores -->
    <BaseAlert v-else-if="error" :message="error" type="error" />

    <!-- contenido -->
    <template v-else>
      <!-- cabecera -->
        <BaseHeading1>Perfil de {{ profile.first_name }} {{ profile.last_name }}</BaseHeading1>


      <hr class="border-t border-gray-600 mb-6" />

      <!-- avatar -->
      <div class="flex justify-center mb-6">
        <img :src="profile.avatar_url || '/assets/user.jpg'" class="w-32 h-32 object-cover rounded-full border border-gray-600" />
      </div>

      <!-- nombre -->

      <h2 class="text-2xl font-bold text-orange-400 text-center mb-4">
        {{ profile.first_name }} {{ profile.last_name }}
      </h2>
      <!-- bio -->
      <p class="text-gray-300 text-center italic mb-6 whitespace-pre-wrap">
        {{ profile.bio || 'Este usuario aún no escribió su biografía.' }}
      </p>

      <!-- moto activa -->
      <div v-if="activeBike" class="bg-neutral-700 p-4 rounded-md border-l-4 border-orange-500 flex items-center gap-2 text-white mb-6">
        <IconLucide name="Bike" :size="20" class="text-orange-400" />
        <span>Moto activa: {{ activeBike.brand }} {{ activeBike.model }}</span>
      </div>

      <div v-else class="text-center text-gray-400">
        <IconLucide name="Info" :size="20" class="inline mr-1" />
        Este usuario no tiene una moto activa.
      </div>

      <div class="flex justify-end gap-4 mt-6">
        
      <BaseButton type="gray" size="sm" @click="goBack">
          <template #icon><IconLucide name="ArrowLeft" :size="18" /></template>
          Volver
        </BaseButton>
      </div>
    </template>
  </section>
</template>
