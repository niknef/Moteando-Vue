<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { register } from '@/services/auth'

export default {
  name: 'Register',
  components: {
    BaseHeading1,
    BaseButton
  },
  data() {
    return {
      user: {
        email: '',
        password: ''
      },
      error: null
    }
  },
  methods: {
    async handleSubmit() {
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
            }
    }
  }
}
</script>

<template>
  <section class="max-w-md mx-auto bg-neutral-800 text-gray-100 p-8 rounded-lg shadow-md mt-8">
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

        <BaseButton type="orange" htmlType="submit">
            Crear cuenta
        </BaseButton>
        
        <router-link to="/login" class="text-orange-500 underline text-center">¿Ya tenes cuenta? Inicia sesión</router-link>

      <p v-if="error" class="text-red-400 text-sm mt-2 text-center">{{ error }}</p>
    </form>
  </section>
</template>
