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
        <form>

          <!-- Identité -->
          <h3 class="section-pref">Identité</h3>

          <div class="form-group">
            <label class="form-label">Nom</label>
            <input v-model="form.nom" type="text" class="form-control" placeholder="Votre nom" required />
          </div>
          <div class="form-group">
            <label class="form-label">Prénom</label>
            <input v-model="form.prenom" type="text" class="form-control" placeholder="Votre prénom" required />
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="form.email" type="email" class="form-control" placeholder="votre@email.fr" />
          </div>
          <div class="form-group">
            <span v-if="form.isAdmin" class="badge badge--rouge">Admin</span>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem">
            <button type="button" class="btn btn--primaire" :disabled="auth.loading" @click="sauvegarder">
              Mettre à jour mes informations
            </button>
          </div>

          <hr class="pref-separator" />
          <h3 class="section-pref">Préférences par élections</h3>
          <!-- Affichage -->
          <div class="form-group">
            <label class="form-label">Election </label>
            <select v-model="form.election" class="form-control">
              <option :value="null">— Aucune —</option>
              <option v-for="e in form.elections" :key="e.id" :value="e">
                {{ e.nom }}
              </option>
            </select>
          </div>
          <div class="form-group" v-if="form.election">
            <label class="form-label">Disponibilité </label>
            <select v-model="form.bureau" class="form-control">
              <option :value="null">— Aucun —</option>
              <option v-for="b in form.election.tousBureaux" :key="b.id" :value="b">
                {{ b.numero }} — {{ b.nom }}
              </option>
            </select>
            <label class="checkbox-label"><input type="checkbox" v-model="form.election.dispAssesseur" />Assesseur</label>
            <label class="checkbox-label"><input type="checkbox" v-model="form.election.dispDelegue" />Délégué</label>
          </div>
          <!-- Info lecture seule -->
          <template v-if="form.election && (form.election.role != 'aucun' || form.election.isOwner)">
            <div class="form-group">
              <label class="form-label">Attribution </label>
              <div class="card" style="padding: 1.0rem 1.0rem; margin-top: 0.5rem; background: var(--creme)">
                <p style="font-size: 0.85rem; color: var(--texte-doux); margin: 0">
                  <span v-if="form.election.isOwner" class="badge" :class="'badge--bleu'" style="margin-left: 0.5rem">Propriétaire</span>
                  <span v-if="form.election.role != 'aucun'" class="badge" :class="'badge--bleu'" style="margin-left: 0.5rem">{{ form.election.role }} {{ form.election.isTitulaire ? '(Titulaire)' : '(Suppléant)'}}</span>
                  {{ bureauxLabel }}
                </p>
              </div>
            </div>
          </template>

          <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem">
            <button type="button" class="btn btn--primaire" @click="sauvegarderElection">
              Mettre à jour mes choix pour cette élection
            </button>
          </div>

        </form>
      </div>
    </div>
  </main>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useElectionStore } from '@/stores/election'

const auth = useAuthStore()
const store = useElectionStore()

const messageSucces = ref('')
const messageErreur = ref('')
const chargement = ref(true)   // masque le formulaire tant que les données ne sont pas prêtes
const user = ref(undefined);
const form = reactive({
  nom: '',
  prenom: '',
  email: '',
  isAdmin: false,
  bureauId: undefined,
  elections: [],
  election: undefined,
  bureau: undefined
})

function remplirFormulaire() {
  if (!user.value) return
  const election = store.electionCourante
    ? user.value.elections.find(e => e.electionId == store.electionCourante.id)
    : undefined
  let bureau = election?.dispBureauId
    ? election.tousBureaux.find(b => b.id == election.dispBureauId)
    : (election?.tousBureaux?.length ? election.tousBureaux[0] : undefined)
  form.nom           = user.value.nom ?? ''
  form.prenom           = user.value.prenom ?? ''
  form.email         = user.value.email ?? ''
  form.isAdmin         = user.value.isAdmin ?? false
  form.bureauId         = user.value.isAdmin ? (bureau?.id ?? undefined) : undefined
  form.elections = user.value.elections
  form.election = election
  form.bureau = bureau
}

const bureauxLabel = computed(() => {
  if (form.election) {
    const ids = form.election.bureaux.map(b => b.bureauId) ?? []
    if (ids.length === 0) return ''
    return ids
        .map(id => {
          const b = form.election.tousBureaux.find(b => b.id === id)
          return b.numero + ' - ' + b.nom
        })
        .join(', ')
  }
  return ''
})

async function sauvegarder() {
  messageSucces.value = ''
  messageErreur.value = ''

  const payload = {
    nom:           form.nom,
    prenom:        form.prenom,
    email:         form.email,
  }
  const ok = await auth.mettreAJourProfil(payload)
  if (ok) {
    messageSucces.value = 'Préférences enregistrées ✓'
    setTimeout(() => { messageSucces.value = '' }, 3500)
  } else {
    messageErreur.value = auth.error || 'Erreur lors de la sauvegarde'
    setTimeout(() => { messageErreur.value = '' }, 4000)
  }
}

async function sauvegarderElection() {
  messageSucces.value = ''
  messageErreur.value = ''
  const payload = {
    dispBureauId:    form.bureau?.id ?? undefined,
    dispAssesseur: form.election.dispAssesseur,
    dispDelegue:   form.election.dispDelegue,
    periode: form.election.periode
  }

  const ok = await auth.mettreAJourProfilElection(form.election.id, payload)
  if (ok) {
    messageSucces.value = 'Préférences enregistrées ✓'
    setTimeout(() => { messageSucces.value = '' }, 3500)
  } else {
    messageErreur.value = auth.error || 'Erreur lors de la sauvegarde'
    setTimeout(() => { messageErreur.value = '' }, 4000)
  }
}

onMounted(async () => {
  // Chargement parallèle : profil à jour depuis le backend + liste des bureaux

  user.value = await store.chargerProfil()
  if (!user.value) {
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
