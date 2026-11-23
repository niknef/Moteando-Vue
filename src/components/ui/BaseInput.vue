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
    class="h-11 w-full min-w-0 rounded-lg border border-input bg-muted px-3.5 text-base text-foreground transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
