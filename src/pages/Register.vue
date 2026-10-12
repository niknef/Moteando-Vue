<script setup>
/* ────────── imports ────────── */
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import PasswordStrength from '@/components/ui/PasswordStrength.vue'
import IconLucide from '@/components/ui/IconLucide.vue'

import { useAuthStore } from '@/stores/auth'
import Logo from '@/assets/moteando.svg'

defineOptions({ name: 'Register' }) // opcional para DevTools

/* ────────── estado reactivo ────────── */
const user = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
})
const error = ref(null)
const loading = ref(false)

/* ────────── router ────────── */
const router = useRouter()
const auth = useAuthStore()

/* ────────── helpers ────────── */
function validate() {
  if (!user.firstName.trim() || !user.lastName.trim()) {
    error.value = 'Completá nombre y apellido.'
    return false
  }
  return true
}

/* ────────── submit ────────── */
async function handleSubmit() {
  error.value = null
  if (!validate()) return

  loading.value = true
  try {
    const { firstName, lastName, email, password } = user
    await auth.register(email, password, firstName.trim(), lastName.trim())
    router.push('/rutas/nueva') // nueva home
  } catch (err) {
    const msg = err.message
    if (msg.includes('User already registered')) {
      error.value = 'Ese email ya tiene una cuenta. Probá iniciar sesión.'
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
  <!-- Mismos espacios que Ingresar: el logo no salta al pasar de una pantalla a la otra -->
  <div class="flex min-h-dvh flex-col bg-background px-6 pt-20 pb-10">
    <img :src="Logo" alt="Moteando" class="h-12 w-auto self-center" />
    <h1 class="mt-6 text-3xl font-semibold tracking-tight">Creá tu cuenta</h1>
    <p class="mt-2 text-[17px] text-muted-foreground">Guardá tus rutas y seguí a otros moteros.</p>

    <div
      v-if="error"
      role="alert"
      class="mt-7 flex items-start gap-2.5 rounded-lg border border-destructive bg-card px-3.5 py-3 text-sm"
    >
      <IconLucide name="CircleAlert" :size="18" class="mt-px shrink-0 text-destructive" />
      {{ error }}
    </div>

    <form
      class="flex flex-col gap-4"
      :class="error ? 'mt-4' : 'mt-11'"
      @submit.prevent="handleSubmit"
    >
      <!-- Nombre y apellido lado a lado: entran bien en 390px -->
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-4">
          <Label for="firstName">Nombre</Label>
          <Input
            id="firstName"
            v-model="user.firstName"
            autocomplete="given-name"
            placeholder="Martín"
            class="h-13"
            required
          />
        </div>
        <div class="flex flex-col gap-4">
          <Label for="lastName">Apellido</Label>
          <Input
            id="lastName"
            v-model="user.lastName"
            autocomplete="family-name"
            placeholder="Gómez"
            class="h-13"
            required
          />
        </div>
      </div>

      <div class="mt-3 flex flex-col gap-4">
        <Label for="email">Email</Label>
        <Input
          id="email"
          v-model="user.email"
          type="email"
          autocomplete="email"
          placeholder="tu@correo.com"
          class="h-13"
          required
        />
      </div>

      <div class="mt-3 flex flex-col gap-4">
        <Label for="password">Contraseña</Label>
        <PasswordInput
          id="password"
          v-model="user.password"
          autocomplete="new-password"
          placeholder="Mínimo 6 caracteres"
          minlength="6"
          aria-describedby="password-strength"
          class="h-13"
          required
        />
        <PasswordStrength :password="user.password" />
      </div>

      <Button
        type="submit"
        class="mt-6 h-13 w-full text-base font-semibold hover:bg-primary/90"
        :disabled="loading"
      >
        {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
      </Button>
    </form>

    <p class="flex justify-center gap-1.5 pt-8 text-[15px] text-muted-foreground">
      ¿Ya tenés cuenta?
      <router-link to="/ingresar" class="font-semibold text-primary">Iniciá sesión</router-link>
    </p>
  </div>
</template>
