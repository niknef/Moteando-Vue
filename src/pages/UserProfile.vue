<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProfileView from '@/components/profile/ProfileView.vue'
import { useAuthStore } from '@/stores/auth'

// Perfil de otro motero (/usuario/:id). Si es el propio, va a /perfil
defineOptions({ name: 'UserProfile' })

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const userId = computed(() => route.params.id)

watchEffect(() => {
  if (auth.user && userId.value === auth.user.id) router.replace('/perfil')
})
</script>

<template>
  <ProfileView v-if="userId !== auth.user?.id" :user-id="userId" />
</template>
