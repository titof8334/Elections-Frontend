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
          <h2 class="bloc-titre">Informations</h2>
          <div class="grille-4" style="margin-bottom: 1rem">
            <div v-if="etatBureau == 'ferme' || updateInscrits" class="form-group">
              <label class="form-label">Nombre d'inscrits</label>
              <input v-model.number="formBureau.inscrits" type="number" min="0" class="form-control" />
              <button v-if="updateInscrits" @click="majInscrits">Mettre à jour</button>
            </div>
            <div v-else class="form-group" @click="updateInscrits = true">
              <label class="form-label">Nombre d'inscrits</label>
              <strong>{{ formBureau.inscrits }}</strong>
            </div>
            <div v-if="updateVotants" class="form-group">
              <label class="form-label">Votants</label>
              <input v-model.number="formBureau.votants" type="number" min="0" class="form-control" />
              <button  v-if="updateVotants" @click="majVotants">Mettre à jour</button>
            </div>
            <div v-if="!updateVotants && etatBureau != 'ferme' && etatBureau != 'ouvert'" class="form-group" @click="updateVotants = true">
              <label class="form-label">Votants</label>
              <strong>{{ bureau.votants }}</strong>
            </div>
            <div v-if="etatBureau != 'ferme' && etatBureau != 'ouvert'" class="form-group">
              <label class="form-label">Exprimés</label>
              <strong>{{ bureau.exprimes }}</strong>
            </div>
            <div v-if="etatBureau == 'depouillement'" class="form-group">
              <label class="form-label">{{ etatBureau == 'depouillement' ? 'Bulletins dépouillés' : ''}}</label>
              <strong>{{ formBureau.bulletinsDepouilles }}</strong>
            </div>
            <div v-if="etatBureau == 'termine'" class="form-group">
              <label class="form-label">Bulletins blancs et nuls</label>
              <strong>{{ formBureau.bulletinsNuls + formBureau.bulletinsBlancs}}</strong>
            </div>
          </div>
          <button v-if="etatBureau == 'ferme'" class="btn btn--primaire" @click="sauvegarderBureau" :disabled="savingBureau">
            {{ savingBureau ? 'Sauvegarde...' : '💾 Enregistrer les infos' }}
          </button>
        </section>

        <!-- BLOC 2 : Participation par heure -->
        <section v-if="etatBureau == 'ouvert'" class="card section-bloc" style="margin-bottom: 1.5rem">
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
        <section v-if="etatBureau == 'depouillement' || etatBureau == 'termine'" class="card section-bloc">
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
              <div class="candidat-saisie-pct" v-if="resultatForm[candidat.id] > 0 && totalVoixExprimees > 0">
                <div>
                  Série : {{ ((resultatForm[candidat.id] / totalVoixExprimees) * 100).toFixed(1) }}%
                </div>
                <div>
                  Cumulé : {{ resultatForm[candidat.id] + prevResult[candidat.id] }} / {{ (((resultatForm[candidat.id] + prevResult[candidat.id])/ (cumulExprime)) * 100).toFixed(1) }}%
                </div>
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
            <div class="candidat-saisie-row">
              <div class="candidat-bande" :style="{ background: white }"></div>
              <div class="candidat-saisie-info">
                <strong>Bulletins blancs</strong>
              </div>
              <div>
                <input v-model.number="blancs" type="number" min="0" class="form-control" :placeholder="bureau.bulletinsBlancs ?? 0"/>
              </div>
            </div>
            <div class="candidat-saisie-row">
              <div class="candidat-bande" :style="{ background: white }"></div>
              <div class="candidat-saisie-info">
                <strong>Bulletins nuls</strong>
              </div>
              <div>
                <input v-model.number="nuls" type="number" min="0" class="form-control" :placeholder="bureau.bulletinsNuls ?? 0"/>
              </div>
            </div>
          </div>

          <div class="resultats-saisie-footer">
            <div class="total-voix">Saisi : <strong>{{ totalVoixSaisies }}</strong><br>Cumul saisi : <strong>{{ cumulSaisi }}</strong></div>
            <div class="total-voix">Exprimé : <strong>{{ totalVoixExprimees }}</strong><br>Cumul Exprimé : <strong>{{ cumulExprime }}</strong> voix</div>
            <div style="display: flex; gap: 0.75rem">
              <button class="btn btn--primaire" @click="sauvegarderResultats(true)" :disabled="savingResultats">
                {{ savingResultats ? '...' : '💾 Enregistrer avec cumul' }}
              </button>
              <button class="btn btn--primaire" @click="sauvegarderResultats(false)" :disabled="savingResultats">
                {{ savingResultats ? '...' : '💾 Enregistrer sans cumul' }}
              </button>
            </div>
          </div>
        </section>

      </template>

      <div v-else class="alert alert--erreur">Bureau introuvable ou accès non autorisé.</div>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useElectionStore } from '@/stores/election'

const route = useRoute()
const store = useElectionStore()

const bureau = computed(() => store.bureauCourant)
const loading = ref(true)
const messageSucces = ref('')
const messageErreur = ref('')
const savingBureau = ref(false)
const savingResultats = ref(false)
const etatBureau = ref('ferme')
const updateInscrits = ref(false)
const updateVotants = ref(false)
const heures = [
  { code: '09:00', label: '9h00' },
  { code: '11:00', label: '11h00' },
  { code: '14:00', label: '14h00' },
  { code: '17:00', label: '17h00' },
  { code: 'final', label: 'Clôture' },
]


