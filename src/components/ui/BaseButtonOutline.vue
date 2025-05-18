<script>
export default {
  name: 'BaseButtonOutline',
  props: {
    type: {
      type: String,
      default: 'primary'
    }
  },
  computed: {
    colorClasses() {
      switch (this.type) {
        case 'success':
          return 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white';
        case 'error':
          return 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white';
        case 'orange':
          return 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white';
        case 'gray':
          return 'border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white';
        default:
          return 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white';
      }
    }
  }
}
</script>

<template>
  <button
    type="button"
    :class="`transition px-6 py-2 rounded font-semibold border ${colorClasses}`"
  >
    <slot />
  </button>
</template>
