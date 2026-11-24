<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import { IMAGE_ACCEPT, validateImage } from '@/services/storage'

// Elegir una foto con vista previa: zona grande para tocar (moto) o círculo (avatar).
// v-model es el File elegido; `current` la URL guardada. Valida tipo y tamaño al elegir.

const props = defineProps({
  current: { type: String, default: '' },
  shape: { type: String, default: 'wide' }, // 'wide' | 'round'
  label: { type: String, default: 'Agregar foto' },
  // texto que reemplaza la foto cuando no hay ninguna (iniciales del avatar)
  fallback: { type: String, default: '' },
})
const file = defineModel({ type: [File, null], default: null })
const emit = defineEmits(['error'])

const input = ref(null)
const objectUrl = ref('')

watch(file, (f) => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  objectUrl.value = f ? URL.createObjectURL(f) : ''
})
onBeforeUnmount(() => objectUrl.value && URL.revokeObjectURL(objectUrl.value))

const src = computed(() => objectUrl.value || props.current)

function onChange(e) {
  const f = e.target.files?.[0]
  e.target.value = '' // permite volver a elegir el mismo archivo
  if (!f) return
  try {
    validateImage(f)
    emit('error', '')
    file.value = f
  } catch (err) {
    emit('error', err.message)
  }
}

defineExpose({ open: () => input.value?.click() })
</script>

<template>
  <div>
    <input
      ref="input"
      type="file"
      :accept="IMAGE_ACCEPT"
      class="sr-only"
      tabindex="-1"
      @change="onChange"
    />

    <!-- Moto: 16:10, toda la zona se toca -->
    <button
      v-if="shape === 'wide'"
      type="button"
      class="group relative grid aspect-[16/10] w-full place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted transition-colors hover:border-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      :class="{ 'border-solid': src }"
      :aria-label="src ? 'Cambiar foto' : label"
      @click="input.click()"
    >
      <img v-if="src" :src="src" alt="" class="absolute inset-0 size-full object-cover" />
      <span
        v-if="src"
        class="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-sm font-medium backdrop-blur"
      >
        <IconLucide name="Camera" :size="16" />
        Cambiar foto
      </span>
      <span v-else class="flex flex-col items-center gap-2 text-muted-foreground">
        <span class="grid size-12 place-items-center rounded-full bg-card">
          <IconLucide name="Camera" :size="22" class="text-primary" />
        </span>
        <span class="text-sm font-medium text-foreground">{{ label }}</span>
        <span class="text-xs">JPG, PNG o WebP · hasta 1 MB</span>
      </span>
    </button>

    <!-- Avatar: círculo con el botón de cámara encima -->
    <button
      v-else
      type="button"
      class="relative mx-auto block size-28 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      :aria-label="src ? 'Cambiar foto de perfil' : label"
      @click="input.click()"
    >
      <img v-if="src" :src="src" alt="" class="size-full rounded-full object-cover" />
      <span
        v-else
        class="grid size-full place-items-center rounded-full bg-primary text-3xl font-semibold text-primary-foreground"
        >{{ fallback || '?' }}</span
      >
      <span
        class="absolute right-0 bottom-0 grid size-9 place-items-center rounded-full border-2 border-background bg-card"
      >
        <IconLucide name="Camera" :size="16" />
      </span>
    </button>
  </div>
</template>
