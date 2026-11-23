<script setup>
/* ────────── imports ────────── */
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import IconLucide from '@/components/ui/IconLucide.vue'

import { useAuthStore } from '@/stores/auth'
import Logo from '@/assets/moteando.svg'

defineOptions({ name: 'Login' }) // Esto aunque es opcional en api composition, lo pongo para ayudar a identificar el componente

/* ────────── estado reactivo ────────── */
const user = reactive({
  email: '',
  password: '',
})
const error = ref(null)
const loading = ref(false)

/* ────────── router ────────── */
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

/* ────────── acciones ────────── */
async function handleSubmit() {
  error.value = null
  loading.value = true

  try {
    await auth.login(user.email, user.password)
    // Si el guard nos mandó acá desde otra página, volvemos a ella
    router.push(route.query.redirect || '/rutas/nueva')
  } catch (err) {
    const msg = err.message
    if (msg.includes('Invalid login credentials')) {
      error.value = 'Email o contraseña incorrectos. Revisalos e intentá de nuevo.'
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
  <div class="flex min-h-dvh flex-col bg-background px-6 pt-20 pb-10">
    <img :src="Logo" alt="Moteando" class="h-12 w-auto self-center" />
    <p class="mt-6 text-[17px] text-muted-foreground">
      Armá tus rutas en moto y compartilas con la comunidad.
    </p>

    <!-- Error arriba del formulario (pantalla 0C) -->
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
      <div class="flex flex-col gap-4">
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
          :aria-invalid="!!error"
          autocomplete="current-password"
          placeholder="Tu contraseña"
          class="h-13"
          required
        />
      </div>

      <router-link to="/recuperar" class="self-end py-1.5 text-sm font-medium text-primary">
        ¿Olvidaste tu contraseña?
      </router-link>

      <Button
        type="submit"
        class="mt-1 h-13 w-full text-base font-semibold hover:bg-primary/90"
        :disabled="loading"
      >
        {{ loading ? 'Ingresando…' : 'Iniciar sesión' }}
      </Button>
    </form>

    <p class="flex justify-center gap-1.5 pt-8 text-[15px] text-muted-foreground">
      ¿No tenés cuenta?
      <router-link to="/registro" class="font-semibold text-primary">Registrate</router-link>
    </p>
  </div>
</template>
