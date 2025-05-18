<script>
export default {
  name: 'BaseButton',
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
          return 'bg-green-600 hover:bg-green-500 focus:bg-green-500';
        case 'error':
          return 'bg-red-600 hover:bg-red-500 focus:bg-red-500';
        case 'orange':
          return 'bg-orange-500 hover:bg-orange-600 focus:bg-orange-600';
        case 'gray':
          return 'bg-gray-600 hover:bg-gray-500 focus:bg-gray-500';
        default:
          return 'bg-blue-600 hover:bg-blue-500 focus:bg-blue-500';
      }
    }
  }
}
</script>

<template>
  <button
    type="button"
    :class="`transition px-6 py-2 rounded text-white font-semibold ${colorClasses}`"
  >
    <slot />
  </button>
</template>
