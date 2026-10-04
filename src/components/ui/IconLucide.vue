<script setup>
import { computed, useAttrs } from 'vue'
import * as lucide from 'lucide-vue-next'

const props = defineProps({
  name:  String,
  size:  { type: [Number, String], default: 24 },
  active:Boolean
})

const attrs = useAttrs()                       // clases externas
const IconComp = computed(() => lucide[props.name])
</script>

<template>
  <component
    :is="IconComp"
    :size="props.size"
    stroke-width="1.5"
    :class="[
      props.active ? 'text-orange-400' : 'text-white',  // color base
      attrs.class                                         // permite hover override
    ]"
  />
</template>
