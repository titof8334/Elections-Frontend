<template>
  <nav class="navbar">
    <div class="navbar__brand">
      <svg class="navbar__logo" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- French tricolor flag stylized -->
        <rect x="0" y="0" width="13" height="40" fill="#003189"/>
        <rect x="13" y="0" width="14" height="40" fill="#f5f0e8"/>
        <rect x="27" y="0" width="13" height="40" fill="#c8102e"/>
        <circle cx="20" cy="20" r="8" fill="none" stroke="#c9a84c" stroke-width="1.5"/>
        <text x="20" y="24" text-anchor="middle" font-size="9" fill="#c9a84c" font-weight="bold">✓</text>
      </svg>
      <router-link to="/" class="navbar__title">
        Élections <span>2024</span>
      </router-link>
    </div>

    <div class="navbar__nav">
      <router-link to="/" class="nav-link" :class="{ active: $route.name === 'accueil' }">
        Résultats live
      </router-link>

      <template v-if="!auth.isAuthenticated">
        <router-link to="/login" class="nav-link nav-link--accent">
          Espace scrutateur
        </router-link>
      </template>

      <template v-else>
        <router-link to="/scrutateur" class="nav-link" :class="{ active: $route.path.startsWith('/scrutateur') }">
          Mes bureaux
        </router-link>
        <router-link v-if="auth.isAdmin" to="/admin" class="nav-link" :class="{ active: $route.name === 'admin' }">
          ⚙ Admin
        </router-link>
        <button class="nav-link nav-link--accent" @click="logout">
          Déconnexion
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
  router.push('/')
}
</script>
