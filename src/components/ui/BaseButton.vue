<script setup>
import { computed } from 'vue'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Botón de las pantallas viejas, ahora dibujado con las variantes de shadcn y los tokens del tema.
// Mantiene su API (type, html-type, size, slot icon) para no tocar cada página; en código nuevo
// usar directamente <Button> de '@/components/ui/button'.

defineOptions({ name: 'BaseButton' })

const props = defineProps({
  // orange (principal) · gray (secundario / volver) · error (borrar) · success · loading
  type: { type: String, default: 'primary' },
  // tipo del <button> (submit en formularios)
  htmlType: { type: String, default: 'button' },
  // xs · sm · (por defecto, cómodo para el dedo)
  size: { type: String, default: '' },
})

const VARIANT = {
  orange: 'default',
  primary: 'default',
  success: 'default',
  gray: 'outline',
  error: 'destructive',
  loading: 'secondary',
}
const SIZE = { xs: 'sm', sm: 'default' }

const classes = computed(() =>
  cn(
    buttonVariants({ variant: VARIANT[props.type] ?? 'secondary', size: SIZE[props.size] ?? 'lg' }),
    // el tamaño por defecto llega a 44 px de alto: se usa con guantes
    !props.size && 'h-11 px-4 text-[15px]',
  ),
)
</script>

<template>
  <button :type="htmlType" :class="classes" :disabled="type === 'loading' || undefined">
    <!-- slot para el ícono, a la izquierda del texto -->
    <slot name="icon" />
    <slot />
  </button>
</template>
