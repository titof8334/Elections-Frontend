<template>
  <div>
    <AppNavbar />
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import AppNavbar from '@/components/AppNavbar.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
onMounted(async () => {
  await auth.ensureInit()  // ← au lieu de auth.initFromOidc()
})
</script>
