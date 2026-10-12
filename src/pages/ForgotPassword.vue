<script setup>
/* ────────── imports ────────── */
import { ref } from 'vue'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import IconLucide from '@/components/ui/IconLucide.vue'

import { useAuthStore } from '@/stores/auth'
import Logo from '@/assets/moteando.svg'

defineOptions({ name: 'ForgotPassword' })

/* ────────── estado reactivo ────────── */
const email = ref('')
const error = ref(null)
const loading = ref(false)
const sent = ref(false) // true cuando el mail ya salió: cambia el formulario por el aviso

const auth = useAuthStore()

/* ────────── submit ────────── */
async function handleSubmit() {
  error.value = null
  loading.value = true

  try {
    await auth.requestPasswordReset(email.value.trim())
    sent.value = true
  } catch (err) {
    const msg = err.message
    // Supabase limita cuántos mails se piden seguidos
    if (msg.includes('rate limit') || msg.includes('security purposes')) {
      error.value = 'Pediste varios links seguidos. Esperá unos minutos e intentá de nuevo.'
    } else {
      error.value = 'Ocurrió un error inesperado. Intentalo de nuevo.'
    }
    console.error('[ForgotPassword] ', msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-background px-6 pt-20 pb-10">
    <img :src="Logo" alt="Moteando" class="h-12 w-auto self-center" />

    <!-- Mail enviado -->
    <template v-if="sent">
      <div class="mt-11 flex flex-col items-center gap-4 text-center">
        <span class="flex size-14 items-center justify-center rounded-full bg-brand-teal/20">
          <IconLucide name="MailCheck" :size="28" class="text-brand-teal" />
        </span>
        <h1 class="text-3xl font-semibold tracking-tight">Revisá tu email</h1>
        <!-- No confirmamos si el email tiene cuenta: así nadie puede averiguarlo desde acá -->
        <p class="text-[17px] text-muted-foreground">
          Si hay una cuenta con <span class="font-medium text-foreground">{{ email }}</span
          >, te llegó un link para crear una contraseña nueva. Puede tardar unos minutos; fijate
          también en spam.
        </p>
      </div>

      <Button as-child class="mt-8 h-13 w-full text-base font-semibold hover:bg-primary/90">
        <router-link to="/ingresar">Volver a iniciar sesión</router-link>
      </Button>

      <button
        type="button"
        class="mt-4 self-center py-1.5 text-sm font-medium text-primary"
        @click="sent = false"
      >
        ¿No te llegó? Probá de nuevo
      </button>
    </template>

    <!-- Pedir el link -->
    <template v-else>
      <h1 class="mt-6 text-3xl font-semibold tracking-tight">Recuperá tu contraseña</h1>
      <p class="mt-2 text-[17px] text-muted-foreground">
        Escribí tu email y te mandamos un link para crear una nueva.
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
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="tu@correo.com"
            class="h-13"
            required
          />
        </div>

        <Button
          type="submit"
          class="mt-6 h-13 w-full text-base font-semibold hover:bg-primary/90"
          :disabled="loading"
        >
          {{ loading ? 'Enviando…' : 'Enviar link' }}
        </Button>
      </form>

      <p class="flex justify-center gap-1.5 pt-8 text-[15px] text-muted-foreground">
        ¿Te acordaste?
        <router-link to="/ingresar" class="font-semibold text-primary">Iniciá sesión</router-link>
      </p>
    </template>
  </div>
</template>
