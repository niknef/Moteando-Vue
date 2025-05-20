<script>
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseLabel from '@/components/ui/BaseLabel.vue'
import Loader from '@/components/ui/Loader.vue'
import { subscribeToAuth, updateAuthProfile } from '@/services/auth'
import supabase from '@/services/supabase'
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  PhotoIcon
} from '@heroicons/vue/24/outline'

const defaultAvatar = '/assets/user.jpg'

export default {
  name: 'MyProfileEdit',
  components: {
    BaseHeading1,
    BaseButton,
    BaseInput,
    BaseLabel,
    Loader,
    CheckCircleIcon,
    ArrowLeftIcon,
    PhotoIcon
  },
  data() {
    return {
      user: {
        id: null,
        email: null
      },
      profile: {
        first_name: '',
        last_name: '',
        bio: '',
        bike_model: '',
        avatar_url: ''
      },
      oldAvatarPath: null,
      success: false,
      error: null,
      loading: false,
      selectedFile: null,
      previewUrl: null,
      defaultAvatar
    }
  },
  mounted() {
    subscribeToAuth(userData => {
      if (userData.id) {
        this.user = {
          id: userData.id,
          email: userData.email
        }
        this.profile = {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          bio: userData.bio || '',
          bike_model: userData.bike_model || '',
          avatar_url: userData.avatar_url || ''
        }

        if (userData.avatar_url) {
          const parts = userData.avatar_url.split('/storage/v1/object/public/avatars/')
          this.oldAvatarPath = parts[1] || null
        }
      }
    })
  },
  methods: {
    async handleSubmit() {
      if (this.loading) return

      this.success = false
      this.error = null
      this.loading = true

      try {
        let newAvatarUrl = this.profile.avatar_url

        if (this.selectedFile) {
          const fileExt = this.selectedFile.name.split('.').pop()
          const timestamp = Date.now()
          const filePath = `${this.user.id}/avatar-${timestamp}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, this.selectedFile, { upsert: true })

          if (uploadError) throw uploadError

          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
          newAvatarUrl = data.publicUrl

          if (this.oldAvatarPath) {
            await supabase.storage.from('avatars').remove([this.oldAvatarPath])
          }

          this.oldAvatarPath = filePath
          this.profile.avatar_url = newAvatarUrl
          this.previewUrl = null
        }

        await updateAuthProfile({
          ...this.profile,
          avatar_url: newAvatarUrl
        })

        this.success = true
      } catch (e) {
        this.error = 'Hubo un error al actualizar el perfil.'
        console.error('[MyProfileEdit] error:', e)
      } finally {
        this.loading = false
      }
    },

    onFileChange(event) {
      const file = event.target.files[0]
      if (!file) return

      const isImage = file.type.startsWith('image/')
      const maxSizeMB = 1

      if (!isImage) {
        this.error = 'El archivo debe ser una imagen.'
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        this.error = `El archivo debe pesar menos de ${maxSizeMB}MB.`
        return
      }

      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }

      this.selectedFile = file
      this.previewUrl = URL.createObjectURL(file)
      this.error = null
    },

    async removePreview() {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }

      this.selectedFile = null
      this.previewUrl = null

      if (this.oldAvatarPath) {
        await supabase.storage.from('avatars').remove([this.oldAvatarPath])
        this.oldAvatarPath = null
      }

      this.profile.avatar_url = ''
    }
  },
  beforeUnmount() {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
    }
  }
}
</script>

<template>
  <section class="max-w-xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md mb-6">
    <BaseHeading1>Editar perfil</BaseHeading1>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
      <div>
        <BaseLabel>Email</BaseLabel>
        <BaseInput
          v-model="user.email"
          type="email"
          disabled
          class="text-gray-400 cursor-not-allowed"
        />
      </div>

      <div class="flex gap-4">
        <div class="flex-1">
          <BaseLabel>Nombre</BaseLabel>
          <BaseInput v-model="profile.first_name" type="text" />
        </div>
        <div class="flex-1">
          <BaseLabel>Apellido</BaseLabel>
          <BaseInput v-model="profile.last_name" type="text" />
        </div>
      </div>

      <div>
        <BaseLabel>Modelo de moto</BaseLabel>
        <BaseInput v-model="profile.bike_model" type="text" />
      </div>

      <div>
        <BaseLabel>Biografía</BaseLabel>
        <textarea v-model="profile.bio" rows="3" class="w-full px-4 py-2 bg-neutral-600 rounded"></textarea>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex flex-col gap-2 sm:w-1/2">
          <BaseLabel>Foto de perfil</BaseLabel>
          <div class="flex gap-2">
            <label class="bg-orange-500 hover:bg-orange-600 transition text-white text-sm px-4 py-2 rounded cursor-pointer w-max flex items-center gap-2">
              <PhotoIcon class="w-5 h-5" />
              Seleccionar imagen
              <input type="file" @change="onFileChange" accept="image/*" class="hidden" />
            </label>

            <button
              type="button"
              @click="removePreview"
              class="text-sm text-red-400 underline disabled:text-gray-500"
              :disabled="!previewUrl && !profile.avatar_url"
            >
              Quitar imagen
            </button>
          </div>
        </div>

        <div class="flex justify-center sm:justify-end sm:w-1/2 my-4">
          <img
            :src="previewUrl || profile.avatar_url || defaultAvatar"
            alt="Previsualización"
            class="w-32 h-32 object-cover rounded-full border border-gray-500"
          />
        </div>
      </div>

      <div class="flex justify-center sm:justify-end gap-4 items-center">
        <router-link to="/my-profile">
          <BaseButton type="gray">
            <template #icon>
              <ArrowLeftIcon class="w-5 h-5" />
            </template>
            Volver
          </BaseButton>
        </router-link>

        <template v-if="loading">
          <BaseButton type="loading">
            <Loader size="sm" />
          </BaseButton>
        </template>
        <template v-else>
          <BaseButton type="orange" htmlType="submit">
            <template #icon>
              <CheckCircleIcon class="w-5 h-5" />
            </template>
            Guardar
          </BaseButton>
        </template>
      </div>

      <p v-if="success" class="text-green-400 text-sm mt-2 text-center">
        Perfil actualizado correctamente.
      </p>
      <p v-if="error" class="text-red-400 text-sm mt-2 text-center">
        {{ error }}
      </p>
    </form>
  </section>
</template>
