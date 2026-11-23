<script setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import IconLucide from '@/components/ui/IconLucide.vue'

defineOptions({
  inheritAttrs: false, // Evita que los atributos se propaguen al componente raíz
})

const model = defineModel({
  type: String,
}) // Define un modelo para el valor del input
const visible = ref(false) // Estado para controlar la visibilidad de la contraseña
</script>

<template>
  <div class="relative">
    <Input v-bind="$attrs" v-model="model" :type="visible ? 'text' : 'password'" class="pr-12" />
    <button
      type="button"
      :aria-pressed="visible"
      class="absolute right-1 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center text-muted-foreground hover:text-foreground"
      :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
      @click="visible = !visible"
    >
      <IconLucide :name="visible ? 'EyeOff' : 'Eye'" :size="20" />
    </button>
  </div>
</template>
