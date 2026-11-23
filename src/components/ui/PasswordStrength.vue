<script setup>
import { computed } from 'vue'

const props = defineProps({
  password: { type: String, default: '' },
  // Para vincularlo con el input vía aria-describedby
  id: { type: String, default: 'password-strength' },
})

// Cada criterio cumplido suma una barrita; el primero que falta es la sugerencia
const criteria = [
  { test: (p) => p.length >= 8, hint: 'usá al menos 8 caracteres' },
  { test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p), hint: 'combiná mayúsculas y minúsculas' },
  { test: (p) => /\d/.test(p), hint: 'sumá un número' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), hint: 'sumá un símbolo' },
]
const labels = ['Débil', 'Débil', 'Regular', 'Buena', 'Muy segura']

const score = computed(() => criteria.filter((c) => c.test(props.password)).length)

const message = computed(() => {
  // Supabase pide 6 como mínimo: por debajo no tiene sentido puntuar
  if (props.password.length < 6) return 'Muy corta · necesita al menos 6 caracteres'
  const missing = criteria.find((c) => !c.test(props.password))
  if (!missing) return labels[4]
  return `${labels[score.value]} · ${missing.hint} para hacerla más segura`
})
</script>

<template>
  <div v-if="password" class="flex flex-col gap-2">
    <div class="grid grid-cols-4 gap-1" aria-hidden="true">
      <span
        v-for="n in 4"
        :key="n"
        class="h-1 rounded-full transition-colors"
        :class="n <= score ? 'bg-primary' : 'bg-border'"
      />
    </div>
    <span :id="id" class="text-[13px] text-muted-foreground" aria-live="polite">
      {{ message }}
    </span>
  </div>
</template>
