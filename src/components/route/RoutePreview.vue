<script setup>
import { computed } from 'vue'

// Dibujo liviano del recorrido (SVG, sin mapa) para listados.

const props = defineProps({
  // GeoJSON LineString: { coordinates: [[lng, lat], ...] }
  geometry: { type: Object, required: true },
})

const SIZE = 100
const PAD = 10
const MAX_POINTS = 120

const shape = computed(() => {
  const coords = props.geometry?.coordinates ?? []
  if (coords.length < 2) return null

  // menos puntos alcanzan para un dibujo chico
  const step = Math.ceil(coords.length / MAX_POINTS)
  const sampled = coords.filter((_, i) => i % step === 0 || i === coords.length - 1)

  // proyección simple: corrige el ancho por la latitud para que no se deforme
  const midLat = (sampled.reduce((sum, c) => sum + c[1], 0) / sampled.length) * (Math.PI / 180)
  const pts = sampled.map(([lng, lat]) => [lng * Math.cos(midLat), -lat])

  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1
  const scale = (SIZE - PAD * 2) / span
  // centrado en el cuadro
  const offX = (SIZE - (Math.max(...xs) - minX) * scale) / 2
  const offY = (SIZE - (Math.max(...ys) - minY) * scale) / 2

  const xy = pts.map(([x, y]) => [(x - minX) * scale + offX, (y - minY) * scale + offY])
  return {
    path: xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '),
    start: xy[0],
    end: xy[xy.length - 1],
  }
})
</script>

<template>
  <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="bg-surface-deep" aria-hidden="true">
    <template v-if="shape">
      <path
        :d="shape.path"
        fill="none"
        class="stroke-primary"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle :cx="shape.start[0]" :cy="shape.start[1]" r="4" class="fill-brand-teal" />
      <circle :cx="shape.end[0]" :cy="shape.end[1]" r="4" class="fill-primary" />
    </template>
  </svg>
</template>
