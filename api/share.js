// HTML con etiquetas Open Graph para los bots de vista previa (WhatsApp, Telegram, Facebook…).
// vercel.json manda acá /r/:id y /s/:id solo cuando el user-agent es de un bot: las personas
// siguen recibiendo la app.
import { loadShare } from './_lib/share-data.js'

const esc = (text = '') =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const cut = (text, max) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

export async function GET(request) {
  const url = new URL(request.url)
  const kind = url.searchParams.get('kind') === 's' ? 's' : 'r'
  const id = url.searchParams.get('id') ?? ''
  const data = await loadShare(kind, id).catch(() => null)

  const origin = `https://${request.headers.get('x-forwarded-host') ?? url.host}`
  const pageUrl = `${origin}/${kind}/${encodeURIComponent(id)}`
  const title = cut(data?.title ?? 'Moteando · Rutas en moto', 90)
  const description = cut(
    data?.description ?? 'Armá tu ruta, compartila al navegador de cada uno y organizá la rodada.',
    200,
  )
  const image = data
    ? `${origin}/api/og?${kind}=${encodeURIComponent(id)}&v=${data.version}`
    : `${origin}/api/og`

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Moteando">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${esc(pageUrl)}">
</head>
<body><a href="${esc(pageUrl)}">${esc(title)}</a></body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  })
}
