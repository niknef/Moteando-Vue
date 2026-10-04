<script>
export default {
  name: 'BaseInput',
  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
    type: {
      type: String,
      default: 'text',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
}
</script>
<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    class="w-full px-4 py-2 bg-neutral-600 rounded text-white placeholder-gray-400 focus:outline-none"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
