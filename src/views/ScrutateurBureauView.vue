<template>
  <main class="page">
    <div class="container">

      <div v-if="loading" class="spinner"></div>

      <template v-else-if="bureau">
        <!-- Header -->
        <div class="saisie-header">
          <router-link to="/scrutateur" class="btn btn--fantome btn--sm">← Retour</router-link>
          <div>
            <h1 class="section-title">Bureau {{ bureau.numero }} — {{ bureau.nom }}</h1>
            <p class="section-subtitle">{{ bureau.adresse }}</p>
          </div>
          <span class="badge" :class="bureau.depouillementTermine ? 'badge--vert' : 'badge--or'">
            {{ bureau.depouillementTermine ? '✓ Terminé' : 'En cours' }}
          </span>
        </div>

        <div class="alert alert--succes" v-if="messageSucces">{{ messageSucces }}</div>
        <div class="alert alert--erreur" v-if="messageErreur">{{ messageErreur }}</div>

        <!-- BLOC 1 : Informations bureau -->
        <section class="card section-bloc" style="margin-bottom: 1.5rem">
          <h2 class="bloc-titre">Informations générales</h2>
          <div class="grille-2" style="margin-bottom: 1rem">
            <div class="form-group">
              <label class="form-label">Nombre d'inscrits</label>
              <input v-model.number="formBureau.inscrits" type="number" min="0" class="form-control" />
            </div>
          </div>
          <div class="grille-4">
            <div class="form-group">
              <label class="form-label">Bulletins dépouillés</label>
              <input v-model.number="formBureau.bulletinsDepouilles" type="number" min="0" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Bulletins nuls</label>
              <input v-model.number="formBureau.bulletinsNuls" type="number" min="0" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Bulletins blancs</label>
              <input v-model.number="formBureau.bulletinsBlancs" type="number" min="0" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label">Dépouillement terminé</label>
              <select v-model="formBureau.depouillementTermine" class="form-control">
                <option :value="false">Non</option>
                <option :value="true">Oui — résultat final</option>
              </select>
            </div>
          </div>
          <button class="btn btn--primaire" @click="sauvegarderBureau" :disabled="savingBureau">
            {{ savingBureau ? 'Sauvegarde...' : '💾 Enregistrer les infos' }}
          </button>
        </section>

        <!-- BLOC 2 : Participation par heure -->
        <section class="card section-bloc" style="margin-bottom: 1.5rem">
          <h2 class="bloc-titre">Taux de participation</h2>
          <p class="bloc-description">
            Indiquez le nombre de votants cumulé à chaque émargement horaire.
            Inscrits : <strong>{{ bureau.inscrits }}</strong>
          </p>

          <div class="participation-grille">
            <div v-for="heure in heures" :key="heure.code" class="participation-item card">
              <div class="participation-heure">{{ heure.label }}</div>
              <div class="participation-taux" v-if="getParticipation(heure.code)">
                {{ taux(getParticipation(heure.code).votants).toFixed(1) }}%
              </div>
              <div class="form-group" style="margin-bottom: 0.5rem">
                <label class="form-label">Votants</label>
                <input
                  v-model.number="participationForm[heure.code]"
                  type="number"
                  min="0"
                  :max="bureau.inscrits"
                  class="form-control"
                  :placeholder="getParticipation(heure.code)?.votants ?? 0"
                />
              </div>
              <button
                class="btn btn--succes btn--sm"
                @click="sauvegarderParticipation(heure.code)"
                :disabled="participationForm[heure.code] === null || participationForm[heure.code] === undefined"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </section>

        <!-- BLOC 3 : Résultats -->
        <section class="card section-bloc" v-if="store.candidats.length > 0">
          <h2 class="bloc-titre">Résultats des candidats</h2>
          <p class="bloc-description">
            Saisissez les voix obtenues pour chaque candidat.
            Total des bulletins dépouillés : <strong>{{ formBureau.bulletinsDepouilles || bureau.bulletinsDepouilles }}</strong>
          </p>

          <div class="resultats-saisie">
            <div v-for="candidat in store.candidats" :key="candidat.id" class="candidat-saisie-row">
              <div class="candidat-bande" :style="{ background: candidat.couleur }"></div>
              <div class="candidat-saisie-info">
                <strong>{{ candidat.prenom }} {{ candidat.nom }}</strong>
                <span style="font-size: 0.8rem; color: var(--texte-doux)">{{ candidat.liste }}</span>
              </div>
              <div class="candidat-saisie-pct" v-if="resultatForm[candidat.id] > 0 && totalVoixSaisies > 0">
                {{ ((resultatForm[candidat.id] / totalVoixSaisies) * 100).toFixed(1) }}%
              </div>
              <div class="form-group" style="margin-bottom: 0; width: 140px">
                <label class="form-label" :for="`voix-${candidat.id}`">Voix</label>
                <input
                  :id="`voix-${candidat.id}`"
                  v-model.number="resultatForm[candidat.id]"
                  type="number"
                  min="0"
                  class="form-control"
                  :placeholder="getResultat(candidat.id)?.voix ?? 0"
                />
              </div>
            </div>
          </div>

          <div class="resultats-saisie-footer">
            <div class="total-voix">Total saisi : <strong>{{ totalVoixSaisies }}</strong> voix</div>
            <div style="display: flex; gap: 0.75rem">
              <button class="btn btn--primaire" @click="sauvegarderResultats(false)" :disabled="savingResultats">
                {{ savingResultats ? '...' : '💾 Enregistrer (partiel)' }}
              </button>
              <button class="btn btn--succes" @click="sauvegarderResultats(true)" :disabled="savingResultats">
                {{ savingResultats ? '...' : '✓ Enregistrer comme résultat final' }}
              </button>
            </div>
          </div>
        </section>

        <div v-else class="alert alert--info">
          Aucun candidat n'a été configuré. Contactez l'administrateur.
        </div>

      </template>

      <div v-else class="alert alert--erreur">Bureau introuvable ou accès non autorisé.</div>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useElectionStore } from '@/stores/election'
