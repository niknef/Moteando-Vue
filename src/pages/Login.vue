<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { login } from '@/services/auth'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import Loader from '@/components/ui/Loader.vue'

export default {
  name: 'Login',
  components: {
    BaseHeading1,
    BaseButton,
    ArrowRightOnRectangleIcon,
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
        await login(this.user.email, this.user.password)
        this.$router.push('/') 
      } catch (error) {
        const msg = error.message

        if (msg.includes('Invalid login credentials')) {
          this.error = 'Email o contraseña incorrectos.'
        } else if (msg.includes('Email not confirmed')) {
          this.error = 'Tenés que verificar tu correo antes de ingresar.'
        } else {
          this.error = 'Ocurrió un error inesperado al iniciar sesión.'
        }

        console.error('[Login handleSubmit] Error:', msg)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<template>
  <section class="max-w-md mx-auto bg-neutral-800 text-gray-100 p-8 sm:rounded-lg shadow-md mt-8">
    <BaseHeading1>Iniciar sesión</BaseHeading1>

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
      <BaseButton type="orange" htmlType="submit">
  <template #icon>
    <template v-if="loading">
      <Loader class="w-5 h-5 border-2" />
    </template>
    <ArrowRightOnRectangleIcon v-else class="w-5 h-5" />
  </template>
  {{ loading ? 'Ingresando...' : 'Ingresar' }}
</BaseButton>

      </div>

      <router-link to="/register" class="text-orange-500 underline text-center hover:text-orange-600">
        ¿No tenés cuenta? Registrate
      </router-link>

      <p v-if="error" class="text-red-400 text-sm mt-2 text-center">{{ error }}</p>
    </form>
  </section>
</template>
