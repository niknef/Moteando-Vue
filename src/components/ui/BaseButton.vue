<script>
export default {
  name: 'BaseButton',
  props: {
    type: {
      type: String,
      default: 'primary'
    },
    //Esto lo utilizamos para cunado tenemos que hacer un submit
    //por ejemplo en el login
    htmlType: {
      type: String,
      default: 'button'
    }
  },
  computed: {
    colorClasses() {
      switch (this.type) {
        //El orange lo vamos a utilizar en botones principales
        case 'orange':
          return 'bg-orange-500 hover:bg-orange-600 focus:bg-orange-600';
        //Botones de confirmación
        case 'success':
          return 'bg-green-600 hover:bg-green-500 focus:bg-green-500';
        //Botones de error
        case 'error':
          return 'bg-red-600 hover:bg-red-500 focus:bg-red-500';
        //Botones con el loader
        case 'loading':
          return 'bg-gray-200';
        //Botones para volver atras
        case 'gray':
          return 'bg-gray-700 hover:bg-gray-600 focus:bg-gray-600';
        default:
          return 'bg-blue-600 hover:bg-blue-500 focus:bg-blue-500';
      }
    }
  }
}
</script>

<template>
  <button :type="htmlType"
    :class="`inline-flex items-center gap-2 transition px-6 py-2 rounded text-white font-semibold ${colorClasses}`">

    <!-- Agregamos un slot para poder crear botones con iconos -->
    <slot name="icon" />
    <slot />
  </button>
</template>
