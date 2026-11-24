<script setup>
import PwaStatus from '@/components/layout/PwaStatus.vue'
</script>

<template>
  <!-- La estructura de cada pantalla la arma AppShell (privadas) o la página misma (ingresar, registro) -->
  <router-view />
  <PwaStatus />
</template>
