<script>
// Importo componentes reutilizables y servicios
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Loader from '@/components/ui/Loader.vue'
import { subscribeToAuth, updateAuthProfile } from '@/services/auth'
import supabase from '@/services/supabase'

// Importo imagen por defecto para mostrar si el usuario no tiene avatar
const defaultAvatar = '/assets/user.jpg'

export default {
    name: 'MyProfileEdit',
    components: {
        BaseHeading1,
        BaseButton,
        Loader
    },
    data() {
        return {
            user: {
                id: null,
                email: '',
                first_name: '',
                last_name: '',
                bio: '',
                bike_model: '',
                avatar_url: ''
            },
            success: false,
            error: null,
            loading: false,
            selectedFile: null, // Archivo que el usuario seleccione
            previewUrl: null, // Vista previa local del archivo antes de subirlo
            defaultAvatar // Imagen por defecto para el avatar
        }
    },
    mounted() {
        // Me suscribo al estado de autenticación para cargar los datos del usuario
        subscribeToAuth(userData => {
            if (userData.id) {
                this.user = { ...this.user, ...userData }
            }
        })
    },
  methods: {
        async handleSubmit() {
            if (this.loading) return // Evita múltiples envíos

            this.success = false
            this.error = null
            this.loading = true

            try {
                // Guardo el valor actual del avatar por si no se sube uno nuevo
                let avatarUrl = this.user.avatar_url

                if (this.selectedFile) {
                    // Armo un nombre único para el archivo con timestamp para evitar problemas de caché, ya que sin esto en un principio habia errores con la actualización del avatar
                    const fileExt = this.selectedFile.name.split('.').pop()
                    const timestamp = Date.now()
                    const filePath = `${this.user.id}/avatar-${timestamp}.${fileExt}`

                    // Subo el archivo al bucket avatars de Supabase
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, this.selectedFile, { upsert: true })
                    // Si hubo un error al subir el archivo, lo muestro en consola y lanzo una excepción
                    if (uploadError) {
                        console.error('[uploadError]', uploadError)
                        throw uploadError
                    }

                    // Obtengo la URL pública de la imagen subida
                    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
                    avatarUrl = data.publicUrl

                    // Actualizo el avatar en el estado local para que se refleje en la vista
                    // Si el usuario ya tenía un avatar, lo elimino de la vista previa
                    this.user.avatar_url = avatarUrl
                    this.previewUrl = null // Limpio la preview
                }

                // Actualizo el perfil en Supabase con los datos nuevos
                await updateAuthProfile({
                    first_name: this.user.first_name,
                    last_name: this.user.last_name,
                    bio: this.user.bio,
                    bike_model: this.user.bike_model,
                    avatar_url: avatarUrl
                })


                this.success = true
            } catch (e) {
                this.error = 'Hubo un error al actualizar el perfil.'
                console.error('[MyProfileEdit] error:', e)
            } finally {
                //Para terminar el loader
                this.loading = false
            }
        },

        onFileChange(event) {
            const file = event.target.files[0]
            if (!file) return

            // Validaciones básicas
            const isImage = file.type.startsWith('image/')
            const maxSizeMB = 1 // Tamaño máximo de 1MB al igual que en supabase
            const isTooBig = file.size > maxSizeMB * 1024 * 1024

            if (!isImage) {
                this.error = 'El archivo debe ser una imagen.'
                return
            }
            if (isTooBig) {
                this.error = `El archivo debe pesar menos de ${maxSizeMB}MB.`
                return
            }

            // Limpio la preview anterior si la había
            if (this.previewUrl) {
                URL.revokeObjectURL(this.previewUrl)
            }

            // Guardo el archivo y genero la vista previa
            this.selectedFile = file
            this.previewUrl = URL.createObjectURL(file)
            this.error = null
        },

        removePreview() {
            // Si hay una preview cargada, la libero
            if (this.previewUrl) {
                URL.revokeObjectURL(this.previewUrl)
            }

            // Reseteo valores relacionados con la imagen
            this.selectedFile = null
            this.previewUrl = null
            this.user.avatar_url = ''
            //esto me permite si se elimna la imagen, el usuario vuevle a tener la imagen por defecto
        }
    },
    beforeUnmount() {
        // Libero la memoria del objeto URL cuando se destruye el componente
        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl)
        }
    }
}
</script>

<template>
    <section class="max-w-xl mx-auto mt-8 bg-gray-800 text-white p-6 rounded-lg shadow-md">
        <BaseHeading1>Editar perfil</BaseHeading1>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 mt-4">
            <!-- Email  -->
            <div>
                <label class="block mb-1">Email</label>
                <input v-model="user.email" type="email" disabled
                    class="w-full px-4 py-2 bg-gray-700 rounded text-gray-400 cursor-not-allowed" />
            </div>

            <!-- Nombre y Apellido -->
            <div class="flex gap-4">
                <div class="flex-1">
                    <label class="block mb-1">Nombre</label>
                    <input v-model="user.first_name" type="text" class="w-full px-4 py-2 bg-gray-700 rounded" />
                </div>
                <div class="flex-1">
                    <label class="block mb-1">Apellido</label>
                    <input v-model="user.last_name" type="text" class="w-full px-4 py-2 bg-gray-700 rounded" />
                </div>
            </div>

            <!-- Moto -->
            <div>
                <label class="block mb-1">Modelo de moto</label>
                <input v-model="user.bike_model" type="text" class="w-full px-4 py-2 bg-gray-700 rounded" />
            </div>

            <!-- Bio -->
            <div>
                <label class="block mb-1">Biografía</label>
                <textarea v-model="user.bio" rows="3" class="w-full px-4 py-2 bg-gray-700 rounded"></textarea>
            </div>

            <!-- Avatar -->
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <!-- Selector -->
                <div class="flex flex-col gap-2 sm:w-1/2">
                    <label class="block mb-1">Foto de perfil</label>
                    <div class="flex gap-2">
                        <label
                            class="bg-orange-500 hover:bg-orange-600 transition text-white text-sm px-4 py-2 rounded cursor-pointer w-max">
                            Seleccionar imagen
                            <input type="file" @change="onFileChange" accept="image/*" class="hidden" />
                        </label>

                        <button type="button" @click="removePreview"
                            class="text-sm text-red-400 underline disabled:text-gray-500"
                            :disabled="!previewUrl && !user.avatar_url">
                            Quitar imagen
                        </button>
                    </div>
                </div>

                <!-- Preview -->
                <div class="flex justify-center sm:justify-end sm:w-1/2 my-4">
                    <img :src="previewUrl || user.avatar_url || defaultAvatar" alt="Previsualización"
                        class="w-32 h-32 object-cover rounded-full border border-gray-500" />
                </div>
            </div>

            <!-- Acciones -->
            <div class="flex justify-end gap-4 items-center">
                <router-link to="/my-profile">
                    <BaseButton type="error">Volver</BaseButton>
                </router-link>
                <template v-if="loading">
                    <BaseButton type="loading">
                        <Loader size="sm" />
                    </BaseButton>
                </template>
                <template v-else>
                    <BaseButton type="orange" htmlType="submit"> Guardar </BaseButton>
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
