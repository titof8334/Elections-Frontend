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
      <h1 class="login-titre">Espace Scrutateur</h1>
      <p class="login-sous-titre">Connectez-vous pour saisir les résultats</p>

      <div v-if="auth.error" class="alert alert--erreur">{{ auth.error }}</div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label" for="email">Adresse e-mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="form-control"
            placeholder="scrutateur@elections.fr"
            required
            autocomplete="email"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="password">Mot de passe</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control"
            placeholder="••••••••"
            required
            autocomplete="current-password"
          />
        </div>
        <button type="submit" class="btn btn--primaire btn--lg" style="width: 100%" :disabled="auth.loading">
          {{ auth.loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>

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
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')

async function handleLogin() {
  const ok = await auth.login(email.value, password.value)
  if (ok) router.push('/scrutateur')
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

.login-form { text-align: left; }

.login-retour {
  margin-top: 1.5rem;
  font-size: 0.85rem;
}
</style>
