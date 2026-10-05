<script setup>
import { computed, useAttrs } from 'vue'
import {
  ArrowLeft,
  Bike,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FilePlus,
  Heart,
  Image,
  Info,
  LogIn,
  MapPin,
  MapPinned,
  MessageCircle,
  Newspaper,
  PencilLine,
  Plus,
  Route,
  Save,
  Star,
  Trash2,
  UserCircle,
  UserPlus,
  Warehouse,
} from '@lucide/vue'

// Solo se registran los íconos que usa la app: importar toda la librería
// sumaba ~800 KB al bundle. Para usar uno nuevo, agregarlo acá.
const icons = {
  ArrowLeft,
  Bike,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  FilePlus,
  Heart,
  Image,
  Info,
  LogIn,
  MapPin,
  MapPinned,
  MessageCircle,
  Newspaper,
  PencilLine,
  Plus,
  Route,
  Save,
  Star,
  Trash2,
  UserCircle,
  UserPlus,
  Warehouse,
}

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 },
  active: Boolean,
})

const attrs = useAttrs() // clases externas
const IconComp = computed(() => {
  const icon = icons[props.name]
  if (!icon) console.warn(`[IconLucide] Ícono "${props.name}" no registrado en IconLucide.vue`)
  return icon
})
</script>

<template>
  <component
    :is="IconComp"
    :size="props.size"
    stroke-width="1.5"
    :class="[
      props.active ? 'text-orange-400' : 'text-white', // color base
      attrs.class, // permite hover override
    ]"
  />
</template>
