<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouteDraftStore } from '@/stores/routeDraft'
import { saveRoute, updateRoute } from '@/services/routes'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Pide nombre, descripción y visibilidad, y guarda (o actualiza) la ruta del borrador.

const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['saved'])

const draft = useRouteDraftStore()
const { routeId, name, description, isPublic } = storeToRefs(draft)

const saving = ref(false)
const error = ref('')
const isEditing = computed(() => !!routeId.value)
const nameLength = computed(() => name.value.trim().length)

watch(open, (isOpen) => {
  if (isOpen) error.value = ''
})

async function submit() {
  error.value = ''
  if (nameLength.value === 0) {
    error.value = 'Ponele un nombre a la ruta'
    return
  }

  saving.value = true
  const created = !isEditing.value
  try {
    const row = draft.toRow()
    const saved = created ? await saveRoute(row) : await updateRoute(routeId.value, row)
    routeId.value = saved.id
    open.value = false
    emit('saved', { row: saved, created })
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <form class="grid gap-4" @submit.prevent="submit">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Guardar cambios' : 'Guardar ruta' }}</DialogTitle>
          <DialogDescription>Después la encontrás en Mis rutas.</DialogDescription>
        </DialogHeader>

        <div class="grid gap-2">
          <div class="flex items-baseline justify-between">
            <Label for="route-name">Nombre</Label>
            <span class="text-xs text-muted-foreground">{{ nameLength }}/80</span>
          </div>
          <Input
            id="route-name"
            v-model="name"
            maxlength="80"
            placeholder="Ej.: Escapada a San Antonio de Areco"
            autocomplete="off"
            required
          />
        </div>

        <div class="grid gap-2">
          <Label for="route-description">Descripción (opcional)</Label>
          <Textarea
            id="route-description"
            v-model="description"
            rows="3"
            placeholder="Qué tiene de lindo, dónde parar, cuándo conviene ir…"
          />
        </div>

        <label class="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
          <span>
            <span class="block text-sm font-medium">Ruta pública</span>
            <span class="block text-xs text-muted-foreground">
              Cualquiera con el link la puede ver. Si no, solo vos.
            </span>
          </span>
          <Switch v-model="isPublic" />
        </label>

        <BaseAlert :message="error" type="error" />

        <DialogFooter>
          <Button type="button" variant="ghost" size="lg" @click="open = false">Cancelar</Button>
          <Button type="submit" size="lg" :disabled="saving">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
