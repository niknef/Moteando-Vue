<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import PhotoPicker from '@/components/ui/PhotoPicker.vue'
import { addBike, listBikes, setActiveBike, updateBike } from '@/services/bikes'
import { deleteImageByUrl, uploadImage } from '@/services/storage'
import { useAuthStore } from '@/stores/auth'

// Agregar o editar una moto del garaje (/garaje/nueva y /garaje/:id/editar).

// Las más comunes en Argentina, para sugerir mientras se escribe
const BRANDS = [
  'Honda',
  'Yamaha',
  'Kawasaki',
  'Suzuki',
  'BMW',
  'KTM',
  'Ducati',
  'Triumph',
  'Harley-Davidson',
  'Royal Enfield',
  'Benelli',
  'Bajaj',
  'Motomel',
  'Zanella',
  'Corven',
  'Gilera',
  'Keller',
  'CFMoto',
  'Voge',
  'Kymco',
]
const MAX_YEAR = new Date().getFullYear() + 1

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const bikeId = route.params.id ?? null
const isEdit = !!bikeId

const form = ref({ brand: '', model: '', year: '', color: '' })
const photo = ref(null) // File nuevo
const savedPhoto = ref('') // URL guardada
const original = ref(null)
const loading = ref(isEdit)
const saving = ref(false)
const error = ref('')

const title = computed(() => (isEdit ? 'Editar moto' : 'Agregar moto'))

const goGarage = () => router.push({ path: '/perfil', query: { tab: 'garaje' } })

onMounted(async () => {
  if (!isEdit) return
  try {
    const bike = (await listBikes()).find((b) => b.id === bikeId)
    if (!bike) throw new Error('No encontramos esa moto en tu garaje')
    original.value = bike
    form.value = {
      brand: bike.brand,
      model: bike.model,
      year: String(bike.year),
      color: bike.color ?? '',
    }
    savedPhoto.value = bike.photo_url || ''
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

function validate() {
  const year = Number(form.value.year)
  if (!form.value.brand.trim() || !form.value.model.trim()) return 'Completá marca y modelo'
  if (!Number.isInteger(year) || year < 1900 || year > MAX_YEAR) {
    return `El año tiene que estar entre 1900 y ${MAX_YEAR}`
  }
  return ''
}

async function submit() {
  error.value = validate()
  if (error.value || saving.value) return
  saving.value = true
  try {
    // subir → guardar → recién después borrar la foto anterior
    const photoUrl = photo.value ? await uploadImage('bikes', photo.value) : savedPhoto.value
    const data = {
      brand: form.value.brand.trim(),
      model: form.value.model.trim(),
      year: Number(form.value.year),
      color: form.value.color.trim(),
      photo_url: photoUrl,
    }
    if (isEdit) {
      await updateBike(bikeId, data)
      if (photo.value && savedPhoto.value) await deleteImageByUrl('bikes', savedPhoto.value)
    } else {
      const bike = await addBike({ ...data, is_active: false })
      // la primera moto queda como activa: es la que se muestra en el perfil
      if (!auth.profile?.active_bike_id) {
        await setActiveBike(bike.id)
        await auth.loadProfile()
      }
    }
    goGarage()
  } catch (e) {
    error.value = e.message
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
        aria-label="Volver al garaje"
        @click="goGarage"
      >
        <IconLucide name="ArrowLeft" :size="20" />
      </Button>
      <h1 class="text-xl font-semibold tracking-tight">{{ title }}</h1>
    </header>

    <div v-if="loading" class="grid flex-1 place-items-center"><Loader size="lg" /></div>

    <form v-else class="flex flex-1 flex-col" novalidate @submit.prevent="submit">
      <div class="mt-4 space-y-5">
        <PhotoPicker
          v-model="photo"
          :current="savedPhoto"
          label="Agregar una foto de la moto"
          @error="(m) => (error = m)"
        />

        <div class="grid gap-2">
          <Label for="brand">Marca</Label>
          <Input
            id="brand"
            v-model="form.brand"
            list="bike-brands"
            maxlength="40"
            autocomplete="off"
            placeholder="Ej.: Honda"
            class="h-12"
          />
          <datalist id="bike-brands">
            <option v-for="b in BRANDS" :key="b" :value="b" />
          </datalist>
        </div>

        <div class="grid gap-2">
          <Label for="model">Modelo</Label>
          <Input
            id="model"
            v-model="form.model"
            maxlength="40"
            placeholder="Ej.: CB500X"
            class="h-12"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-2">
            <Label for="year">Año</Label>
            <Input
              id="year"
              v-model="form.year"
              type="number"
              inputmode="numeric"
              min="1900"
              :max="MAX_YEAR"
              placeholder="2024"
              class="h-12"
            />
          </div>
          <div class="grid gap-2">
            <Label for="color"
              >Color <span class="font-normal text-muted-foreground">(opcional)</span></Label
            >
            <Input
              id="color"
              v-model="form.color"
              maxlength="20"
              placeholder="Ej.: Rojo"
              class="h-12"
            />
          </div>
        </div>

        <BaseAlert :message="error" type="error" />
      </div>

      <!-- Guardar: fijo abajo, por encima de la barra -->
      <div
        class="sticky bottom-0 -mx-4 mt-auto border-t border-border bg-background/95 px-4 py-3 backdrop-blur"
      >
        <Button type="submit" size="lg" class="h-12 w-full text-base" :disabled="saving">
          {{ saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar al garaje' }}
        </Button>
      </div>
    </form>
  </div>
</template>
