<script setup>
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import IconLucide from '@/components/ui/IconLucide.vue'
import { deleteBike, setActiveBike } from '@/services/bikes'

// Garaje del perfil propio: "Tu moto" (la activa) grande y las demás en lista, cada una con
// su menú. Es el único lugar donde se administran las motos.

const MAX_BIKES = 5

const props = defineProps({
  bikes: { type: Array, required: true },
  activeId: { type: String, default: null },
})
const emit = defineEmits(['changed', 'error'])

const active = computed(() => props.bikes.find((b) => b.id === props.activeId) ?? null)
const others = computed(() => props.bikes.filter((b) => b.id !== props.activeId))
const full = computed(() => props.bikes.length >= MAX_BIKES)

const busyId = ref(null)
const toDelete = ref(null)

const nameOf = (b) => `${b.brand} ${b.model}`
const metaOf = (b) => [b.year, b.color].filter(Boolean).join(' · ')

async function activate(bike) {
  busyId.value = bike.id
  try {
    await setActiveBike(bike.id)
    emit('changed')
  } catch (e) {
    emit('error', e.message)
  } finally {
    busyId.value = null
  }
}

async function confirmDelete() {
  const bike = toDelete.value
  busyId.value = bike.id
  try {
    const rest = props.bikes.filter((b) => b.id !== bike.id)
    await deleteBike({ ...bike, is_active: bike.id === props.activeId }, rest)
    toDelete.value = null
    emit('changed')
  } catch (e) {
    emit('error', e.message)
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <section aria-label="Garaje">
    <!-- Sin motos -->
    <div v-if="!bikes.length" class="flex flex-col items-center gap-3 py-10 text-center">
      <span class="grid size-14 place-items-center rounded-full bg-primary/15">
        <IconLucide name="Motorbike" :size="26" class="text-primary" />
      </span>
      <p class="font-medium">Cargá tu moto</p>
      <p class="max-w-xs text-sm text-muted-foreground">
        Se muestra en tu perfil y es la que ven los demás cuando miran tus rutas.
      </p>
      <Button as-child class="mt-1">
        <router-link to="/garaje/nueva">
          <IconLucide name="Plus" :size="16" />
          Agregar moto
        </router-link>
      </Button>
    </div>

    <template v-else>
      <!-- Tu moto -->
      <article
        v-if="active"
        class="overflow-hidden rounded-2xl border border-border bg-card"
        aria-label="Tu moto"
      >
        <div class="relative aspect-[16/10] bg-muted">
          <img
            v-if="active.photo_url"
            :src="active.photo_url"
            :alt="nameOf(active)"
            class="size-full object-cover"
          />
          <span v-else class="grid size-full place-items-center">
            <IconLucide name="Motorbike" :size="56" class="text-muted-foreground/50" />
          </span>
          <span
            class="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
          >
            <IconLucide name="Check" :size="12" :stroke-width="3" />
            Tu moto
          </span>
        </div>
        <div class="flex items-center gap-2 p-4 pr-2">
          <div class="min-w-0 flex-1">
            <p class="truncate text-lg font-semibold">{{ nameOf(active) }}</p>
            <p class="text-sm text-muted-foreground">{{ metaOf(active) }}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="size-11"
                :aria-label="`Opciones de ${nameOf(active)}`"
              >
                <IconLucide name="EllipsisVertical" :size="18" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem as-child>
                <router-link :to="`/garaje/${active.id}/editar`">
                  <IconLucide name="PencilLine" :size="16" />
                  Editar
                </router-link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="toDelete = active">
                <IconLucide name="Trash2" :size="16" />
                Borrar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </article>

      <!-- Las demás -->
      <template v-if="others.length">
        <h3 class="mt-6 mb-2 text-sm font-medium text-muted-foreground">
          {{ active ? 'Otras motos' : 'Tus motos' }}
        </h3>
        <ul class="space-y-2">
          <li
            v-for="b in others"
            :key="b.id"
            class="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 pr-1"
          >
            <img
              v-if="b.photo_url"
              :src="b.photo_url"
              alt=""
              class="size-16 shrink-0 rounded-lg object-cover"
            />
            <span v-else class="grid size-16 shrink-0 place-items-center rounded-lg bg-muted">
              <IconLucide name="Motorbike" :size="24" class="text-muted-foreground/60" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{{ nameOf(b) }}</p>
              <p class="text-xs text-muted-foreground">{{ metaOf(b) }}</p>
            </div>
            <Button variant="outline" size="sm" :disabled="busyId === b.id" @click="activate(b)">
              Usar esta
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-11"
                  :aria-label="`Opciones de ${nameOf(b)}`"
                >
                  <IconLucide name="EllipsisVertical" :size="18" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem as-child>
                  <router-link :to="`/garaje/${b.id}/editar`">
                    <IconLucide name="PencilLine" :size="16" />
                    Editar
                  </router-link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" @select="toDelete = b">
                  <IconLucide name="Trash2" :size="16" />
                  Borrar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </template>

      <!-- Agregar -->
      <Button v-if="!full" as-child variant="outline" class="mt-4 h-12 w-full">
        <router-link to="/garaje/nueva">
          <IconLucide name="Plus" :size="16" />
          Agregar moto
          <span class="text-muted-foreground">({{ bikes.length }}/{{ MAX_BIKES }})</span>
        </router-link>
      </Button>
      <p v-else class="mt-4 text-center text-sm text-muted-foreground">
        Tenés {{ MAX_BIKES }} motos, el máximo. Borrá una para agregar otra.
      </p>
    </template>

    <!-- Confirmar borrado -->
    <Dialog :open="!!toDelete" @update:open="(v) => !v && (toDelete = null)">
      <DialogContent class="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Borrar {{ toDelete && nameOf(toDelete) }}?</DialogTitle>
          <DialogDescription>
            Se borra con su foto y no se puede deshacer.
            <template v-if="toDelete?.id === activeId && others.length">
              Tu moto pasa a ser {{ nameOf(others[0]) }}.
            </template>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" @click="toDelete = null">Cancelar</Button>
          <Button variant="destructive" :disabled="busyId === toDelete?.id" @click="confirmDelete">
            {{ busyId === toDelete?.id ? 'Borrando…' : 'Borrar moto' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
