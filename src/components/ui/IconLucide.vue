<script setup>
import { computed } from 'vue'
import * as lucide from 'lucide-vue-next'
const props = defineProps({ name: String, size: { type: [Number,String], default: 24 }, active: Boolean })
const IconComp = computed(() => lucide[props.name])
</script>

<template>
  <component :is="IconComp" :size="props.size" stroke-width="1.5"
             :class="active ? 'text-orange-400' : 'text-gray-400'" />
</template>