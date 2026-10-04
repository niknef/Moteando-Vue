<script setup>
/* ────────── imports ────────── */
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseLabel from '@/components/ui/BaseLabel.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import Loader from '@/components/ui/Loader.vue'
import IconLucide from '@/components/ui/IconLucide.vue'

import { uploadImage, deleteImageByUrl, validateImage, IMAGE_ACCEPT } from '@/services/storage'
import { useAuthStore } from '@/stores/auth'

/* ────────── constantes ────────── */
const defaultAvatar = '/assets/user.jpg'
const router = useRouter()
const auth = useAuthStore()

/* ────────── estado ────────── */
const email = ref('')

const form = ref({
  first_name: '',
  last_name: '',
  bio: '',
  avatar_url: '', // url actual (o vacía)
})
const file = ref(null) // File seleccionado
const preview = ref('') // url de previsualización

const error = ref('')
const success = ref(false)
const loading = ref(false)
const savedAvatar = ref('') // avatar guardado en la base (se borra recién al reemplazarlo)

/* ────────── cargar datos del perfil ────────── */
onMounted(() => {
  const p = auth.profile ?? {}
  email.value = auth.user.email
  form.value = {
    first_name: p.first_name ?? '',
    last_name: p.last_name ?? '',
    bio: p.bio ?? '',
    avatar_url: p.avatar_url ?? '',
  }
  savedAvatar.value = form.value.avatar_url
  preview.value = form.value.avatar_url || defaultAvatar
})

/* ────────── watcher de archivo → genera preview ────────── */
watch(file, (f, old) => {
  if (old) URL.revokeObjectURL(preview.value)
  preview.value = f ? URL.createObjectURL(f) : form.value.avatar_url || defaultAvatar
})

/* limpiar al salir */
onUnmounted(() => {
  if (file.value) URL.revokeObjectURL(preview.value)
})

/* ────────── handlers ────────── */
function handleFile(e) {
  const f = e.target.files[0]
  if (!f) return

  try {
    validateImage(f)
  } catch (err) {
    error.value = err.message
    return
  }

  error.value = ''
  file.value = f
}

function removeAvatar() {
  /* solo cambia el formulario: el archivo se borra recién al guardar */
  file.value = null
  form.value.avatar_url = ''
  preview.value = defaultAvatar
}

/* ────────── submit ────────── */
async function handleSubmit() {
  if (loading.value) return
  error.value = ''
  success.value = false
  loading.value = true

  try {
    let newUrl = form.value.avatar_url

    /* 1. subir la imagen nueva, si eligió una */
    if (file.value) {
      newUrl = await uploadImage('avatars', file.value)
    }

    /* 2. guardar el perfil apuntando a la imagen nueva (o a ninguna) */
    await auth.updateProfile({
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      bio: form.value.bio.trim(),
      avatar_url: newUrl || null,
    })

    /* 3. recién ahora, si cambió, borrar la imagen anterior */
    if (savedAvatar.value && savedAvatar.value !== newUrl) {
      await deleteImageByUrl('avatars', savedAvatar.value)
    }

    savedAvatar.value = newUrl
    form.value.avatar_url = newUrl
    file.value = null
    success.value = true
  } catch (err) {
    console.error('[MyProfileEdit]', err)
    error.value = err.message || 'Hubo un error al actualizar tu perfil.'
  } finally {
    loading.value = false
  }
}

/* volver sin guardar */
const goBack = () => router.back()
</script>

<template>
  <section
    class="max-w-xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md mb-6"
  >
    <BaseHeading1>Editar perfil</BaseHeading1>

    <form class="flex flex-col gap-4 mt-4" @submit.prevent="handleSubmit">
      <!-- Email (solo lectura) -->
      <div>
        <BaseLabel>Email</BaseLabel>
        <BaseInput :model-value="email" disabled class="text-gray-400 cursor-not-allowed" />
      </div>

      <!-- Nombre / Apellido -->
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <BaseLabel>Nombre</BaseLabel>
          <BaseInput v-model="form.first_name" placeholder="Nombre" />
        </div>
        <div class="flex-1">
          <BaseLabel>Apellido</BaseLabel>
          <BaseInput v-model="form.last_name" placeholder="Apellido" />
        </div>
      </div>

      <!-- Bio -->
      <div>
        <BaseLabel>Biografía</BaseLabel>
        <textarea
          v-model="form.bio"
          rows="3"
          class="w-full px-4 py-2 bg-neutral-600 rounded"
        ></textarea>
      </div>

      <!-- Avatar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex flex-col gap-2 sm:w-1/2">
          <BaseLabel>Foto de perfil</BaseLabel>

          <div class="flex gap-2">
            <!-- seleccionar -->
            <label
              class="bg-orange-500 hover:bg-orange-600 transition text-white text-sm px-4 py-2 rounded cursor-pointer w-max flex items-center gap-2"
            >
              <IconLucide name="Image" :size="20" />
              Seleccionar
              <input type="file" :accept="IMAGE_ACCEPT" class="hidden" @change="handleFile" />
            </label>

            <!-- quitar -->
            <button
              type="button"
              class="text-sm text-red-400 underline disabled:text-gray-500"
              :disabled="!preview || preview === defaultAvatar"
              @click="removeAvatar"
            >
              Quitar imagen
            </button>
          </div>
        </div>

        <!-- preview -->
        <div class="flex justify-center sm:justify-end sm:w-1/2 my-4">
          <img :src="preview" class="w-32 h-32 object-cover rounded-full border border-gray-500" />
        </div>
      </div>

      <!-- Alertas -->
      <BaseAlert v-if="success" message="¡Perfil actualizado!" type="success" />
      <BaseAlert v-if="error" :message="error" type="error" />

      <!-- Botonera -->
      <div class="flex justify-center sm:justify-end gap-4 items-center mt-4">
        <BaseButton type="gray" @click="goBack">
          <template #icon><IconLucide name="ArrowLeft" :size="18" /></template>
          Volver
        </BaseButton>

        <BaseButton type="orange" html-type="submit" :disabled="loading">
          <template #icon>
            <Loader v-if="loading" class="w-5 h-5 border-2" />
            <IconLucide v-else name="Save" :size="20" />
          </template>
          {{ loading ? 'Guardando…' : 'Guardar' }}
        </BaseButton>
      </div>
    </form>
  </section>
</template>
