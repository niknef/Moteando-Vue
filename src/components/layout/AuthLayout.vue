<script setup>
import IconLucide from '@/components/ui/IconLucide.vue'
import Logo from '@/assets/moteando.svg'

// Marco de ingresar, registro y recuperar contraseña. En el celular, una columna con el logo
// arriba; en escritorio, el panel de la marca a la izquierda y el formulario a la derecha.

const FEATURES = [
  { icon: 'Spline', text: 'Rutas con curvas, altura y ripio a la vista' },
  { icon: 'Share2', text: 'Al navegador de cada uno: Google Maps o GPX' },
  { icon: 'Users', text: 'Rodadas: mandás el link y cada uno toca "Voy"' },
]

// Un camino de montaña dibujado a mano para el panel (decorativo)
const ROAD =
  'M40 420 C 110 400, 120 330, 190 320 S 260 380, 320 330 S 340 230, 400 220 S 470 260, 520 200 S 540 110, 600 90'
</script>

<template>
  <div class="min-h-dvh bg-background lg:grid lg:grid-cols-[1.1fr_1fr]">
    <!-- Panel de la marca: solo escritorio -->
    <aside
      class="hidden overflow-hidden border-r border-border bg-surface-deep lg:flex lg:h-dvh lg:flex-col lg:p-12 lg:sticky lg:top-0"
    >
      <img :src="Logo" alt="Moteando" class="h-10 w-auto self-start" />

      <svg
        viewBox="0 0 640 480"
        class="my-8 min-h-0 w-full flex-1"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <pattern id="auth-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" class="stroke-border" stroke-width="1" />
          </pattern>
        </defs>
        <rect width="640" height="480" fill="url(#auth-grid)" opacity="0.35" />
        <path :d="ROAD" fill="none" class="stroke-surface-deep" stroke-width="18" />
        <path
          :d="ROAD"
          fill="none"
          class="stroke-primary"
          stroke-width="8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          cx="40"
          cy="420"
          r="13"
          class="fill-brand-teal stroke-surface-deep"
          stroke-width="5"
        />
        <circle cx="600" cy="90" r="13" class="fill-primary stroke-surface-deep" stroke-width="5" />
      </svg>

      <div class="max-w-md">
        <h2 class="text-4xl leading-tight font-semibold tracking-tight">
          Armá la ruta.<br />Compartila.<br /><span class="text-primary">Salí a rodar.</span>
        </h2>
        <ul class="mt-8 space-y-3">
          <li
            v-for="f in FEATURES"
            :key="f.text"
            class="flex items-center gap-3 text-muted-foreground"
          >
            <span class="grid size-9 shrink-0 place-items-center rounded-full bg-card">
              <IconLucide :name="f.icon" :size="18" class="text-primary" />
            </span>
            {{ f.text }}
          </li>
        </ul>
      </div>
    </aside>

    <!-- Formulario -->
    <main class="flex min-h-dvh flex-col px-6 pt-20 pb-10 lg:justify-center lg:px-12 lg:py-12">
      <div class="mx-auto flex w-full max-w-sm flex-col">
        <img :src="Logo" alt="Moteando" class="h-12 w-auto self-center lg:hidden" />
        <slot />
      </div>
    </main>
  </div>
</template>
