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
        &nbsp;
        <template v-if="auth.user">
          <button v-if="!store.elections.find(e => e.id == selectedElectionId)?.isSubscriber" class="nav-link" @click="subscribe(selectedElectionId)">
            Soutenir
          </button>
          <button v-else class="nav-link nav-link--accent" @click="unsubscribe(selectedElectionId)">
            Ne plus suivre
          </button>
        </template>
      </router-link>
    </div>
  </nav>
  <nav class="navbar">
    <div class="navbar__brand"/>
    <div class="navbar__nav">
      <router-link to="/" class="nav-link" :class="{ active: $route.name === '/accueil' }">
        Live
      </router-link>

      <template v-if="!auth.isAuthenticated">
        <router-link to="/login" class="nav-link nav-link--accent">
          Se connecter
        </router-link>
      </template>
      <template v-else>
        <router-link v-if="store.electionCourante?.isOwner || store.electionCourante?.isScrutateur" to="/scrutateur" class="nav-link" :class="{ active: $route.path.startsWith('/scrutateur') }">
          Mes bureaux
        </router-link>
        <router-link v-if="store.electionCourante?.isOwner" to="/gestion" class="nav-link" :class="{ active: $route.path.startsWith('/gestion') }">
          Gestion
        </router-link>
        <router-link v-if="auth.isAdmin" to="/admin" class="nav-link" :class="{ active: $route.name === 'admin' }">
          ⚙ Admin
        </router-link>
        <router-link to="/preferences" class="nav-link" :class="{ active: $route.name === 'preferences' }">
          Mon profil
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
import { ref, onMounted, watch } from "vue";
import {useElectionStore} from "@/stores/election";
import {authUserAPI} from "@/api";

const auth = useAuthStore()
const router = useRouter()
const store = useElectionStore()
const selectedElectionId = ref('')

async function selectElection(id) {
  await store.chargerElection(id)
}

async function subscribe(electionId) {
  await authUserAPI.joinElection(electionId)
  await store.chargerElections(true)
}
async function unsubscribe(electionId) {
  await authUserAPI.leaveElection(electionId)
  await store.chargerElections(true)

}
function logout() {
  auth.logout()
  store.clearStore()
  router.push('/')
}

onMounted(async () => {
  await store.chargerElections()
  if(store.electionCourante) selectedElectionId.value = store.electionCourante.id
})

watch(() => store.electionCourante, () => {
  if(store.electionCourante) selectedElectionId.value = store.electionCourante.id
})

</script>
