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
        <select v-model="selectedElectionId" @focus="store.chargerElections()" @change="selectElection(selectedElectionId)" class="nav-select" :class="{ 'nav-select--placeholder': !selectedElectionId }">
          <option value="" disabled>Choisir une élection</option>
          <template v-if="auth.user">
            <optgroup label="Mes élections">
              <template v-for="el in store.elections" :key="el.id">
                <option v-if="el.isSubscriber" :value="el.id">{{ el.nom }}</option>
              </template>
            </optgroup>
            <optgroup label="Autre élections">
              <template v-for="el in store.elections" :key="el.id">
                <option v-if="!el.isSubscriber" :value="el.id">{{ el.nom }}</option>
              </template>
            </optgroup>
          </template>
          <template v-else>
            <option v-for="el in store.elections" :key="el.id" :value="el.id">{{ el.nom }}</option>
          </template>
        </select>
        <template v-if="auth.user">
          <button v-if="!store.elections.find(e => e.id === selectedElectionId)?.isSubscriber" class="nav-link" @click="subscribe(selectedElectionId)">
            <i class="fa-solid fa-star"></i> <span class="nav-label">Soutenir</span>
          </button>
          <button v-else class="nav-link nav-link--accent" @click="unsubscribe(selectedElectionId)">
            <i class="fa-solid fa-star-half-stroke"></i> <span class="nav-label">Ne plus suivre</span>
          </button>
        </template>
      </router-link>
    </div>
  </nav>
  <div v-if="erreurNavbar" class="alert alert--erreur" style="margin: 0; border-radius: 0; text-align: center; font-size: 0.875rem">{{ erreurNavbar }}</div>
  <nav class="navbar">
    <div class="navbar__brand"/>
    <div class="navbar__nav">
      <router-link to="/" class="nav-link" :class="{ active: $route.name === '/accueil' }">
        <i class="fa-solid fa-broadcast-tower"></i> <span class="nav-label">Live</span>
      </router-link>

      <template v-if="!auth.isAuthenticated">
        <router-link to="/login" class="nav-link nav-link">
          <i class="fa-solid fa-right-to-bracket"></i> <span class="nav-label">Se connecter</span>
        </router-link>

      </template>
      <template v-else>
        <router-link v-if="store.electionCourante?.isOwner || store.electionCourante?.isScrutateur" to="/scrutateur" class="nav-link" :class="{ active: $route.path.startsWith('/scrutateur') }">
          <i class="fa-solid fa-building"></i> <span class="nav-label">Mes bureaux</span>
        </router-link>
        <router-link v-if="store.electionCourante?.isOwner" to="/gestion" class="nav-link" :class="{ active: $route.path.startsWith('/gestion') }">
          <i class="fa-solid fa-list-check"></i> <span class="nav-label">Gestion</span>
        </router-link>
        <router-link v-if="auth.isAdmin" to="/admin" class="nav-link" :class="{ active: $route.name === 'admin' }">
          <i class="fa-solid fa-gear"></i> <span class="nav-label">Admin</span>
        </router-link>
        <router-link to="/preferences" class="nav-link" :class="{ active: $route.name === 'preferences' }">
          <i class="fa-solid fa-user"></i> <span class="nav-label">Mon profil</span>
        </router-link>
        <button class="nav-link nav-link--accent" @click="logout">
          <i class="fa-solid fa-right-from-bracket"></i> <span class="nav-label">Déconnexion</span>
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { ref, onMounted, watch } from "vue";
import {useElectionStore} from "@/stores/election";
import {authUserAPI} from "@/api";

const auth = useAuthStore()
const router = useRouter()
const store = useElectionStore()
const selectedElectionId = ref('')
const erreurNavbar = ref('')

function showMessage(msg) {
  erreurNavbar.value = msg
  setTimeout(() => { erreurNavbar.value = '' }, 3500)
}

async function selectElection(id) {
  await store.chargerElection(id)
}

async function subscribe(electionId) {
  try {
    await authUserAPI.joinElection(electionId)
    await store.chargerElections(true)
  } catch (e) {
    showMessage(e.response?.data?.reason || 'Erreur à la souscription')
  }
}
async function unsubscribe(electionId) {
  try {
    await authUserAPI.leaveElection(electionId)
    await store.chargerElections(true)
  } catch (e) {
    showMessage(e.response?.data?.reason || 'Erreur à la désinscription')
  }
}
function logout() {
  auth.logout()
}

onMounted(async () => {
  await store.chargerElections()
  if(store.electionCourante) selectedElectionId.value = store.electionCourante.id
})

watch(() => store.electionCourante, () => {
  if(store.electionCourante) selectedElectionId.value = store.electionCourante.id
})

</script>
