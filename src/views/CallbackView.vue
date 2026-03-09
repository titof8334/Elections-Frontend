<template>
  <main class="page page-callback">
    <div class="callback-box">
      <div v-if="erreur" class="alert alert--erreur">
        <strong>Erreur de connexion</strong>
        <p>{{ erreur }}</p>
        <router-link to="/login" class="btn btn--primaire" style="margin-top: 1rem">
          Réessayer
        </router-link>
      </div>
      <div v-else class="callback-chargement">
        <div class="spinner"></div>
        <p>Connexion en cours…</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { handleCallback } from '@/services/oidc'
import { useAuthStore } from '@/stores/auth'
import { useElectionStore } from '@/stores/election'

const router = useRouter()
const auth  = useAuthStore()
const erreur = ref(null)
const store = useElectionStore()

onMounted(async () => {
  try {
    // Échange le code d'autorisation contre les tokens Zitadel
    const oidcUser = await handleCallback()

    // Charge le profil applicatif (rôle + bureaux) depuis le backend
    const ok = await auth.initFromOidc()

    if (!ok) {
      erreur.value = auth.error || 'Impossible de récupérer le profil utilisateur.'
      return
    }
    let redirectTo = oidcUser?.state ?? '/'
    // Redirige vers la route demandée avant le login, ou /scrutateur par défaut
    if(auth.user.elections.length == 1) {
      store.electionCourante = auth.user.elections[0]
    }
    if(auth.user.isAdmin) {
      redirectTo = '/admin'
    } else if(store.electionCourante) {
      if(store.electionCourante.isOwner) {
        redirectTo = '/admin'
      } else if(store.electionCourante.role == 'delegue') {
        redirectTo = '/scrutateur'
      }
    }
    router.replace(redirectTo)
  } catch (e) {
    console.error('[OIDC Callback]', e)
    erreur.value = e.message || 'Une erreur inattendue est survenue.'
  }
})
</script>

<style scoped>
.page-callback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bleu-nuit) 0%, var(--bleu-rep) 100%);
}

.callback-box {
  background: var(--blanc);
  border-radius: var(--rayon-lg);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.callback-chargement {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--texte-doux);
}
</style>
