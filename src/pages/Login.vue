<script>
//Componente para el login
//Importaciones necesarias para el componente
import BaseHeading1 from '@/components/ui/BaseHeading1.vue' // h1
import BaseButton from '@/components/ui/BaseButton.vue' // Botón
import BaseInput from '@/components/ui/BaseInput.vue' // Input
import BaseLabel from '@/components/ui/BaseLabel.vue' // Label
import Loader from '@/components/ui/Loader.vue' // Loader
import { login } from '@/services/auth' // Importo el método para iniciar sesión
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline' // Iconos
import BaseAlert from '../components/ui/BaseAlert.vue' // Alertas

export default {
  name: 'Login',
  components: {
    BaseHeading1,
    BaseButton,
    BaseInput,
    BaseLabel,
    Loader,
    ArrowRightOnRectangleIcon,
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
    // Método para manejar el submit del formulario
    async handleSubmit() {
      this.error = null
      this.loading = true

      try {
        await login(this.user.email, this.user.password) // LLamamos al metodo login pasandole el email y la contraseña
        this.$router.push('/') // Redirigimos al usuario a la página de inicio
      } catch (error) { // si no se puede iniciar sesión, mostramos un mensaje de error

        const msg = error.message
        // Creo mensajes de error personalizados para cada caso
        if (msg.includes('Invalid login credentials')) {
          this.error = 'Email o contraseña incorrectos.'
        } else if (msg.includes('Email not confirmed')) {
          this.error = 'Tenés que verificar tu correo antes de ingresar.'
        } else {
          this.error = 'Ocurrió un error inesperado al iniciar sesión.'
        }

        console.error('[Login handleSubmit] Error:', msg)
      } finally {
        this.loading = false // Oculto el loader
      }
    }
  }
}
</script>

<template>
  <section class="max-w-md mx-auto bg-neutral-800 text-gray-100 p-8 sm:rounded-lg shadow-md mt-8">
    <BaseHeading1>Iniciar sesión</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <!-- email -->
      <div>
        <BaseLabel for="email">Email</BaseLabel>
        <BaseInput v-model="user.email" id="email" type="email" placeholder="ejemplo@email.com" required />
      </div>
      <!-- password -->
      <div>
        <BaseLabel for="password">Contraseña</BaseLabel>
        <BaseInput v-model="user.password" id="password" type="password" placeholder="••••••••" required />
      </div>

      <div class="flex items-center justify-center mt-4">
        <BaseButton type="orange" htmlType="submit">
          <template #icon>
            <Loader class="w-5 h-5 border-2" v-if="loading" />
            <ArrowRightOnRectangleIcon class="w-5 h-5" v-else />
          </template>
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </BaseButton>
      </div>

      <router-link to="/register" class="text-orange-500 underline text-center hover:text-orange-600">
        ¿No tenés cuenta? Registrate
      </router-link>


      <BaseAlert :message="error" type="error" />
    </form>
  </section>
</template>
