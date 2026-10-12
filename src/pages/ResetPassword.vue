<script setup>
/* ────────── imports ────────── */
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import PasswordInput from '@/components/ui/PasswordInput.vue'
import PasswordStrength from '@/components/ui/PasswordStrength.vue'
import IconLucide from '@/components/ui/IconLucide.vue'

import { useAuthStore } from '@/stores/auth'
import Logo from '@/assets/moteando.svg'

defineOptions({ name: 'ResetPassword' })

/* ────────── estado reactivo ────────── */
const password = ref('')
const error = ref(null)
const loading = ref(false)

const router = useRouter()
const auth = useAuthStore()

/* ────────── submit ────────── */
async function handleSubmit() {
  error.value = null
  loading.value = true

  try {
    await auth.updatePassword(password.value)
    router.push('/rutas/nueva')
  } catch (err) {
    const msg = err.message
    if (msg.includes('different from the old password')) {
      error.value = 'La contraseña nueva tiene que ser distinta de la anterior.'
    } else if (msg.includes('at least 6 characters')) {
      error.value = 'La contraseña debe tener al menos 6 caracteres.'
    } else {
      error.value = 'Ocurrió un error inesperado. Intentalo de nuevo.'
    }
    console.error('[ResetPassword] ', msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background px-6 pt-20 pb-10">
    <img :src="Logo" alt="Moteando" class="h-12 w-auto self-center" />

    <!-- El link del mail abre una sesión temporal. Sin sesión: venció, ya se usó o se entró directo -->
    <template v-if="!auth.isLoggedIn">
      <h1 class="mt-6 text-3xl font-semibold tracking-tight">El link venció</h1>
      <p class="mt-2 text-[17px] text-muted-foreground">
        Los links para crear una contraseña nueva duran poco y sirven una sola vez. Pedí uno nuevo.
      </p>

      <Button as-child class="mt-11 h-13 w-full text-base font-semibold hover:bg-primary/90">
        <router-link to="/recuperar">Pedir otro link</router-link>
      </Button>
    </template>

    <template v-else>
      <h1 class="mt-6 text-3xl font-semibold tracking-tight">Creá una contraseña nueva</h1>
      <p class="mt-2 text-[17px] text-muted-foreground">
        Después de guardarla vas a entrar directo a Moteando.
      </p>

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
          <Label for="password">Contraseña nueva</Label>
          <PasswordInput
            id="password"
            v-model="password"
            autocomplete="new-password"
            placeholder="Mínimo 6 caracteres"
            minlength="6"
            aria-describedby="password-strength"
            :aria-invalid="!!error"
            class="h-13"
            required
          />
          <PasswordStrength :password="password" />
        </div>

        <Button
          type="submit"
          class="mt-6 h-13 w-full text-base font-semibold hover:bg-primary/90"
          :disabled="loading"
        >
          {{ loading ? 'Guardando…' : 'Guardar contraseña' }}
        </Button>
      </form>
    </template>
  </div>
</template>
