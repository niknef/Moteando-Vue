<template>
  <span class="loader" :class="sizeClass" />
</template>

<script>
export default {
  name: 'Loader',
  props: {
    size: {
      type: String,
      default: 'md', // sm, md, lg
    }
  },
  computed: {
    sizeClass() {
      switch (this.size) {
        case 'sm':
          return 'w-4 h-4 border-2';
        case 'lg':
          return 'w-10 h-10 border-4';
        default:
          return 'w-6 h-6 border-4';
      }
    }
  }
}
</script>

<style scoped>
.loader {
  display: inline-block;
  border: 4px solid rgb(255, 17, 0);
  border-radius: 50%;
  border-top-color: transparent;
  border-bottom-color: transparent;
  animation: rot5 1s infinite;
}

@keyframes rot5 {
  0% {
    transform: rotate(0);
  }

  50% {
    transform: rotate(180deg);
    border-top-color: rgb(139, 46, 46);
    border-bottom-color: rgb(243, 92, 33);
    border-right-color: transparent;
    border-left-color: transparent;
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
