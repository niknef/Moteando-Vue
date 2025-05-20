<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Loader from '@/components/ui/Loader.vue'
import { register } from '@/services/auth'
import { UserPlusIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'Register',
  components: {
    BaseHeading1,
    BaseButton,
    UserPlusIcon,
    Loader
  },
  data() {
    return {
      user: {
        email: '',
        password: ''
      },
      error: null,
      loading: false
    }
  },
  methods: {
    async handleSubmit() {
      this.error = null
      this.loading = true

      try {
        await register(this.user.email, this.user.password)
        this.$router.push('/')
      } catch (error) {
        const msg = error.message

        if (msg.includes('User already registered')) {
          this.error = 'Ese correo ya está registrado. Intenta con otro.'
        } else if (msg.includes('Password should be at least 6 characters')) {
          this.error = 'La contraseña debe tener al menos 6 caracteres.'
        } else {
          this.error = 'Ocurrió un error inesperado. Intentalo de nuevo.'
        }

        console.error('[Register handleSubmit] Error:', msg)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <section class="max-w-md mx-auto bg-neutral-800 text-gray-100 p-8 sm:rounded-lg shadow-md mt-8">
    <BaseHeading1>Crear cuenta</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <div>
        <label for="email" class="block mb-1 text-md font-semibold text-gray-300">Email</label>
        <input
          v-model="user.email"
          type="email"
          id="email"
          class="w-full px-4 py-2 rounded bg-neutral-600 text-white placeholder-gray-400 focus:outline-none"
          placeholder="ejemplo@email.com"
          required
        />
      </div>

      <div>
        <label for="password" class="block mb-1 text-md font-semibold text-gray-300">Contraseña</label>
        <input
          v-model="user.password"
          type="password"
          id="password"
          class="w-full px-4 py-2 rounded bg-neutral-600 text-white placeholder-gray-400 focus:outline-none"
          required
        />
      </div>

      <div class="flex items-center justify-between mt-4 mx-auto">
        <BaseButton type="orange" htmlType="submit" :disabled="loading">
          <template #icon>
            <template v-if="loading">
              <Loader class="w-5 h-5 border-2" />
            </template>
            <UserPlusIcon v-else class="w-5 h-5" />
          </template>
          {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
        </BaseButton>
      </div>

      <router-link
        to="/login"
        class="text-orange-500 underline text-center hover:text-orange-600"
      >
        ¿Ya tenés cuenta? Inicia sesión
      </router-link>

      <p v-if="error" class="text-red-400 text-sm mt-2 text-center">
        {{ error }}
      </p>
    </form>
  </section>
</template>
