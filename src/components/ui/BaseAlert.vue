<script>
//Alerta para mostrar mensajes de éxito o error

export default {
  name: 'BaseAlert',
  props: {
    message: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'success', // 'success' | 'error'
      validator: (value) => ['success', 'error'].includes(value),
    },
  },
}
</script>

<template>
  <div
    v-if="message"
    :class="[
      'text-center text-sm px-4 py-2 rounded transition-all',
      type === 'success' ? 'text-success bg-success/15' : '',
      type === 'error' ? 'text-destructive bg-destructive/15' : '',
    ]"
  >
    {{ message }}
  </div>
</template>
