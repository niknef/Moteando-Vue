<script setup>
import { computed, ref } from 'vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import { formatKm } from '@/lib/format'
import { curvinessOf, elevationProfile } from '@/lib/route-stats'

// Curvas, desnivel, ripio y perfil de altura de una ruta (diseñador y páginas públicas).
// Sin `stats` (rutas guardadas antes de calcularlos) no muestra nada.

const props = defineProps({
  stats: { type: Object, default: null },
  // LineString con altura ([lng, lat, ele]) para el perfil
  geometry: { type: Object, default: null },
  chart: { type: Boolean, default: true },
  chips: { type: Boolean, default: true },
})

const W = 320
const H = 72
const PAD_TOP = 6

const has = computed(() => !!props.stats && Object.keys(props.stats).length > 0)
const curves = computed(() => curvinessOf(props.stats?.curvature))
const meters = (m) => `${Math.round(m).toLocaleString('es-AR')} m`

const profile = computed(() => (props.chart ? elevationProfile(props.geometry?.coordinates) : []))

const shape = computed(() => {
  const pts = profile.value
  if (pts.length < 2) return null
  const total = pts[pts.length - 1].km || 1
  const eles = pts.map((p) => p.ele)
  const min = Math.min(...eles)
  const max = Math.max(...eles)
  // una llanura se tiene que ver plana: la escala mínima es de 300 m
  const span = Math.max(max - min, 300)
  const x = (km) => (km / total) * W
  const y = (ele) => PAD_TOP + (1 - (ele - min) / span) * (H - PAD_TOP)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.km).toFixed(1)} ${y(p.ele).toFixed(1)}`)
  return {
    line: line.join(' '),
    area: `${line.join(' ')} L${W} ${H} L0 ${H} Z`,
    min,
    max,
    total,
    x,
    y,
  }
})

/* ───────── Leer la altura al pasar el dedo ───────── */
const cursor = ref(null) // { km, ele, x, y }

function onPointer(e) {
  const s = shape.value
  if (!s) return
  const rect = e.currentTarget.getBoundingClientRect()
  const km = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1) * s.total
  // el punto del perfil más cercano a ese km
  const p = profile.value.reduce((best, q) =>
    Math.abs(q.km - km) < Math.abs(best.km - km) ? q : best,
  )
  cursor.value = { km: p.km, ele: p.ele, x: s.x(p.km), y: s.y(p.ele) }
}

const ariaLabel = computed(() => {
  const s = shape.value
  if (!s) return ''
  return `Perfil de altura: de ${meters(s.min)} a ${meters(s.max)} en ${formatKm(Math.round(s.total * 10) / 10)}`
})
</script>

<template>
  <div v-if="has" class="space-y-2">
    <ul v-if="chips" class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <li
        v-if="curves"
        class="flex items-center gap-1.5"
        :class="{ 'text-foreground': curves.level > 1 }"
      >
        <IconLucide name="Spline" :size="15" :class="curves.level > 1 ? 'text-primary' : ''" />
        {{ curves.label }}
      </li>
      <li v-if="stats.ascentM != null" class="flex items-center gap-1.5">
        <IconLucide name="TrendingUp" :size="15" />
        <span><span class="sr-only">Sube </span>{{ meters(stats.ascentM) }}</span>
      </li>
      <li v-if="stats.descentM != null" class="flex items-center gap-1.5">
        <IconLucide name="TrendingDown" :size="15" />
        <span><span class="sr-only">Baja </span>{{ meters(stats.descentM) }}</span>
      </li>
      <li v-if="stats.unpavedKm >= 0.5" class="flex items-center gap-1.5 text-unpaved">
        <span class="h-0.5 w-4 border-t-[3px] border-dotted border-current" aria-hidden="true" />
        {{ formatKm(stats.unpavedKm) }} de ripio o tierra
      </li>
      <li v-else class="flex items-center gap-1.5">Todo asfaltado</li>
    </ul>

    <figure v-if="shape" class="relative select-none">
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        class="h-18 w-full touch-none overflow-visible"
        role="img"
        :aria-label="ariaLabel"
        @pointermove="onPointer"
        @pointerdown="onPointer"
        @pointerleave="cursor = null"
      >
        <path :d="shape.area" class="fill-primary/15" />
        <path
          :d="shape.line"
          class="fill-none stroke-primary"
          stroke-width="1.5"
          vector-effect="non-scaling-stroke"
        />
        <template v-if="cursor">
          <line
            :x1="cursor.x"
            :x2="cursor.x"
            y1="0"
            :y2="H"
            class="stroke-muted-foreground"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        </template>
      </svg>
      <figcaption class="mt-1 flex justify-between text-xs text-muted-foreground tabular-nums">
        <span v-if="cursor" class="text-foreground">
          km {{ cursor.km.toLocaleString('es-AR', { maximumFractionDigits: 1 }) }} ·
          {{ meters(cursor.ele) }}
        </span>
        <span v-else>{{ meters(shape.min) }} – {{ meters(shape.max) }} de altura</span>
        <span>{{ formatKm(Math.round(shape.total * 10) / 10) }}</span>
      </figcaption>
    </figure>
  </div>
</template>
