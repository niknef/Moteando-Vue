<script>
export default {
  name: 'BaseButton',
  props: {
    type: {
      type: String,
      default: 'primary'
    },
    htmlType: {
      type: String,
      default: 'button' // esto nos va a aservir para el botón de submit cuando lo usemos en formularios
      
    }
  },
  computed: {
    colorClasses() {
      switch (this.type) {
        case 'orange':
          return 'bg-orange-500 hover:bg-orange-600 focus:bg-orange-600';
        case 'success':
          return 'bg-green-600 hover:bg-green-500 focus:bg-green-500';
        case 'error':
          return 'bg-red-600 hover:bg-red-500 focus:bg-red-500';
        default:
          return 'bg-blue-600 hover:bg-blue-500 focus:bg-blue-500';
      }
    }
  }
}
</script>

<template>
  <button
    :type="htmlType"
    :class="`transition px-6 py-2 rounded text-white font-semibold ${colorClasses}`"
  >
    <slot />
  </button>
</template>
