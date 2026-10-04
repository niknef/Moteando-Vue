<script setup>
/* ────────── imports ────────── */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import BaseHeading1   from '@/components/ui/BaseHeading1.vue'
import BaseButton     from '@/components/ui/BaseButton.vue'
import BaseInput      from '@/components/ui/BaseInput.vue'
import BaseLabel      from '@/components/ui/BaseLabel.vue'
import Loader         from '@/components/ui/Loader.vue'
import BaseAlert      from '@/components/ui/BaseAlert.vue'
import { register }   from '@/services/auth'
import IconLucide from '@/components/ui/IconLucide.vue'
import Logo from '@/assets/moteando.svg'

defineOptions({ name: 'Register' })   // opcional para DevTools

/* ────────── estado reactivo ────────── */
const user = reactive({
  firstName : '',
  lastName  : '',
  email     : '',
  password  : ''
})
const error   = ref(null)
const loading = ref(false)

/* ────────── router ────────── */
const router = useRouter()

/* ────────── helpers ────────── */
function validate () {
  if (!user.firstName.trim() || !user.lastName.trim()) {
    error.value = 'Completá nombre y apellido.'
    return false
  }
  return true
}

/* ────────── submit ────────── */
async function handleSubmit () {
  error.value   = null
  if (!validate()) return

  loading.value = true
  try {
    const { firstName, lastName, email, password } = user
    await register(email, password, firstName, lastName)
    router.push('/map')                       // nueva home
  } catch (err) {
    const msg = err.message
    if (msg.includes('User already registered')) {
      error.value = 'Ese correo ya está registrado. Intenta con otro.'
    } else if (msg.includes('Password should be at least 6 characters')) {
      error.value = 'La contraseña debe tener al menos 6 caracteres.'
    } else {
      error.value = 'Ocurrió un error inesperado. Intentalo de nuevo.'
    }
    console.error('[Register] ', msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-black/95 p-4">
    <img :src="Logo" alt="Moteando" class="h-16 mb-10" />
  <section class="w-full max-w-md bg-neutral-800 text-gray-100 p-8 sm:rounded-lg shadow-md flex flex-col items-center">
    <BaseHeading1>Crear cuenta</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <!-- Nombre & Apellido -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <BaseLabel for="firstName">Nombre</BaseLabel>
          <BaseInput v-model="user.firstName"
                     id="firstName"
                     autocomplete="given-name"
                      placeholder="Nombre"
                     required />
        </div>
        <div>
          <BaseLabel for="lastName">Apellido</BaseLabel>
          <BaseInput v-model="user.lastName"
                     id="lastName"
                     autocomplete="family-name"
                     placeholder="Apellido"
                     required />
        </div>
      </div>

      <!-- Email -->
      <div>
        <BaseLabel for="email">Email</BaseLabel>
        <BaseInput v-model="user.email"
                   id="email"
                   type="email"
                   placeholder="ejemplo@email.com"
                   autocomplete="email"
                   required />
      </div>

      <!-- Password -->
      <div>
        <BaseLabel for="password">Contraseña</BaseLabel>
        <BaseInput v-model="user.password"
                   id="password"
                   type="password"
                   placeholder="••••••••"
                   autocomplete="new-password"
                   minlength="6"
                   required />
      </div>

      <!-- Submit -->
      <div class="flex items-center justify-center mt-4">
        <BaseButton type="orange" htmlType="submit" :disabled="loading">
          <template #icon>
           <Loader v-if="loading" class="w-5 h-5 border-2" />
        <IconLucide v-else name="UserPlus" :size="20" class="text-white" />
         </template>
          {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
        </BaseButton>
      </div>

      <!-- Link a login -->
      <router-link to="/login"
                   class="text-orange-500 underline text-center hover:text-orange-600">
        ¿Ya tenés cuenta? Iniciá sesión
      </router-link>

      <!-- Error global -->
      <BaseAlert :message="error" type="error" />
    </form>
  </section>
  </div>
</template>
