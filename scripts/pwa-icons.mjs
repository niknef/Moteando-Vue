// Genera los íconos de la PWA (public/icons/) a partir del logo: solo el pin con la moto,
// sobre el fondo oscuro de la app. Correr con `node scripts/pwa-icons.mjs` si cambia el logo.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { Resvg } from '@resvg/resvg-js'

const BG = '#1c1c1c'
const logo = readFileSync(new URL('../src/assets/moteando.svg', import.meta.url), 'utf8')

// El pin ocupa x 38–205, y 40–225 del viewBox del logo; la palabra empieza en x ≈ 215
const CX = 121
const CY = 133

function icon(half, size) {
  const svg = logo
    .replace(/viewBox="[^"]*"/, `viewBox="${CX - half} ${CY - half} ${half * 2} ${half * 2}"`)
    // tapa la palabra "Moteando" que queda a la derecha del pin
    .replace('</svg>', `<rect x="212" y="-500" width="2000" height="2000" fill="${BG}"/></svg>`)
  return new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: BG }).render().asPng()
}

const out = new URL('../public/icons/', import.meta.url)
mkdirSync(out, { recursive: true })
// "any": el pin casi llega al borde; "maskable": deja el 20 % de margen que recorta Android
writeFileSync(new URL('icon-192.png', out), icon(118, 192))
writeFileSync(new URL('icon-512.png', out), icon(118, 512))
writeFileSync(new URL('maskable-512.png', out), icon(150, 512))
writeFileSync(new URL('apple-touch-icon.png', out), icon(130, 180))
console.log('Íconos generados en public/icons/')
