<script setup>
import { computed, ref, watch } from 'vue'

// Avatar redondo: la foto si hay (y carga); si no, las iniciales sobre naranja.

const props = defineProps({
  // { first_name, last_name, avatar_url }
  profile: { type: Object, default: null },
  size: { type: String, default: 'size-10 text-sm' },
})

const failed = ref(false)
watch(
  () => props.profile?.avatar_url,
  () => (failed.value = false),
)

const initials = computed(
  () =>
    [props.profile?.first_name, props.profile?.last_name]
      .filter(Boolean)
      .map((n) => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || '?',
)
</script>

<template>
  <span
    class="grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground"
    :class="size"
  >
    <img
      v-if="profile?.avatar_url && !failed"
      :src="profile.avatar_url"
      alt=""
      class="size-full object-cover"
      @error="failed = true"
    />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>
