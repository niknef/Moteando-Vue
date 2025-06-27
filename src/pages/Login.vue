<script setup>
/* ────────── imports ────────── */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import IconLucide     from '@/components/ui/IconLucide.vue'
import BaseHeading1   from '@/components/ui/BaseHeading1.vue'
import BaseButton     from '@/components/ui/BaseButton.vue'
import BaseInput      from '@/components/ui/BaseInput.vue'
import BaseLabel      from '@/components/ui/BaseLabel.vue'
import Loader         from '@/components/ui/Loader.vue'
import BaseAlert      from '@/components/ui/BaseAlert.vue'
import { login }      from '@/services/auth'


defineOptions({ name: 'Login' })   // Esto aunque es opcional en api composition, lo pongo para ayudar a identificar el componente

/* ────────── estado reactivo ────────── */
const user = reactive({
  email    : '',
  password : ''
})
const error   = ref(null)
const loading = ref(false)

/* ────────── router ────────── */
const router = useRouter()

/* ────────── acciones ────────── */
async function handleSubmit () {
  error.value   = null
  loading.value = true

  try {
    await login(user.email, user.password)
    router.push('/map')               // redirección a la pantalla principal -> que ahora es el mapa
    
  } catch (err) {
    const msg = err.message
    if (msg.includes('Invalid login credentials')) {
      error.value = 'Datos incorrectos. Revisá tu email y contraseña.'
    } else if (msg.includes('Email not confirmed')) {
      error.value = 'Confirmá tu email antes de iniciar sesión.'
    } else {
      error.value = 'Ocurrió un error inesperado. Intentalo de nuevo.'
    }
    console.error('[Login] ', msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-black/95">
  <section class="w-full max-w-md bg-neutral-800 text-gray-100 p-8 sm:rounded-lg shadow-md">
    <BaseHeading1>Iniciar sesión</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <!-- Email -->
      <div>
        <BaseLabel for="email">Email</BaseLabel>
        <BaseInput
          v-model="user.email"
          id="email"
          type="email"
          autocomplete="email"
          placeholder="ejemplo@email.com"
          required
        />
      </div>

      <!-- Password -->
      <div>
        <BaseLabel for="password">Contraseña</BaseLabel>
        <BaseInput
          v-model="user.password"
          id="password"
          type="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      <!-- Submit -->
      <div class="flex items-center justify-center mt-4">
        <BaseButton type="orange" htmlType="submit" :disabled="loading">
          <template #icon>
            <Loader v-if="loading" class="w-5 h-5 border-2" />
            <!-- Icono Lucide cuando no está cargando -->
            <IconLucide v-else name="LogIn" :size="20" />
          </template>
          {{ loading ? 'Ingresando…' : 'Ingresar' }}
        </BaseButton>
      </div>

      <!-- Link a register -->
      <router-link
        to="/register"
        class="text-orange-500 underline text-center hover:text-orange-600"
      >
        ¿No tenés cuenta? Registrate
      </router-link>

      <!-- Error global -->
      <BaseAlert :message="error" type="error" />
    </form>
  </section>
  </div>
  
</template>
