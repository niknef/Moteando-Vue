<script>
export default {
  name: 'BaseAlert',
  props: {
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'success', // 'success' | 'error'
      validator: (value) => ['success', 'error'].includes(value)
    }
  }
}
</script>

<template>
  <div
    v-if="message"
    :class="[
      'text-center text-sm px-4 py-2 rounded transition-all',
      type === 'success' ? 'text-green-400 bg-green-800/30' : '',
      type === 'error' ? 'text-red-400 bg-red-800/30' : ''
    ]"
  >
    {{ message }}
  </div>
</template>


