<script setup>
import { computed } from 'vue'

// Fotos de una salida: carrusel deslizable (con imán) y contador. Los posts viejos solo
// tienen image_url, por eso se usa como respaldo.

const props = defineProps({
  photos: { type: Array, default: () => [] },
  imageUrl: { type: [String, null], default: '' },
  alt: { type: String, default: 'Foto de la salida' },
})

const list = computed(() =>
  props.photos?.length ? props.photos : [props.imageUrl].filter(Boolean),
)
</script>

<template>
  <div v-if="list.length" class="relative">
    <div
      class="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-xl [scrollbar-width:none]"
      :aria-label="list.length > 1 ? `${list.length} fotos, deslizá para ver` : undefined"
    >
      <img
        v-for="(src, i) in list"
        :key="src"
        :src="src"
        :alt="`${alt} ${list.length > 1 ? i + 1 : ''}`"
        loading="lazy"
        class="aspect-[4/3] w-full shrink-0 snap-center rounded-xl object-cover"
        :class="{ 'w-[88%]': list.length > 1 }"
      />
    </div>
    <span
      v-if="list.length > 1"
      class="absolute top-2 right-2 rounded-full bg-background/80 px-2 py-0.5 text-xs"
    >
      {{ list.length }} fotos
    </span>
  </div>
</template>
