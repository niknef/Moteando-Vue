
<script>
export default {
  name: 'BaseInput',
  props: {
    modelValue: [String, Number],
    type: {
      type: String,
      default: 'text'
    },
    placeholder: {
      type: String,
      default: ''
    }
  }
}
</script>
<template>
  <input
    :type="type"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    :placeholder="placeholder"
    class="w-full px-4 py-2 bg-neutral-600 rounded text-white placeholder-gray-400 focus:outline-none"
  />
</template>
