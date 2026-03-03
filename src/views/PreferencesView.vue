<template>
  <main class="page">
    <div class="container" style="max-width: 600px">
      <header class="page-header" style="margin-bottom: 2rem">
        <h1 class="section-title">Mes préférences</h1>
        <p class="section-subtitle">Informations vous concernant</p>
      </header>

      <div class="alert alert--succes" v-if="messageSucces">{{ messageSucces }}</div>
      <div class="alert alert--erreur" v-if="messageErreur">{{ messageErreur }}</div>

      <!-- Chargement initial -->
      <div v-if="chargement" style="text-align: center; padding: 3rem 0">
        <div class="spinner"></div>
        <p style="margin-top: 1rem; color: var(--texte-doux)">Chargement de vos informations…</p>
      </div>

      <div v-else class="card" style="padding: 1.75rem">
        <form @submit.prevent="sauvegarder">

          <!-- Identité -->
          <h3 class="section-pref">Identité</h3>

          <div class="form-group">
            <label class="form-label">Nom complet</label>
            <input v-model="form.nom" type="text" class="form-control" placeholder="Votre nom" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="form.email" type="email" class="form-control" placeholder="votre@email.fr" required />
          </div>

          <div class="form-group">
            <label class="form-label">
              Nouveau mot de passe
              <span style="font-weight: 400; color: var(--texte-doux); font-size: 0.85rem"> — laisser vide pour ne pas modifier</span>
            </label>
            <input v-model="form.password" type="password" class="form-control" autocomplete="new-password" />
          </div>

          <hr class="pref-separator" />

          <!-- Affichage -->
          <h3 class="section-pref">Disponibilité</h3>

          <div class="form-group">
            <label class="form-label">Bureau </label>
            <select v-model="form.dispBureau" class="form-control">
              <option :value="null">— Aucun —</option>
              <option v-for="b in electionStore.bureaux" :key="b.id" :value="b.id">
                Bureau {{ b.numero }} — {{ b.nom }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Fonctions</label>
            <div style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.25rem">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.dispAssesseur" />
                Assesseur
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.dispDélégué" />
                Délégué
              </label>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem">
            <button type="submit" class="btn btn--primaire" :disabled="auth.loading">
              {{ auth.loading ? 'Enregistrement…' : 'Enregistrer' }}
            </button>
          </div>

        </form>
      </div>

      <!-- Info lecture seule -->
      <div v-if="!chargement" class="card" style="padding: 1.25rem 1.75rem; margin-top: 1.25rem; background: var(--creme)">
        <p style="font-size: 0.85rem; color: var(--texte-doux); margin: 0">
          <strong>Rôle :</strong>
          <span class="badge" :class="auth.user?.role === 'admin' ? 'badge--rouge' : 'badge--bleu'" style="margin-left: 0.5rem">
            {{ auth.user?.role }}
          </span>
          &nbsp;·&nbsp;
          <strong>Bureaux assignés :</strong> {{ bureauxLabel }}
        </p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useElectionStore } from '@/stores/election'
import {scrutateurAPI} from "@/api";

const auth = useAuthStore()
const electionStore = useElectionStore()

const messageSucces = ref('')
const messageErreur = ref('')
const chargement = ref(true)   // masque le formulaire tant que les données ne sont pas prêtes
const user = ref(undefined);
const form = reactive({
  nom: '',
  email: '',
  password: '',
  dispBureau: null,
  dispAssesseur: false,
  dispDélégué: false,
})

function remplirFormulaire() {
  if (!user.value) return
  form.nom           = user.nom           ?? ''
  form.email         = user.email         ?? ''
  form.password      = ''
  form.dispBureau    = user.dispBureau    ?? null
  form.dispAssesseur = user.dispAssesseur ?? false
  form.dispDélégué   = user.dispDélégué   ?? false
}

const bureauxLabel = computed(() => {
  const ids = auth.user?.bureaux || []
  if (ids.length === 0) return 'Aucun'
  return ids
    .map(id => {
      const b = electionStore.bureaux.find(b => b.id === id)
      return b ? `Bureau ${b.numero}` : id
    })
    .join(', ')
})

async function sauvegarder() {
  messageSucces.value = ''
  messageErreur.value = ''

  const payload = {
    nom:           form.nom,
    email:         form.email,
    dispBureau:    form.dispBureau || null,
    dispAssesseur: form.dispAssesseur,
    dispDélégué:   form.dispDélégué,
  }
  if (form.password) payload.password = form.password

  const ok = await auth.mettreAJourProfil(user.id,payload)
  if (ok) {
    form.password = ''
    messageSucces.value = 'Préférences enregistrées ✓'
    setTimeout(() => { messageSucces.value = '' }, 3500)
  } else {
    messageErreur.value = auth.error || 'Erreur lors de la sauvegarde'
    setTimeout(() => { messageErreur.value = '' }, 4000)
  }
}

onMounted(async () => {
  // Chargement parallèle : profil à jour depuis le backend + liste des bureaux

  user.value = await scrutateurAPI.chargerMe()
  const ok = await electionStore.chargerBureaux()

  if (!user.value || !ok) {
    messageErreur.value = auth.error || 'Impossible de charger vos informations'
  }

  // Remplissage du formulaire avec les données fraîches
  remplirFormulaire()
  chargement.value = false
})
</script>

<style scoped>
.section-pref {
  font-family: var(--font-titre);
  font-size: 1rem;
  color: var(--bleu-nuit);
  margin-bottom: 1rem;
}

.pref-separator {
  border: none;
  border-top: 1px solid var(--gris-clair);
  margin: 1.5rem 0;
}

.form-hint {
  font-size: 0.82rem;
  color: var(--texte-doux);
  margin-top: 0.3rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  accent-color: var(--bleu-rep);
}
</style>
