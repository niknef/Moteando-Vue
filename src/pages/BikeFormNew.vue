<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/* UI */
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseInput    from '@/components/ui/BaseInput.vue'
import BaseLabel    from '@/components/ui/BaseLabel.vue'
import BaseButton   from '@/components/ui/BaseButton.vue'
import BaseAlert    from '@/components/ui/BaseAlert.vue'
import Loader       from '@/components/ui/Loader.vue'
import IconLucide   from '@/components/ui/IconLucide.vue'

/* servicios */
import { uploadBikePhoto, addBike } from '@/services/bikes'

/* router & helpers */
const router = useRouter()
const goBack = () => router.push('/my-bikes')

/* -------- estado ---------- */
const form    = ref({ brand:'', model:'', year:'', color:'', photoFile:null })
const error   = ref('')          // string vacío = no error
const success = ref(false)
const loading = ref(false)

/* -------- helpers ---------- */
function handleFile (e) {
  form.value.photoFile = e.target.files[0] ?? null
}
function validYear (y) {
  const n  = Number(y)
  const yr = new Date().getFullYear() + 1
  return n >= 1900 && n <= yr
}

/* -------- submit ---------- */
async function handleSubmit () {
  error.value   = ''
  success.value = false

  if (!validYear(form.value.year)) {
    error.value = 'Año inválido (1900-hoy).'
    return
  }
  if (!form.value.photoFile) {
    error.value = 'Debes subir una foto de la moto.'
    return
  }

  loading.value = true
  try {
    const photoUrl = await uploadBikePhoto(form.value.photoFile)

    await addBike({
      brand     : form.value.brand.trim(),
      model     : form.value.model.trim(),
      year      : +form.value.year,
      color     : form.value.color.trim(),
      photo_url : photoUrl,
      is_active : false
    })

    /* mostrar alerta y redirigir tras 1 s */
    success.value = true
    setTimeout(() => router.push('/my-bikes'), 1000)
  } catch (e) {
    error.value = e.message || 'Error inesperado'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section
    class="max-w-lg mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md mb-6">
    <BaseHeading1>Agregar moto</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <!-- Marca / Modelo -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <BaseLabel for="brand">Marca</BaseLabel>
          <BaseInput id="brand" v-model="form.brand" placeholder="Ej.: Honda" required />
        </div>
        <div class="flex-1">
          <BaseLabel for="model">Modelo</BaseLabel>
          <BaseInput id="model" v-model="form.model" placeholder="Ej.: CB500X" required />
        </div>
      </div>

      <!-- Año / Color -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <BaseLabel for="year">Año</BaseLabel>
          <BaseInput id="year" v-model="form.year" type="number" placeholder="2024" required />
        </div>
        <div class="flex-1">
          <BaseLabel for="color">Color</BaseLabel>
          <BaseInput id="color" v-model="form.color" placeholder="Rojo" required />
        </div>
      </div>

      <!-- Foto -->
      <div>
        <BaseLabel>Foto</BaseLabel>
        <input
          type="file" accept="image/*" @change="handleFile"
          class="mt-1 block w-full file:mr-3 file:px-4 file:py-2 file:border-0
                 file:rounded file:bg-amber-800/90 file:text-sm
                 hover:file:bg-amber-700" />
      </div>

      <!-- alertas -->
      <BaseAlert v-if="success" message="¡Moto guardada correctamente!" type="success" />
      <BaseAlert v-if="error"   :message="error"                      type="error"   />
<!-- Botonera -->
<div class="flex flex-col sm:flex-row justify-center gap-4 mt-4">
  <BaseButton type="gray" class="w-full sm:w-auto flex justify-center items-center gap-2" @click="goBack">
    <IconLucide name="ArrowLeft" :size="18" />
    Volver
  </BaseButton>

  <BaseButton type="orange" htmlType="submit" :disabled="loading" class="w-full sm:w-auto flex justify-center items-center gap-2">
    <template v-if="loading">
      <Loader class="w-5 h-5 border-2" />
      Guardando…
    </template>
    <template v-else>
      Guardar moto
    </template>
  </BaseButton>
</div>

    </form>
  </section>
</template>
