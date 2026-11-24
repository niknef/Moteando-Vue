<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createRide } from '@/services/rides'
import { updateRoute } from '@/services/routes'
import { useAuthStore } from '@/stores/auth'

// Organizar una rodada sobre una ruta: fecha, hora, punto de encuentro y notas.
// Al crearla lleva a su página (/s/:id), que es el link para mandar al grupo.

const props = defineProps({
  // { id, name, is_public, user_id, waypoints }
  route: { type: Object, default: null },
})
const open = defineModel('open', { type: Boolean, default: false })

const router = useRouter()
const auth = useAuthStore()

const date = ref('')
const time = ref('08:00')
const meetingPoint = ref('')
const notes = ref('')
const saving = ref(false)
const error = ref('')

const today = new Date().toISOString().slice(0, 10)
const isOwnRoute = computed(() => props.route?.user_id === auth.user?.id)

// Próximo domingo: el día típico de las rodadas
function nextSunday() {
  const d = new Date()
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
  return d.toISOString().slice(0, 10)
}

watch(open, (isOpen) => {
  if (!isOpen || !props.route) return
  error.value = ''
  date.value = nextSunday()
  time.value = '08:00'
  const start = props.route.waypoints?.[0]?.label
  meetingPoint.value = start ? start.slice(0, 120) : ''
  notes.value = ''
})

async function submit() {
  error.value = ''
  const startsAt = new Date(`${date.value}T${time.value}`)
  if (Number.isNaN(startsAt.getTime()) || startsAt < new Date()) {
    error.value = 'Elegí una fecha y hora que todavía no pasaron'
    return
  }
  if (!meetingPoint.value.trim()) {
    error.value = 'Poné dónde se juntan'
    return
  }
  // el link de la rodada muestra la ruta: si es propia y privada, tiene que pasar a pública
  if (!props.route.is_public && isOwnRoute.value) {
    const question = 'Para que el grupo vea la ruta, tiene que ser pública. ¿Hacerla pública?'
    if (!window.confirm(question)) return
  }

  saving.value = true
  try {
    if (!props.route.is_public && isOwnRoute.value) {
      await updateRoute(props.route.id, { is_public: true })
    }
    const p = auth.profile ?? {}
    const organizerName = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Un motero'
    const ride = await createRide({
      routeId: props.route.id,
      organizerName,
      startsAt: startsAt.toISOString(),
      meetingPoint: meetingPoint.value.trim(),
      notes: notes.value.trim(),
    })
    open.value = false
    router.push(`/s/${ride.id}`)
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
      <form v-if="route" class="grid gap-4" @submit.prevent="submit">
        <DialogHeader>
          <DialogTitle>Organizar rodada</DialogTitle>
          <DialogDescription>
            Sobre "{{ route.name }}". Después mandás el link al grupo y cada uno toca "Voy".
          </DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-2">
            <Label for="ride-day">Día</Label>
            <input
              id="ride-day"
              v-model="date"
              type="date"
              :min="today"
              required
              class="h-11 rounded-lg border border-input bg-muted px-3 text-foreground [color-scheme:dark] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div class="grid gap-2">
            <Label for="ride-time">Hora</Label>
            <input
              id="ride-time"
              v-model="time"
              type="time"
              required
              class="h-11 rounded-lg border border-input bg-muted px-3 text-foreground [color-scheme:dark] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="ride-meet">Punto de encuentro</Label>
          <Input
            id="ride-meet"
            v-model="meetingPoint"
            maxlength="120"
            placeholder="Ej.: YPF de Acceso Oeste y Gral. Paz"
            required
          />
        </div>

        <div class="grid gap-2">
          <Label for="ride-notes">Notas (opcional)</Label>
          <Textarea
            id="ride-notes"
            v-model="notes"
            rows="3"
            maxlength="500"
            placeholder="Tanque lleno, ritmo tranquilo, desayuno en Luján…"
          />
        </div>

        <BaseAlert :message="error" type="error" />

        <DialogFooter>
          <Button type="button" variant="ghost" size="lg" @click="open = false">Cancelar</Button>
          <Button type="submit" size="lg" :disabled="saving">
            {{ saving ? 'Creando…' : 'Crear rodada' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
