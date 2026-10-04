<script setup>
/* ────────── imports ────────── */
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseInput    from '@/components/ui/BaseInput.vue'
import BaseLabel    from '@/components/ui/BaseLabel.vue'
import BaseButton   from '@/components/ui/BaseButton.vue'
import BaseAlert    from '@/components/ui/BaseAlert.vue'
import Loader       from '@/components/ui/Loader.vue'
import IconLucide   from '@/components/ui/IconLucide.vue'

import supabase                       from '@/services/supabase'
import { subscribeToAuth, updateAuthProfile } from '@/services/auth'

/* ────────── constantes ────────── */
const defaultAvatar = '/assets/user.jpg'
const router        = useRouter()

/* ────────── estado ────────── */
const userId   = ref(null)            // uid del usuario autenticado
const email    = ref('')

const form = ref({
  first_name : '',
  last_name  : '',
  bio        : '',
  avatar_url : ''                     // url actual (o vacía)
})
const file      = ref(null)           // File seleccionado
const preview   = ref('')             // url de previsualización

const error     = ref('')
const success   = ref(false)
const loading   = ref(false)
const oldPath   = ref(null)           // ruta de avatar antiguo en Storage

/* ────────── cargar datos del perfil ────────── */
onMounted(() => {
  subscribeToAuth(u => {
    if (!u.id) return
    userId.value = u.id
    email.value  = u.email
    form.value   = {
      first_name : u.first_name ?? '',
      last_name  : u.last_name  ?? '',
      bio        : u.bio        ?? '',
      avatar_url : u.avatar_url ?? ''
    }
    preview.value = form.value.avatar_url || defaultAvatar

    /* guardar oldPath para eliminar si se cambia */
    if (u.avatar_url) {
      const [, path] = u.avatar_url.split('/storage/v1/object/public/avatars/')
      oldPath.value = path || null
    }
  })
})

/* ────────── watcher de archivo → genera preview ────────── */
watch(file, (f, old) => {
  if (old) URL.revokeObjectURL(preview.value)
  preview.value = f ? URL.createObjectURL(f) : (form.value.avatar_url || defaultAvatar)
})

/* limpiar al salir */
onUnmounted(() => { if (file.value) URL.revokeObjectURL(preview.value) })

/* ────────── handlers ────────── */
function handleFile (e) {
  const f = e.target.files[0]
  if (!f) return

  /* validaciones */
  const isImage   = f.type.startsWith('image/')
  const maxSizeMB = 1
  if (!isImage)   return error.value = 'El archivo debe ser una imagen.'
  if (f.size > maxSizeMB * 1024 * 1024)
    return error.value = `La imagen debe pesar menos de ${maxSizeMB} MB.`

  error.value = ''
  file.value  = f
}

async function removeAvatar () {
  /* quita preview + borra del storage si existía */
  if (oldPath.value)
    await supabase.storage.from('avatars').remove([oldPath.value])

  file.value            = null
  form.value.avatar_url = ''
  preview.value         = defaultAvatar
  oldPath.value         = null
}

/* ────────── submit ────────── */
async function handleSubmit () {
  if (loading.value) return
  error.value   = ''
  success.value = false
  loading.value = true

  try {
    let newUrl = form.value.avatar_url

    /* subir nueva imagen si corresponde */
    if (file.value) {
      const ext       = file.value.name.split('.').pop()
      const filePath  = `${userId.value}/avatar-${Date.now()}.${ext}`

      const { error: upErr } = await supabase
        .storage.from('avatars').upload(filePath, file.value, { upsert: true })
      if (upErr) throw upErr

      newUrl = supabase
        .storage.from('avatars')
        .getPublicUrl(filePath).data.publicUrl

      /* eliminar anterior si existía */
      if (oldPath.value)
        await supabase.storage.from('avatars').remove([oldPath.value])

      oldPath.value         = filePath
      file.value            = null
    }

    /* actualizar tabla user_profiles */
    await updateAuthProfile({
      first_name : form.value.first_name.trim(),
      last_name  : form.value.last_name.trim(),
      bio        : form.value.bio.trim(),
      avatar_url : newUrl
    })

    success.value = true
  } catch (err) {
    console.error('[MyProfileEdit]', err)
    error.value = 'Hubo un error al actualizar tu perfil.'
  } finally {
    loading.value = false
  }
}

/* volver sin guardar */
const goBack = () => router.back()
</script>

<template>
  <section class="max-w-xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md mb-6">
    <BaseHeading1>Editar perfil</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">

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
          <BaseInput v-model="form.last_name"  placeholder="Apellido" />
        </div>
      </div>

      <!-- Bio -->
      <div>
        <BaseLabel>Biografía</BaseLabel>
        <textarea v-model="form.bio" rows="3"
                  class="w-full px-4 py-2 bg-neutral-600 rounded"></textarea>
      </div>

      <!-- Avatar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex flex-col gap-2 sm:w-1/2">
          <BaseLabel>Foto de perfil</BaseLabel>

          <div class="flex gap-2">
            <!-- seleccionar -->
            <label
              class="bg-orange-500 hover:bg-orange-600 transition text-white text-sm
                     px-4 py-2 rounded cursor-pointer w-max flex items-center gap-2">
              <IconLucide name="Image" :size="20" />
              Seleccionar
              <input type="file" accept="image/*" class="hidden" @change="handleFile" />
            </label>

            <!-- quitar -->
            <button type="button"
                    class="text-sm text-red-400 underline disabled:text-gray-500"
                    :disabled="!preview || preview === defaultAvatar"
                    @click="removeAvatar">
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
      <BaseAlert v-if="error"   :message="error"               type="error"   />

      <!-- Botonera -->
      <div class="flex justify-center sm:justify-end gap-4 items-center mt-4">
        <BaseButton type="gray" @click="goBack">
          <template #icon><IconLucide name="ArrowLeft" :size="18" /></template>
          Volver
        </BaseButton>

        <BaseButton type="orange" htmlType="submit" :disabled="loading">
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
