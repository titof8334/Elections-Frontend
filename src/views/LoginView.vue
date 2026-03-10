<template>
  <main class="page page-login">
    <div class="login-box">
      <div class="login-logo">
        <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="13" height="40" fill="#003189"/>
          <rect x="13" y="0" width="14" height="40" fill="#f5f0e8"/>
          <rect x="27" y="0" width="13" height="40" fill="#c8102e"/>
          <circle cx="20" cy="20" r="8" fill="none" stroke="#c9a84c" stroke-width="1.5"/>
          <text x="20" y="24" text-anchor="middle" font-size="9" fill="#c9a84c" font-weight="bold">✓</text>
        </svg>
      </div>
      <h1 class="login-titre">Espace Délégués</h1>
      <p class="login-sous-titre">Connectez-vous avec votre compte organisationnel</p>

      <div v-if="erreur" class="alert alert--erreur">{{ erreur }}</div>

      <button
        class="btn btn--primaire btn--lg btn--sso"
        :disabled="chargement"
        @click="handleSSO"
      >
        <svg v-if="!chargement" class="sso-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        <span>{{ chargement ? 'Redirection…' : 'Se connecter via SSO' }}</span>
      </button>

      <div class="login-retour">
        <router-link to="/" class="nav-link" style="color: var(--bleu-rep)">
          ← Retour aux résultats publics
        </router-link>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth       = useAuthStore()
const route      = useRoute()
const chargement = ref(false)
const erreur     = ref(null)

async function handleSSO() {
  chargement.value = true
  erreur.value     = null
  try {
    const redirectTo = route.query.redirect || '/'
    await auth.loginWithSSO(redirectTo)
    // La page est redirigée vers Zitadel — la suite se passe dans CallbackView
  } catch (e) {
    console.error('[SSO] signinRedirect a échoué :', e)
    const detail = e?.message || e?.error_description || String(e)
    erreur.value     = `Impossible de contacter le service d'authentification. Détail : ${detail}`
    chargement.value = false
  }
}
</script>

<style scoped>
.page-login {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bleu-nuit) 0%, var(--bleu-rep) 100%);
}

.login-box {
  background: var(--blanc);
  border-radius: var(--rayon-lg);
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
}

.login-logo { margin-bottom: 1.25rem; }

.login-titre {
  font-family: var(--font-titre);
  font-size: 1.75rem;
  color: var(--bleu-nuit);
  margin-bottom: 0.35rem;
}

.login-sous-titre {
  color: var(--texte-doux);
  font-size: 0.9rem;
  margin-bottom: 1.75rem;
}

.btn--sso {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
}

.sso-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
}

.login-retour {
  margin-top: 1.5rem;
  font-size: 0.85rem;
}
</style>
