<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import IconLucide from '@/components/ui/IconLucide.vue'
import Loader from '@/components/ui/Loader.vue'
import PostCard from '@/components/route/PostCard.vue'
import { getLastPosts, subscribeToNewPosts } from '@/services/posts'

// Feed de salidas (Descubrir › Salidas). Las nuevas aparecen arriba en tiempo real.

const posts = ref([])
const loading = ref(true)
const error = ref('')
let channel = null

onMounted(async () => {
  try {
    posts.value = await getLastPosts()
    channel = subscribeToNewPosts((p) => {
      if (!posts.value.some((q) => q.id === p.id)) posts.value.unshift(p)
    })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => channel?.unsubscribe())
</script>

<template>
  <section>
    <div v-if="loading" class="grid place-items-center py-16"><Loader size="lg" /></div>
    <BaseAlert v-else-if="error" :message="error" type="error" />

    <div
      v-else-if="!posts.length"
      class="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground"
    >
      <span class="flex size-14 items-center justify-center rounded-full bg-primary/15">
        <IconLucide name="Camera" :size="26" class="text-primary" />
      </span>
      <p class="font-medium text-foreground">Todavía nadie contó una salida</p>
      <p class="max-w-xs text-sm">Hacé una de tus rutas y contala con fotos.</p>
    </div>

    <ul v-else class="space-y-4">
      <li v-for="p in posts" :key="p.id">
        <PostCard :post="p" />
      </li>
    </ul>
  </section>
</template>