const formBureau = reactive({
  inscrits: 0,
  votants: 0,
  bulletinsDepouilles: 0,
  bulletinsNuls: 0,
  bulletinsBlancs: 0,
  depouillementTermine: false,
})

const participationForm = reactive({})
const resultatForm = reactive({})
const blancs = ref(0)
const nuls = ref(0)
const prevResult = {}
let prevBlancs = 0
let prevNuls = 0
let votantsAttendu = 0

const totalVoixExprimees = computed(() =>
    Object.values(resultatForm).reduce((s, v) => s + (Number(v) || 0), 0)
)
const totalVoixSaisies = computed(() =>
    Object.values(resultatForm).reduce((s, v) => s + (Number(v) || 0), 0) + blancs.value + nuls.value
)
const cumulExprime = computed(() =>
    Object.values(resultatForm).reduce((s, v) => s + (Number(v) || 0), 0) + Object.values(prevResult).reduce((s, v) => s + (Number(v) || 0), 0)
)
const cumulSaisi = computed(() =>
    Object.values(resultatForm).reduce((s, v) => s + (Number(v) || 0), 0)
    + Object.values(prevResult).reduce((s, v) => s + (Number(v) || 0), 0)
    + blancs.value + nuls.value +prevNuls + prevBlancs
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
  if (!store.bureauCourant) return

  if(bureau.value.depouillementTermine) etatBureau.value = 'termine'
  else if(bureau.value.participations?.find(p => p.heure == 'final')) etatBureau.value = 'depouillement'
  else if(bureau.value.inscrits) etatBureau.value="ouvert"
  else etatBureau.value="ferme"

  formBureau.inscrits = bureau.value.inscrits
  formBureau.votants = bureau.value.votants
  formBureau.bulletinsDepouilles = bureau.value.bulletinsDepouilles
  formBureau.bulletinsNuls = bureau.value.bulletinsNuls
  formBureau.bulletinsBlancs = bureau.value.bulletinsBlancs
  formBureau.depouillementTermine = bureau.value.depouillementTermine
  blancs.value = 0
  nuls.value = 0
  prevBlancs  = bureau.value.bulletinsBlancs
  prevNuls = bureau.value.bulletinsNuls
  // Pre-fill with existing participation
  for (const p of bureau.value.participations) {
    participationForm[p.heure] = p.votants
  }
  votantsAttendu = participationForm['final'] ?? 0

  // Pre-fill with existing results
  for (const r of bureau.value.resultats) {
    prevResult[r.candidatId] = r.voix
    resultatForm[r.candidatId] = 0
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
    await store.chargerBureauSynthese(bureau.value.id)
    remplirFormulaires()
    showMessage('Informations enregistrées ✓')
  } catch (e) {
    showMessage(e.response?.data?.reason || 'Erreur lors de la sauvegarde', 'erreur')
  } finally {
    savingBureau.value = false
  }
}

async function majVotants() {
  await store.mettreAJourVotantsBureau(bureau.value.id, formBureau.votants)
  bureau.value.votants = formBureau.votants
  updateVotants.value = false
}

async function majInscrits() {
  await store.mettreAJourInscritsBureau(bureau.value.id, formBureau.inscrits )
  bureau.value.inscrits = formBureau.inscrits
  updateInscrits.value = false
}

async function sauvegarderParticipation(heure) {
  const votants = participationForm[heure]
  if (votants === null || votants === undefined) return
  try {
    await store.sauvegarderParticipation(bureau.value.id, heure, votants)
    showMessage(`Participation de ${heure} enregistrée ✓`)
    remplirFormulaires()
  } catch (e) {
    showMessage(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}

async function sauvegarderResultats(estCumul) {
  savingResultats.value = true
  const resultat = {
    nuls: nuls.value,
    blancs: blancs.value,
    bulletinsDepouilles: totalVoixSaisies.value,
    resultats: Object.entries(resultatForm).map(([candidatId, voix]) => ({ candidatId, voix })),
    estFinal: false
  }
  try {
    let toConfirm = false
    if (estCumul) {
      if(cumulSaisi.value === votantsAttendu) {
        toConfirm = true
      }
      resultat.nuls += prevNuls
      resultat.blancs += prevBlancs
      resultat.resultats = resultat.resultats.map(r1 => ({ candidatId: r1.candidatId, voix: r1.voix + prevResult[r1.candidatId] }))
      resultat.bulletinsDepouilles = cumulSaisi.value
    } else {
      if(totalVoixSaisies.value === votantsAttendu) {
        toConfirm = true
      }
    }
    if(toConfirm) {
      resultat.estFinal = confirm("Le nombre de votes saisis correspond au nombre de votants attendus. Puis-je clore le scrutin sur ce bureau (OK) ou dois-je continuer (Annuler) ?")
    }
    await store.sauvegarderResultats(resultat)
    showMessage(resultat.estFinal ? 'Résultats finaux enregistrés ✓' : 'Résultats partiels enregistrés ✓')
    remplirFormulaires()
  } catch (e) {
    console.error(e)
    showMessage(e.response?.data?.reason || 'Erreur lors de la sauvegarde', 'erreur')
  } finally {
    savingResultats.value = false
  }
}

onMounted(async () => {
  await store.chargerCandidats()
  await store.chargerBureauSynthese(route.params.id)
  if (bureau.value) {
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
