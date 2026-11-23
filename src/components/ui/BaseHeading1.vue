<script>
// Título principal de las pantallas viejas, con la misma voz que las nuevas ("Mis rutas", "Explorar")
export default {
  name: 'BaseHeading1',
}
</script>

<template>
  <h1 class="mb-4 text-2xl font-semibold tracking-tight text-foreground">
    <slot />
  </h1>
</template>
