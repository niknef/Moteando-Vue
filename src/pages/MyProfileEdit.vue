<script>
//Componente para editar un perfil de usuario

//Importaciones necesarias para el componente
import BaseHeading1 from '@/components/ui/BaseHeading1.vue' // h1
import BaseButton from '@/components/ui/BaseButton.vue' // Botón
import BaseInput from '@/components/ui/BaseInput.vue' // Input
import BaseLabel from '@/components/ui/BaseLabel.vue' // Label
import Loader from '@/components/ui/Loader.vue' // Loader
import { subscribeToAuth, updateAuthProfile } from '@/services/auth' // Importo el método para subscribirme a los cambios de auth
// y el método para actualizar el perfil
import supabase from '@/services/supabase' // Importo el cliente de supabase
import { CheckCircleIcon, ArrowLeftIcon, PhotoIcon } from '@heroicons/vue/24/outline'
import BaseAlert from '../components/ui/BaseAlert.vue' // Alertas

//Creamos una constante para la ruta por defecto de la imagen de perfil en caso de que no haya una subida
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
    PhotoIcon,
    BaseAlert
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
      oldAvatarPath: null, // Para almacenar la ruta del avatar anterior
      success: false, // Para manejar el mensaje de éxito
      error: null, // Para manejar el mensaje de error
      loading: false, // Para manejar el loader
      selectedFile: null, // Para almacenar el archivo seleccionado
      previewUrl: null, // Para almacenar la URL de previsualización de la imagen
      defaultAvatar // Ruta por defecto de la imagen de perfil
    }
  },
  mounted() {
    // En el mounted llamo a la función subscribeToAuth para subscribirme a los cambios de auth
    subscribeToAuth(userData => { 
      if (userData.id) { // Si el usuario está autenticado
        this.user = { // Actualizo el objeto user con los datos del usuario
          id: userData.id,
          email: userData.email
        }
        this.profile = { // aca manejamos los datos del perfil del usuario en caso de que no haya, o en caso que el usuario ya haya cargado algun dato
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          bio: userData.bio || '',
          bike_model: userData.bike_model || '',
          avatar_url: userData.avatar_url || ''
        }

        // Si el usuario tiene una imagen de perfil, la guardo en la variable oldAvatarPath
        // para poder eliminarla si el usuario sube una nueva
        if (userData.avatar_url) {
          const parts = userData.avatar_url.split('/storage/v1/object/public/avatars/') // Divido la URL para obtener la ruta del archivo
          this.oldAvatarPath = parts[1] || null // Guardamos la ruta del archivo en la variable oldAvatarPath utilizamos la parte 1 del array que contiene la ruta
        }
      }
    })
  },
  methods: {
    // Método para manejar el submit del formulario
    async handleSubmit() {
      if (this.loading) return

      this.success = false
      this.error = null
      this.loading = true

      try {
        
        let newAvatarUrl = this.profile.avatar_url // si el usuario sube una foto nueva, la guardamos en la variable newAvatarUrl

        if (this.selectedFile) { // manejo del archivo seleccionado
          const fileExt = this.selectedFile.name.split('.').pop() // Obtenemos la extensión del archivo usando el split para dividir la cadena en el punto
          const timestamp = Date.now() // Obtenemos el timestamp actual para crear un nombre único para el archivo
          const filePath = `${this.user.id}/avatar-${timestamp}.${fileExt}` // Creamos la ruta del archivo usando el id del usuario y el timestamp

          const { error: uploadError } = await supabase.storage // Subimos el archivo a Supabase Storage
            .from('avatars') // Seleccionamos el bucket de Supabase Storage
            .upload(filePath, this.selectedFile, { upsert: true }) // Subimos el archivo y lo reemplazamos si ya existe

          if (uploadError) throw uploadError // Si hay un error al subir el archivo, lanzamos el error

          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath) // Obtenemos la URL pública del archivo subido
          newAvatarUrl = data.publicUrl // Guardamos la URL pública en la variable newAvatarUrl

          if (this.oldAvatarPath) {
            // si el usuario desea cambiar la foto de perfil, eliminamos la foto anterior de supabase para optimizacion del espacio
            await supabase.storage.from('avatars').remove([this.oldAvatarPath])
          }

          this.oldAvatarPath = filePath 
          this.profile.avatar_url = newAvatarUrl
          this.previewUrl = null
        }

        await updateAuthProfile({
          // esperamos para actualizar el perfil del usuario usando el metodo updateAuthProfile y le pasamos el perfil y la url de la imagen
          ...this.profile,
          avatar_url: newAvatarUrl
        })

        this.success = true // Si se actualiza el perfil, mostramos un mensaje de éxito
      } catch (e) { //manejo de errores
        this.error = 'Hubo un error al actualizar el perfil.'
        console.error('[MyProfileEdit] error:', e)
      } finally {
        this.loading = false
      }
    },

    onFileChange(event) { // Manejo del evento de cambio de archivo
      const file = event.target.files[0] // Obtenemos el primer archivo seleccionado
      if (!file) return // Si no hay archivo  salimos de la función

      const isImage = file.type.startsWith('image/') //verificamos el tipo de archivo
      const maxSizeMB = 1 // Definimos el tamaño máximo del archivo en MB

      //manejo de verificaciones de archivos
      if (!isImage) {
        
        this.error = 'El archivo debe ser una imagen.'
        return
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        this.error = `El archivo debe pesar menos de ${maxSizeMB}MB.`
        return
      }

      // Si hay una URL de previsualización anterior
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }

      this.selectedFile = file
      this.previewUrl = URL.createObjectURL(file)
      this.error = null
    },

    async removePreview() { // Manejo del evento de quitar la previsualización
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl)
      }

      this.selectedFile = null
      this.previewUrl = null

      if (this.oldAvatarPath) {
        await supabase.storage.from('avatars').remove([this.oldAvatarPath]) // Eliminamos la imagen anterior de Supabase Storage
        this.oldAvatarPath = null
      }

      this.profile.avatar_url = ''
    }
  },
  beforeUnmount() { //despues de desmontar el componente, revocamos la URL de previsualización
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl)
    }
  }
}
</script>

<template>
  <section class="max-w-xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md mb-6">
    <BaseHeading1>Editar perfil</BaseHeading1>
    <!-- formulario -->
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

      <!-- imagen -->

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

      <BaseAlert :message="success && '¡Perfil actualizado!'" type="success" />
      <BaseAlert :message="error" type="error" />
    </form>
  </section>
</template>
