<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

/* servicios */
import { listBikes, deleteBike } from '@/services/bikes'

/* UI */
import BaseHeading1 from '@/components/ui/BaseHeading1.vue'
import BaseButton   from '@/components/ui/BaseButton.vue'
import BaseAlert    from '@/components/ui/BaseAlert.vue'
import IconLucide   from '@/components/ui/IconLucide.vue'
import Loader       from '@/components/ui/Loader.vue'

/* estado */
const bikes          = ref([])
const loading        = ref(true)

const showModal      = ref(false)
const bikeToErase    = ref(null)

const showWarnActive = ref(false)
let warnTimeoutId    = null

const router = useRouter()

onMounted(async () => {
  bikes.value   = await listBikes()
  loading.value = false
})

/* navegación */
const gotoAdd = () => router.push('/my-bikes/new')
const goBack  = () => router.push('/profile/me')

/* abrir modal o alerta */
function onDeleteClick (bike) {
  if (bike.is_active) {
    clearTimeout(warnTimeoutId)
    showWarnActive.value = true
    warnTimeoutId = setTimeout(() => (showWarnActive.value = false), 2000)
    return
  }
  bikeToErase.value = bike
  showModal.value   = true
}

/* confirmar eliminación */
async function confirmDelete () {
  await deleteBike(bikeToErase.value.id)
  bikes.value     = await listBikes()
  showModal.value = false
  bikeToErase.value = null
}
</script>

<template>
  <div class="max-w-xl mx-auto sm:mt-8 bg-neutral-800 text-white p-6 sm:rounded-lg shadow-md mb-6">
    <!-- contenedor principal, misma estética que MyProfileEdit -->
    <section class="w-full max-w-xl">
      <!-- loader -->
      <div v-if="loading" class="flex justify-center my-12">
        <Loader class="w-10 h-10 border-4" />
      </div>

      <!-- sin motos -->
      <div v-else-if="!bikes.length" class="text-center space-y-6">
        <IconLucide name="Warehouse" :size="48" class="text-gray-500 mx-auto" />
        <p>Aún no cargaste ninguna moto.</p>
        <BaseButton type="orange" @click="gotoAdd" class="mx-auto">
          <template #icon><IconLucide name="Plus" :size="20" /></template>
          Agregar moto
        </BaseButton>
      </div>

      <!-- listado -->
      <div v-else>
        <BaseHeading1 class="mb-6">
          Mis motos ({{ bikes.length }}/5)
        </BaseHeading1>

        <!-- alerta -->
        <BaseAlert
          v-if="showWarnActive"
          message="No podés eliminar tu moto activa. Activa otra primero."
          type="error"
        />

        <!-- tarjetas -->
        <div class="space-y-3">
          <div v-for="b in bikes" :key="b.id"
               class="flex items-center gap-3 p-3 rounded bg-neutral-700/40">
            <img :src="b.photo_url" class="w-14 h-14 rounded object-cover" />

            <div class="flex-1 text-sm">
              <p class="font-medium">{{ b.brand }} {{ b.model }}</p>
              <p class="text-gray-400 text-xs">{{ b.year }} · {{ b.color }}</p>
            </div>

            <IconLucide
              v-if="b.is_active"
              name="CheckCircle2"
              :size="22"
              class="text-orange-400"
            />

            <router-link :to="`/my-bikes/${b.id}/edit`">
              <BaseButton size="xs" type="orange">
                <IconLucide name="PencilLine" :size="16" />
              </BaseButton>
            </router-link>

            <BaseButton size="xs" type="error" @click="onDeleteClick(b)">
              <IconLucide name="Trash2" :size="16" />
            </BaseButton>
          </div>
        </div>

        <!-- botonera inferior -->
        <div class="flex justify-center sm:justify-end gap-4 items-center mt-4">
          <BaseButton
            type="gray"
            class="w-full sm:w-auto flex justify-center items-center gap-2"
            @click="goBack"
          >
            <IconLucide name="ArrowLeft" :size="18" />
            Volver
          </BaseButton>

          <BaseButton
            type="orange"
            :disabled="bikes.length >= 5"
            class="w-full sm:w-auto flex justify-center items-center gap-2"
            @click="gotoAdd"
          >
            <IconLucide name="Plus" :size="18" />
            Nueva
          </BaseButton>
        </div>

      </div>
    </section>

    <!-- Modal confirmación -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="showModal"
             class="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
             @keydown.esc="showModal = false">
          <div class="bg-neutral-800 text-white w-full max-w-md mx-4 p-6 rounded-lg shadow-lg"
               @click.stop>
            <!-- foto + nombre -->
            <img :src="bikeToErase?.photo_url"
                 class="w-32 h-32 rounded object-cover mx-auto mb-4" />

            <p class="text-center font-medium mb-4">
              {{ bikeToErase?.brand }} {{ bikeToErase?.model }}
            </p>

            <p class="text-sm text-gray-300 mb-6 text-center">
              ¿Seguro que querés eliminar esta moto?
            </p>

            <div class="flex justify-end gap-3">
              <BaseButton type="gray" size="sm" @click="showModal = false">
                Cancelar
              </BaseButton>

              <BaseButton type="error" size="sm" @click="confirmDelete">
                Eliminar
              </BaseButton>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s ease }
.fade-enter-from,  .fade-leave-to      { opacity: 0 }
</style>
