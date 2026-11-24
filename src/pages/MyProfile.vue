<script setup>
import ProfileView from '@/components/profile/ProfileView.vue'
import { useAuthStore } from '@/stores/auth'

// Mi perfil: la misma vitrina que ven los demás, con editar, salir y el garaje completo
defineOptions({ name: 'MyProfile' })

const auth = useAuthStore()
</script>

<template>
  <ProfileView v-if="auth.user" :user-id="auth.user.id" is-own />
</template>
