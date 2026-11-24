// Imagen de la vista previa (1200×630) para /r/:id y /s/:id: nombre, datos y el dibujo del
// recorrido. GET /api/og?r=<id> o /api/og?s=<id>; sin id (o si no es pública), la genérica.
import { readFileSync } from 'node:fs'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { loadShare } from './_lib/share-data.js'

const W = 1200
const H = 630
const C = {
  bg: '#1c1c1c',
  panel: '#121212',
  fg: '#f5f5f5',
  muted: '#9a9a9a',
  primary: '#e86e1b',
  teal: '#40777a',
  border: '#333333',
}

// Archivo, la fuente de la app (satori lee woff, no woff2)
const font = (weight) =>
  readFileSync(
    new URL(
      `../node_modules/@fontsource/archivo/files/archivo-latin-${weight}-normal.woff`,
      import.meta.url,
    ),
  )
const FONTS = [
  { name: 'Archivo', data: font(400), weight: 400, style: 'normal' },
  { name: 'Archivo', data: font(700), weight: 700, style: 'normal' },
]

const logo = `data:image/svg+xml;base64,${readFileSync(
  new URL('../src/assets/moteando.svg', import.meta.url),
).toString('base64')}`

// Elemento al estilo React, sin JSX
const h = (type, style, ...children) => ({
  type,
  props: { style: { display: 'flex', ...style }, children: children.flat().filter(Boolean) },
})

// El recorrido como path dentro de un cuadro de `size` px (misma proyección que RoutePreview)
function routeSvg(geometry, size) {
  const coords = geometry?.coordinates ?? []
  if (coords.length < 2) return null
  const step = Math.ceil(coords.length / 400)
  const pts0 = coords.filter((_, i) => i % step === 0 || i === coords.length - 1)
  const midLat = (pts0.reduce((s, c) => s + c[1], 0) / pts0.length) * (Math.PI / 180)
  const pts = pts0.map(([lng, lat]) => [lng * Math.cos(midLat), -lat])
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const pad = 48
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1
  const scale = (size - pad * 2) / span
  const offX = (size - (Math.max(...xs) - minX) * scale) / 2
  const offY = (size - (Math.max(...ys) - minY) * scale) / 2
  const xy = pts.map(([x, y]) => [(x - minX) * scale + offX, (y - minY) * scale + offY])
  const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [sx, sy] = xy[0]
  const [ex, ey] = xy[xy.length - 1]
  const line = (stroke, width) => ({
    type: 'path',
    props: {
      d,
      fill: 'none',
      stroke,
      'stroke-width': width,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
  })
  const dot = (cx, cy, fill) => ({
    type: 'circle',
    props: { cx, cy, r: 14, fill, stroke: C.panel, 'stroke-width': 5 },
  })
  return {
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      children: [
        line(C.panel, 16),
        line(C.primary, 9),
        dot(ex, ey, C.primary),
        dot(sx, sy, C.teal),
      ],
    },
  }
}

function card(data) {
  const left = h(
    'div',
    {
      flexDirection: 'column',
      flex: 1,
      padding: '56px 48px 56px 64px',
      justifyContent: 'space-between',
    },
    { type: 'img', props: { src: logo, width: 300, height: 86 } },
    h(
      'div',
      { flexDirection: 'column' },
      h(
        'div',
        { fontSize: 26, color: C.primary, textTransform: 'uppercase', letterSpacing: 3 },
        data?.label ?? 'Rutas en moto',
      ),
      h(
        'div',
        {
          fontSize: data?.headline?.length > 32 ? 52 : 64,
          fontWeight: 700,
          color: C.fg,
          marginTop: 12,
          lineHeight: 1.08,
        },
        data?.headline ?? 'Armá la ruta, compartila y salí a rodar',
      ),
      h(
        'div',
        { fontSize: 30, color: C.muted, marginTop: 18 },
        data?.subline ?? 'Google Maps · GPX · Rodadas',
      ),
    ),
    h(
      'div',
      { flexWrap: 'wrap', gap: 12 },
      (data?.chips ?? []).map((text) =>
        h(
          'div',
          {
            fontSize: 24,
            color: C.fg,
            border: `2px solid ${C.border}`,
            borderRadius: 999,
            padding: '8px 20px',
          },
          text.length > 34 ? `${text.slice(0, 33)}…` : text,
        ),
      ),
    ),
  )
  const drawing = data ? routeSvg(data.geometry, 520) : null
  return h(
    'div',
    { width: W, height: H, backgroundColor: C.bg, fontFamily: 'Archivo' },
    left,
    drawing &&
      h(
        'div',
        { width: 520, height: 520, margin: 55, borderRadius: 32, backgroundColor: C.panel },
        drawing,
      ),
  )
}

export async function GET(request) {
  const params = new URL(request.url).searchParams
  const kind = params.has('s') ? 's' : 'r'
  const data = await loadShare(kind, params.get(kind)).catch(() => null)

  const svg = await satori(card(data), { width: W, height: H, fonts: FONTS })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng()

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
