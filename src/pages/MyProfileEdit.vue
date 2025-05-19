<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Loader from '@/components/ui/Loader.vue'
import { subscribeToAuth, updateAuthProfile } from '@/services/auth'

export default {
  name: 'MyProfileEdit',
  components: {
    BaseHeading1,
    BaseButton,
    Loader
  },
  data() {
    return {
      user: {
        id: null,
        email: '',
        first_name: '',
        last_name: '',
        bio: '',
        bike_model: '',
        avatar_url: ''
      },
      success: false,
      error: null,
      loading: false
    }
  },
  mounted() {
    subscribeToAuth(userData => {
      if (userData.id) {
        this.user = { ...this.user, ...userData }
      }
    })
  },
  methods: {
    async handleSubmit() {
      if (this.loading) return

      this.success = false
      this.error = null
      this.loading = true

      try {
        await updateAuthProfile({
          first_name: this.user.first_name,
          last_name: this.user.last_name,
          bio: this.user.bio,
          bike_model: this.user.bike_model,
          avatar_url: this.user.avatar_url
        })

        this.success = true
      } catch (e) {
        this.error = 'Hubo un error al actualizar el perfil.'
        console.error('[MyProfileEdit] error:', e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <section class="max-w-xl mx-auto mt-8 bg-gray-800 text-white p-6 rounded-lg shadow-md">
    <BaseHeading1>Editar perfil</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <!-- Email solo lectura -->
      <div>
        <label class="block mb-1 text-sm">Email</label>
        <input
          v-model="user.email"
          type="email"
          disabled
          class="w-full px-4 py-2 bg-gray-700 rounded text-gray-400 cursor-not-allowed"
        />
      </div>

      <!-- Nombre y Apellido -->
      <div class="flex gap-4">
        <div class="flex-1">
          <label class="block mb-1 text-sm">Nombre</label>
          <input v-model="user.first_name" type="text" class="w-full px-4 py-2 bg-gray-700 rounded" />
        </div>
        <div class="flex-1">
          <label class="block mb-1 text-sm">Apellido</label>
          <input v-model="user.last_name" type="text" class="w-full px-4 py-2 bg-gray-700 rounded" />
        </div>
      </div>

      <!-- Moto -->
      <div>
        <label class="block mb-1 text-sm">Modelo de moto</label>
        <input v-model="user.bike_model" type="text" class="w-full px-4 py-2 bg-gray-700 rounded" />
      </div>

      <!-- Bio -->
      <div>
        <label class="block mb-1 text-sm">Biografía</label>
        <textarea v-model="user.bio" rows="3" class="w-full px-4 py-2 bg-gray-700 rounded"></textarea>
      </div>

      <!-- Avatar -->
      <div>
        <label class="block mb-1 text-sm">URL de tu foto de perfil</label>
        <input v-model="user.avatar_url" type="text" class="w-full px-4 py-2 bg-gray-700 rounded" />
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-4 items-center">
        <router-link to="/my-profile">
          <BaseButton type="error">Volver</BaseButton>
        </router-link>
        <template v-if="loading">
            <BaseButton type="loading"><Loader size="sm" /></BaseButton>
        </template>
        <template v-else>
            <BaseButton type="orange" htmlType="submit">
              Guardar
            </BaseButton>
        </template>
      </div>

      <p v-if="success" class="text-green-400 text-sm mt-2 text-center">Perfil actualizado correctamente.</p>
      <p v-if="error" class="text-red-400 text-sm mt-2 text-center">{{ error }}</p>
    </form>
  </section>
</template>
