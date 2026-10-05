<script setup>
import { computed } from 'vue'
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
})

const IconComp = computed(() => {
  const icon = icons[props.name]
  if (!icon) console.warn(`[IconLucide] Ícono "${props.name}" no registrado en IconLucide.vue`)
  return icon
})
</script>

<!-- Sin color propio: usa currentColor y hereda el del texto que lo rodea.
     Para cambiarlo, pasale una clase (text-primary, group-hover:text-primary…). -->
<template>
  <component :is="IconComp" :size="props.size" stroke-width="1.5" />
</template>
