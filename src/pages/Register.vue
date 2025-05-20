<script>
//componente de registro 

import BaseHeading1 from '@/components/ui/BaseHeading1.vue' // h1
import BaseButton from '@/components/ui/BaseButton.vue' // Botón
import BaseInput from '@/components/ui/BaseInput.vue' // Input
import BaseLabel from '@/components/ui/BaseLabel.vue' // Label
import Loader from '@/components/ui/Loader.vue' // Loader
import { register } from '@/services/auth' // Importo el método register para registrar un nuevo usuario
import { UserPlusIcon } from '@heroicons/vue/24/outline' // Icono de usuario
import BaseAlert from '../components/ui/BaseAlert.vue' // Importo el componente de alerta

export default {
  name: 'Register',
  components: {
    BaseHeading1,
    BaseButton,
    BaseInput,
    BaseLabel,
    Loader,
    UserPlusIcon,
    BaseAlert
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
        await register(this.user.email, this.user.password) // Llamo al método register para registrar un nuevo usuario
        this.$router.push('/') // Redirijo al usuario a la página de inicio
      } catch (error) {
        const msg = error.message

        // manejo personalizado de errores
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
        <BaseLabel for="email">Email</BaseLabel>
        <BaseInput
          v-model="user.email"
          id="email"
          type="email"
          placeholder="ejemplo@email.com"
          required
        />
      </div>

      <div>
        <BaseLabel for="password">Contraseña</BaseLabel>
        <BaseInput
          v-model="user.password"
          id="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>

      <div class="flex items-center justify-center mt-4">
        <BaseButton type="orange" htmlType="submit" :disabled="loading">
          <template #icon>
            <Loader v-if="loading" class="w-5 h-5 border-2" />
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

      
      <BaseAlert :message="error" type="error" />
    </form>
  </section>
</template>
