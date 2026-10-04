<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

/* UI */
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseInput    from '@/components/ui/BaseInput.vue'
import BaseLabel    from '@/components/ui/BaseLabel.vue'
import BaseButton   from '@/components/ui/BaseButton.vue'
import BaseAlert    from '@/components/ui/BaseAlert.vue'
import Loader       from '@/components/ui/Loader.vue'
import IconLucide   from '@/components/ui/IconLucide.vue'

/* servicios */
import { uploadBikePhoto, updateBike, listBikes } from '@/services/bikes'

/* router */
const router  = useRouter()
const goBack  = () => router.push('/my-bikes')
const { params } = useRoute()
const bikeId  = params.id

/* -------- estado ---------- */
const form = ref({
  brand:'', model:'', year:'', color:'', photo_url:'', photoFile:null
})
const originalPhoto = ref('')
const error   = ref('')
const success = ref(false)
const loading = ref(false)

/* ◆ PREVIEW reactivo */
const previewUrl = ref('')
watch(
  () => form.value.photoFile,
  (file, old) => {
    if (old) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = file ? URL.createObjectURL(file) : form.value.photo_url
  }
)

/* liberar al salir */
onUnmounted(() => {
  if (form.value.photoFile) URL.revokeObjectURL(previewUrl.value)
})

/* -------- cargar datos ---------- */
onMounted(async () => {
  const all = await listBikes()
  const current = all.find(b => b.id === bikeId)
  if (!current) return router.push('/my-bikes')

  form.value = {
    brand : current.brand,
    model : current.model,
    year  : String(current.year),
    color : current.color,
    photo_url: current.photo_url,
    photoFile: null
  }
  originalPhoto.value = current.photo_url
  previewUrl.value    = current.photo_url          // ◆ inicial
})

/* -------- helpers ---------- */
function handleFile (e) {
  form.value.photoFile = e.target.files[0] ?? null
}
function validYear (y) {
  const n = Number(y)
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

  loading.value = true
  try {
    let newPhotoUrl = originalPhoto.value

    if (form.value.photoFile) {
      newPhotoUrl = await uploadBikePhoto(form.value.photoFile)
    }

    await updateBike(bikeId, {
      brand : form.value.brand.trim(),
      model : form.value.model.trim(),
      year  : +form.value.year,
      color : form.value.color.trim(),
      photo_url : newPhotoUrl
    })

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
    <BaseHeading1>Editar moto</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <!-- Marca / Modelo -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <BaseLabel for="brand">Marca</BaseLabel>
          <BaseInput id="brand" v-model="form.brand" placeholder="Marca" />
        </div>
        <div class="flex-1">
          <BaseLabel for="model">Modelo</BaseLabel>
          <BaseInput id="model" v-model="form.model" placeholder="Modelo" />
        </div>
      </div>

      <!-- Año / Color -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <BaseLabel for="year">Año</BaseLabel>
          <BaseInput id="year" v-model="form.year" type="number" placeholder="Año" />
        </div>
        <div class="flex-1">
          <BaseLabel for="color">Color</BaseLabel>
          <BaseInput id="color" v-model="form.color" placeholder="Color" />
        </div>
      </div>

      <!-- Foto -->
      <div>
        <BaseLabel>Foto</BaseLabel>
        <input type="file" accept="image/*" @change="handleFile"
               class="mt-1 block w-full file:mr-3 file:px-4 file:py-2 file:border-0
                      file:rounded file:bg-amber-800/90 file:text-sm
                      hover:file:bg-amber-700" />
        <!-- ◆ usa previewUrl -->
        <img :src="previewUrl" class="w-32 h-32 object-cover rounded mt-4" />
      </div>

      <!-- alertas -->
      <BaseAlert v-if="success" message="¡Moto actualizada!" type="success" />
      <BaseAlert v-if="error"   :message="error"            type="error"   />

      <!-- Botonera -->
      <div class="flex flex-col sm:flex-row justify-center sm:justify-end gap-4 mt-4">
        <BaseButton type="gray" class="w-full sm:w-auto" @click="goBack">
          <template #icon><IconLucide name="ArrowLeft" :size="18" /></template>
          Volver
        </BaseButton>

        <BaseButton type="orange" htmlType="submit" :disabled="loading">
          <template #icon>
            <Loader v-if="loading" class="w-5 h-5 border-2" />
          </template>
          {{ loading ? 'Guardando…' : 'Guardar cambios' }}
        </BaseButton>
      </div>
    </form>
  </section>
</template>
