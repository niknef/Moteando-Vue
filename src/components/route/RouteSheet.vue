<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouteDraftStore } from '@/stores/routeDraft'
import { useGeocoding } from '@/composables/useGeocoding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import IconLucide from '@/components/ui/IconLucide.vue'

// Panel del diseñador de rutas: hoja inferior en mobile, columna flotante en desktop.

const props = defineProps({
  // Devuelve { lng, lat } para priorizar resultados de búsqueda cerca (centro del mapa)
  near: { type: Function, default: () => null },
})
const emit = defineEmits(['place-added', 'publish'])
const expanded = defineModel('expanded', { type: Boolean, default: false })

const draft = useRouteDraftStore()
const { waypoints, result, loading, error, avoid, preference, isEmpty, isFull } = storeToRefs(draft)

/* ───────── Resumen ───────── */
function formatDuration(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

const summary = computed(() => {
  if (result.value) {
    const km = result.value.distanceKm.toLocaleString('es-AR')
    return `${km} km · ${formatDuration(result.value.durationMin)}`
  }
  if (loading.value) return 'Calculando ruta…'
  if (isEmpty.value) return 'Tocá el mapa o buscá un lugar'
  if (waypoints.value.length === 1) return 'Agregá el destino'
  return error.value ? 'No se pudo trazar la ruta' : 'Sin ruta'
})

const stopsText = computed(() => {
  const stops = Math.max(waypoints.value.length - 2, 0)
  if (waypoints.value.length < 2) return 'El primer punto es la salida; el último, la llegada'
  if (stops === 0) return 'Sin paradas intermedias'
  return stops === 1 ? '1 parada' : `${stops} paradas`
})

/* ───────── Puntos ───────── */
function roleOf(index) {
  if (index === 0) return 'Salida'
  if (index === waypoints.value.length - 1) return 'Llegada'
  return `Parada ${index}`
}

function badgeOf(index) {
  if (index === 0) return 'A'
  if (index === waypoints.value.length - 1) return 'B'
  return String(index)
}

/* ───────── Búsqueda ───────── */
const query = ref('')
const searchError = ref('')
const { results, search, clear } = useGeocoding()

function onSearchInput() {
  searchError.value = ''
  search(query.value, props.near())
}

function addPlace(place) {
  try {
    draft.addWaypoint({ lng: place.lng, lat: place.lat, label: place.label })
    emit('place-added', place)
    query.value = ''
    clear()
  } catch (e) {
    searchError.value = e.message
  }
}

/* ───────── Opciones ───────── */
const avoidHighways = computed({
  get: () => avoid.value.includes('highways'),
  set: (on) => draft.setAvoid('highways', on),
})
const avoidTolls = computed({
  get: () => avoid.value.includes('tollways'),
  set: (on) => draft.setAvoid('tollways', on),
})

function clearDraft() {
  if (window.confirm('¿Vaciar la ruta? Se borran todos los puntos.')) draft.reset()
}

/* ───────── Arrastre de la manija (mobile) ───────── */
let startY = null

function onHandleDown(e) {
  startY = e.clientY
  e.currentTarget.setPointerCapture(e.pointerId)
}

function onHandleUp(e) {
  if (startY === null) return
  const dy = e.clientY - startY
  startY = null
  // un toque alterna; un arrastre decide por la dirección
  expanded.value = Math.abs(dy) < 8 ? !expanded.value : dy < 0
}
</script>

<template>
  <section
    class="absolute inset-x-0 bottom-0 z-10 flex max-h-[75%] flex-col rounded-t-2xl border-t border-border bg-card text-card-foreground shadow-2xl lg:inset-y-4 lg:right-auto lg:left-4 lg:max-h-none lg:w-96 lg:rounded-2xl lg:border"
    aria-label="Panel de la ruta"
  >
    <!-- Manija: solo mobile -->
    <button
      type="button"
      class="flex w-full shrink-0 touch-none justify-center pt-2 pb-1 lg:hidden"
      :aria-label="expanded ? 'Achicar panel' : 'Agrandar panel'"
      :aria-expanded="expanded"
      @pointerdown="onHandleDown"
      @pointerup="onHandleUp"
    >
      <span class="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
    </button>

    <!-- Resumen -->
    <div class="shrink-0 px-4 pt-1 pb-3 lg:pt-4">
      <p class="text-2xl font-semibold tracking-tight" aria-live="polite">{{ summary }}</p>
      <p class="mt-0.5 text-sm text-muted-foreground">{{ stopsText }}</p>
    </div>

    <!-- Opciones rápidas: mobile con el panel chico -->
    <div v-if="!expanded" class="flex shrink-0 flex-wrap gap-x-5 gap-y-2 px-4 pb-3 lg:hidden">
      <label class="flex items-center gap-2 text-sm">
        <Switch v-model="avoidHighways" />
        Evitar autopistas
      </label>
      <label class="flex items-center gap-2 text-sm">
        <Switch v-model="avoidTolls" />
        Evitar peajes
      </label>
    </div>

    <!-- Cuerpo: en mobile solo con el panel grande; en desktop siempre -->
    <div
      class="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4"
      :class="expanded ? '' : 'hidden lg:block'"
    >
      <!-- Buscar -->
      <div>
        <div class="relative">
          <IconLucide
            name="Search"
            :size="16"
            class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="query"
            type="search"
            class="h-10 pl-9"
            :placeholder="isFull ? 'Llegaste al máximo de puntos' : 'Buscá un lugar o tocá el mapa'"
            :disabled="isFull"
            aria-label="Buscar un lugar para agregar"
            @input="onSearchInput"
          />
        </div>
        <ul
          v-if="results.length"
          class="mt-2 overflow-hidden rounded-lg border border-border bg-popover"
          role="listbox"
        >
          <li v-for="place in results" :key="place.id">
            <button
              type="button"
              class="w-full px-3 py-2 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              @click="addPlace(place)"
            >
              <span class="block text-sm">{{ place.label }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{ place.detail }}</span>
            </button>
          </li>
        </ul>
        <p v-if="searchError" class="mt-2 text-sm text-destructive">{{ searchError }}</p>
      </div>

      <!-- Puntos -->
      <div v-if="waypoints.length">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-sm font-medium text-muted-foreground">Recorrido</h2>
          <Button
            v-if="waypoints.length > 1"
            variant="ghost"
            size="sm"
            @click="draft.reverseWaypoints()"
          >
            <IconLucide name="ArrowDownUp" :size="14" />
            Invertir
          </Button>
        </div>

        <ol class="relative space-y-1">
          <li
            v-for="(wp, i) in waypoints"
            :key="wp.id"
            class="relative flex items-center gap-3 rounded-lg py-1.5 pr-1"
          >
            <!-- línea de la línea de tiempo -->
            <span
              v-if="i < waypoints.length - 1"
              class="absolute top-8 bottom-[-0.75rem] left-[0.9375rem] w-px bg-border"
              aria-hidden="true"
            />
            <span
              class="relative grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold"
              :class="
                i === 0 ? 'bg-brand-teal text-foreground' : 'bg-primary text-primary-foreground'
              "
              aria-hidden="true"
            >
              {{ badgeOf(i) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm">{{ wp.label || 'Buscando el nombre…' }}</p>
              <p class="text-xs text-muted-foreground">{{ roleOf(i) }}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" :aria-label="`Opciones de ${roleOf(i)}`">
                  <IconLucide name="EllipsisVertical" :size="16" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem :disabled="i === 0" @select="draft.reorderWaypoint(i, i - 1)">
                  <IconLucide name="ArrowUp" :size="16" />
                  Subir
                </DropdownMenuItem>
                <DropdownMenuItem
                  :disabled="i === waypoints.length - 1"
                  @select="draft.reorderWaypoint(i, i + 1)"
                >
                  <IconLucide name="ArrowDown" :size="16" />
                  Bajar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @select="draft.removeWaypoint(wp.id)">
                  <IconLucide name="Trash2" :size="16" />
                  Quitar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ol>
      </div>

      <!-- Opciones -->
      <div class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground">Opciones</h2>
        <label class="flex items-center justify-between gap-3 text-sm">
          Evitar autopistas
          <Switch v-model="avoidHighways" />
        </label>
        <label class="flex items-center justify-between gap-3 text-sm">
          Evitar peajes
          <Switch v-model="avoidTolls" />
        </label>
        <div
          class="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
          role="radiogroup"
          aria-label="Tipo de ruta"
        >
          <button
            v-for="opt in [
              { value: 'fastest', label: 'Más rápida' },
              { value: 'shortest', label: 'Más corta' },
            ]"
            :key="opt.value"
            type="button"
            role="radio"
            :aria-checked="preference === opt.value"
            class="rounded-md py-1.5 text-sm transition-colors"
            :class="
              preference === opt.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            "
            @click="preference = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Pie -->
    <div class="flex shrink-0 gap-2 border-t border-border p-4">
      <Button variant="ghost" size="lg" :disabled="isEmpty" @click="clearDraft">Vaciar</Button>
      <Button class="flex-1" size="lg" :disabled="!result || loading" @click="emit('publish')">
        Publicar en comunidad
      </Button>
    </div>
  </section>
</template>
