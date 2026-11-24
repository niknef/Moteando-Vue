<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import PhotoPicker from '@/components/ui/PhotoPicker.vue'
import { deleteImageByUrl, uploadImage } from '@/services/storage'
import { useAuthStore } from '@/stores/auth'

// Editar perfil: foto, nombre y bio. El email es de la cuenta: se muestra al final, sin editar.

const MAX_BIO = 300

const router = useRouter()
const auth = useAuthStore()

const form = ref({ first_name: '', last_name: '', bio: '' })
const avatarUrl = ref('') // la que se va a guardar ('' = sin foto)
const savedAvatar = ref('') // la que está en la base (se borra recién al reemplazarla)
const file = ref(null)
const saving = ref(false)
const error = ref('')

const initials = computed(
  () =>
    [form.value.first_name, form.value.last_name]
      .filter(Boolean)
      .map((n) => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2) || '?',
)
const hasPhoto = computed(() => !!(file.value || avatarUrl.value))

onMounted(() => {
  const p = auth.profile ?? {}
  form.value = { first_name: p.first_name ?? '', last_name: p.last_name ?? '', bio: p.bio ?? '' }
  avatarUrl.value = p.avatar_url ?? ''
  savedAvatar.value = avatarUrl.value
})

// Solo cambia el formulario: el archivo se borra recién al guardar
function removePhoto() {
  file.value = null
  avatarUrl.value = ''
}

const goProfile = () => router.push('/perfil')

async function submit() {
  if (saving.value) return
  error.value = ''
  if (!form.value.first_name.trim()) {
    error.value = 'Poné tu nombre'
    return
  }
  saving.value = true
  try {
    // subir → guardar → recién después borrar la anterior
    const newUrl = file.value ? await uploadImage('avatars', file.value) : avatarUrl.value
    await auth.updateProfile({
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      bio: form.value.bio.trim(),
      avatar_url: newUrl || null,
    })
    if (savedAvatar.value && savedAvatar.value !== newUrl) {
      await deleteImageByUrl('avatars', savedAvatar.value)
    }
    goProfile()
  } catch (e) {
    error.value = e.message || 'No se pudo guardar tu perfil'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-full w-full max-w-xl flex-col px-4 pt-3 lg:pt-8">
    <header class="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        class="-ml-2 size-11"
        aria-label="Volver al perfil"
        @click="goProfile"
      >
        <IconLucide name="ArrowLeft" :size="20" />
      </Button>
      <h1 class="text-xl font-semibold tracking-tight">Editar perfil</h1>
    </header>

    <form class="flex flex-1 flex-col" novalidate @submit.prevent="submit">
      <div class="mt-6 space-y-5">
        <!-- Foto -->
        <div class="flex flex-col items-center gap-2">
          <PhotoPicker
            v-model="file"
            :current="avatarUrl"
            shape="round"
            label="Agregar foto de perfil"
            :fallback="initials"
            @error="(m) => (error = m)"
          />
          <Button
            v-if="hasPhoto"
            type="button"
            variant="ghost"
            size="sm"
            class="text-muted-foreground"
            @click="removePhoto"
          >
            Quitar foto
          </Button>
          <p v-else class="text-xs text-muted-foreground">Tocá para agregar una foto</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-2">
            <Label for="first-name">Nombre</Label>
            <Input
              id="first-name"
              v-model="form.first_name"
              autocomplete="given-name"
              maxlength="40"
              class="h-12"
            />
          </div>
          <div class="grid gap-2">
            <Label for="last-name">Apellido</Label>
            <Input
              id="last-name"
              v-model="form.last_name"
              autocomplete="family-name"
              maxlength="40"
              class="h-12"
            />
          </div>
        </div>

        <div class="grid gap-2">
          <div class="flex items-baseline justify-between">
            <Label for="bio">Bio</Label>
            <span class="text-xs text-muted-foreground tabular-nums">
              {{ form.bio.length }}/{{ MAX_BIO }}
            </span>
          </div>
          <Textarea
            id="bio"
            v-model="form.bio"
            rows="4"
            :maxlength="MAX_BIO"
            placeholder="Qué moto tenés, qué rutas te gustan, desde dónde salís…"
          />
        </div>

        <BaseAlert :message="error" type="error" />

        <!-- Cuenta -->
        <div class="rounded-xl border border-border p-4 text-sm">
          <p class="font-medium">Cuenta</p>
          <p class="mt-1 text-muted-foreground">
            Ingresás con <span class="text-foreground">{{ auth.user?.email }}</span
            >. No se muestra en tu perfil.
          </p>
          <router-link
            to="/restablecer"
            class="mt-2 inline-block font-medium text-primary hover:underline"
          >
            Cambiar contraseña
          </router-link>
        </div>
      </div>

      <div
        class="sticky bottom-0 -mx-4 mt-auto border-t border-border bg-background/95 px-4 py-3 backdrop-blur"
      >
        <Button type="submit" size="lg" class="h-12 w-full text-base" :disabled="saving">
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </Button>
      </div>
    </form>
  </div>
</template>