import { useAuthStore } from '@/stores/auth'
import { scrutateurAPI } from '@/api'

const route = useRoute()
const store = useElectionStore()
const auth = useAuthStore()

const loading = ref(true)
const bureau = ref(null)
const messageSucces = ref('')
const messageErreur = ref('')
const savingBureau = ref(false)
const savingResultats = ref(false)

const heures = [
  { code: '09:00', label: '9h00' },
  { code: '11:00', label: '11h00' },
  { code: '14:00', label: '14h00' },
  { code: '17:00', label: '17h00' },
  { code: 'final', label: 'Clôture' },
]

const formBureau = reactive({
  inscrits: 0,
  bulletinsDepouilles: 0,
  bulletinsNuls: 0,
  bulletinsBlancs: 0,
  depouillementTermine: false,
})

const participationForm = reactive({})
const resultatForm = reactive({})

const totalVoixSaisies = computed(() =>
  Object.values(resultatForm).reduce((s, v) => s + (Number(v) || 0), 0)
)

function getParticipation(heure) {
  return bureau.value?.participations.find(p => p.heure === heure)
}

function getResultat(candidatId) {
  return bureau.value?.resultats.find(r => r.candidatId === candidatId)
}

function taux(votants) {
  if (!bureau.value?.inscrits) return 0
  return (votants / bureau.value.inscrits) * 100
}

function remplirFormulaires() {
  if (!bureau.value) return
  formBureau.inscrits = bureau.value.inscrits
  formBureau.bulletinsDepouilles = bureau.value.bulletinsDepouilles
  formBureau.bulletinsNuls = bureau.value.bulletinsNuls
  formBureau.bulletinsBlancs = bureau.value.bulletinsBlancs
  formBureau.depouillementTermine = bureau.value.depouillementTermine

  // Pre-fill with existing participation
  for (const p of bureau.value.participations) {
    participationForm[p.heure] = p.votants
  }

  // Pre-fill with existing results
  for (const r of bureau.value.resultats) {
    resultatForm[r.candidatId] = r.voix
  }
  // Init empty for all candidats
  for (const c of store.candidats) {
    if (resultatForm[c.id] === undefined) resultatForm[c.id] = null
  }
}

