<script>
export default {
  name: 'BaseButtonOutline',
  props: {
    type: {
      type: String,
      default: 'primary'
    },
    htmlType: {
      type: String,
      default: 'button'
    }
  },
  computed: {
    colorClasses() {
      switch (this.type) {
        case 'orange':
          return 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white';
        case 'success':
          return 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white';
        case 'error':
          return 'border-red-500 text-red-500 hover:bg-red-500 hover:text-white';
        case 'gray':
          return 'border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white';
        default:
          return 'border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white';
      }
    }
  }
}
</script>

<template>
  <button :type="htmlType"
    :class="`inline-flex items-center gap-2 px-6 py-2 border font-semibold rounded transition ${colorClasses}`">
    <slot name="icon" />
    <slot />
  </button>
</template>
