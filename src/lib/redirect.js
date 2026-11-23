// Adónde volver después de ingresar o registrarse (?redirect=/r/abc).
// Solo rutas internas: "/algo", nunca "//otro-sitio" ni "https://…".
export function safeRedirect(value, fallback = '/rutas/nueva') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback
}
