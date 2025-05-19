<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseButtonOutline from '@/components/ui/BaseButtonOutline.vue'

export default {
  name: 'Home',
  components: { 
    BaseHeading1,
    BaseButton,
    BaseButtonOutline
  }
}
</script>

<template>
  <section class="relative text-center py-20 px-4 overflow-hidden rounded-xl shadow-lg mt-6 max-w-5xl mx-auto">

    <!-- Imagen de fondo -->
    <img
      src="@/assets/ruta-motos-banner.jpg"
      alt="Ruta motera"
      class="absolute inset-0 w-full h-full object-cover opacity-40"
    />

    <!-- Capa oscura -->
    <div class="absolute inset-0 bg-black opacity-50"></div>

    <!-- Contenido -->
    <div class="relative z-10">
      <BaseHeading1>Moteando: Motos, amigos y aventuras</BaseHeading1>
      <p class="max-w-2xl mx-auto text-gray-300 text-lg mb-6 ">
        Unite a la comunidad motera donde podés compartir rutas, experiencias, y conectarte con otros fanáticos de las dos ruedas.
      </p>
      <div class="flex flex-col sm:flex-row justify-center gap-4">

        <router-link to="/register">
            <BaseButton type="orange">
                Crear cuenta
            </BaseButton>
        </router-link>
        <router-link to="/login">
            <BaseButtonOutline type="orange">
                Iniciar sesión
            </BaseButtonOutline>
        </router-link>
      </div>
    </div>
  </section>
</template>