function showMessage(msg, type = 'succes') {
  if (type === 'succes') { messageSucces.value = msg; messageErreur.value = '' }
  else { messageErreur.value = msg; messageSucces.value = '' }
  setTimeout(() => { messageSucces.value = ''; messageErreur.value = '' }, 3000)
}

async function sauvegarderBureau() {
  savingBureau.value = true
  try {
    await store.mettreAJourBureau(bureau.value.id, { ...formBureau })
    bureau.value = await store.chargerBureau(bureau.value.id)
    showMessage('Informations enregistrées ✓')
  } catch (e) {
    showMessage(e.response?.data?.reason || 'Erreur lors de la sauvegarde', 'erreur')
  } finally {
    savingBureau.value = false
  }
}

async function sauvegarderParticipation(heure) {
  const votants = participationForm[heure]
  if (votants === null || votants === undefined) return
  try {
    await scrutateurAPI.upsertParticipation(bureau.value.id, heure, votants)
    bureau.value = await store.chargerBureau(bureau.value.id)
    showMessage(`Participation de ${heure} enregistrée ✓`)
  } catch (e) {
    showMessage(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}

async function sauvegarderResultats(estFinal) {
  savingResultats.value = true
  try {
    const bulletinsDepouilles = formBureau.bulletinsDepouilles || bureau.value.bulletinsDepouilles
    const promises = store.candidats
      .filter(c => resultatForm[c.id] !== null && resultatForm[c.id] !== undefined)
      .map(c =>
        scrutateurAPI.upsertResultat(bureau.value.id, {
          candidatId: c.id,
          voix: Number(resultatForm[c.id]) || 0,
          bulletinsDepouilles,
          estFinal,
        })
      )
    await Promise.all(promises)
    bureau.value = await store.chargerBureau(bureau.value.id)
    showMessage(estFinal ? 'Résultats finaux enregistrés ✓' : 'Résultats partiels enregistrés ✓')
  } catch (e) {
    showMessage(e.response?.data?.reason || 'Erreur lors de la sauvegarde', 'erreur')
  } finally {
    savingResultats.value = false
  }
}

onMounted(async () => {
  await store.chargerCandidats()
  bureau.value = await store.chargerBureau(route.params.id)
  if (bureau.value) {
    // Check authorization
    if (!auth.canAccessBureau(bureau.value.id)) {
      bureau.value = null
      loading.value = false
      return
    }
    remplirFormulaires()
  }
  loading.value = false
})
</script>

<style scoped>
.saisie-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.section-bloc {}

.bloc-titre {
  font-family: var(--font-titre);
  font-size: 1.3rem;
  color: var(--bleu-nuit);
  margin-bottom: 0.5rem;
}

.bloc-description {
  font-size: 0.9rem;
  color: var(--texte-doux);
  margin-bottom: 1.25rem;
}

/* Participation */
.participation-grille {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.75rem;
  margin-bottom: 0;
}

.participation-item {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border: 1px solid var(--gris-clair);
}

.participation-heure {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--bleu-nuit);
}

.participation-taux {
  font-family: var(--font-titre);
  font-size: 1.6rem;
  color: var(--bleu-rep);
  line-height: 1;
}

/* Résultats saisie */
.resultats-saisie {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.candidat-saisie-row {
  display: grid;
  grid-template-columns: 6px 1fr auto auto;
  align-items: center;
  gap: 1rem;
  background: var(--creme);
  border-radius: var(--rayon);
  padding: 0.9rem 1rem;
}

.candidat-bande { width: 6px; height: 40px; border-radius: 3px; }

.candidat-saisie-info {
  display: flex;
  flex-direction: column;
}

.candidat-saisie-pct {
  font-family: var(--font-titre);
  font-size: 1.25rem;
  color: var(--bleu-rep);
  min-width: 60px;
  text-align: right;
}

.resultats-saisie-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--gris-clair);
}

.total-voix {
  font-size: 0.9rem;
  color: var(--texte-doux);
}

@media (max-width: 900px) {
  .participation-grille { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 600px) {
  .participation-grille { grid-template-columns: repeat(2, 1fr); }
}
</style>
