<template>
  <main class="page">
    <div class="container">

      <!-- Hero header -->
      <header class="accueil-hero">
        <div>
          <h1 class="section-title">Résultats en direct</h1>
          <p class="section-subtitle">
            Dépouillement — mise à jour automatique toutes les 30 secondes
            <span v-if="store.lastUpdate" class="derniere-maj">
              · Dernière MAJ : {{ formatTime(store.lastUpdate) }}
            </span>
          </p>
        </div>
        <div class="hero-statuts">
          <span class="badge badge--vert" v-if="store.bureauxTermines === store.totalBureaux && store.totalBureaux > 0">
            ✓ Dépouillement terminé
          </span>
          <span class="badge badge--or" v-else-if="store.totalBureaux > 0">
            {{ store.bureauxTermines }}/{{ store.totalBureaux }} bureaux terminés
          </span>
        </div>
      </header>

      <!-- Chargement -->
      <div v-if="loading" class="spinner"></div>

      <template v-else-if="store.synthese">

        <!-- Stats globales -->
        <div class="grille-4 stats-globales">
          <div class="card stat-box">
            <div class="stat-box__valeur">{{ store.totalInscrits.toLocaleString('fr-FR') }}</div>
            <div class="stat-box__label">Inscrits</div>
          </div>
          <div class="card stat-box">
            <div class="stat-box__valeur">{{ store.totalVotants.toLocaleString('fr-FR') }}</div>
            <div class="stat-box__label">Votants</div>
          </div>
          <div class="card stat-box">
            <div class="stat-box__valeur" :style="{ color: couleurTaux(store.tauxParticipation) }">
              {{ store.tauxParticipation.toFixed(1) }}%
            </div>
            <div class="stat-box__label">Participation</div>
          </div>
          <div class="card stat-box">
            <div class="stat-box__valeur">{{ store.bureauxTermines }}/{{ store.totalBureaux }}</div>
            <div class="stat-box__label">Bureaux terminés</div>
          </div>
        </div>

        <!-- Résultats candidats -->
        <section class="section-resultats" v-if="store.resultatsGlobaux.length > 0">
          <h2 class="section-title">Résultats</h2>
          <p class="section-subtitle">Suffrages exprimés par liste</p>

          <div class="resultats-liste">
            <div
              v-for="(r, i) in store.resultatsGlobaux"
              :key="r.candidatId"
              class="candidat-row"
              :class="{ 'candidat-row--premier': i === 0 }"
            >
              <div class="candidat-rang">{{ i + 1 }}</div>
              <div class="candidat-couleur" :style="{ background: r.couleur }"></div>
              <div class="candidat-identite">
                <div class="candidat-nom">{{ r.candidatPrenom }} {{ r.candidatNom }}</div>
                <div class="candidat-liste">{{ r.candidatListe }}</div>
              </div>
              <div class="candidat-stats">
                <div class="candidat-voix">{{ r.totalVoix.toLocaleString('fr-FR') }} voix</div>
                <div class="candidat-pct">{{ r.pourcentage.toFixed(2) }}%</div>
              </div>
              <div class="candidat-barre-wrap">
                <div class="progress-bar-wrap">
                  <div
                    class="progress-bar-fill"
                    :style="{ width: `${r.pourcentage}%`, background: r.couleur }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Participation par heure -->
        <section class="section-participation" v-if="participationsParHeure.length > 0">
          <h2 class="section-title">Taux de participation</h2>
          <p class="section-subtitle">Évolution au fil de la journée</p>

          <div class="card">
            <table class="tableau">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Votants</th>
                  <th>Taux</th>
                  <th style="width: 40%">Progression</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in participationsParHeure" :key="p.heure">
                  <td>
                    <strong>{{ p.heure === 'final' ? 'Résultat final' : p.heure }}</strong>
                  </td>
                  <td>{{ p.totalVotants.toLocaleString('fr-FR') }}</td>
                  <td>
                    <span :style="{ color: couleurTaux(p.tauxParticipation), fontWeight: 600 }">
                      {{ p.tauxParticipation.toFixed(1) }}%
                    </span>
                  </td>
                  <td>
                    <div class="progress-bar-wrap">
                      <div
                        class="progress-bar-fill"
                        :style="{ width: `${p.tauxParticipation}%`, background: 'var(--bleu-rep)' }"
                      ></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Bureaux -->
        <section class="section-bureaux">
          <h2 class="section-title">Bureaux de vote</h2>
          <p class="section-subtitle">Cliquez sur un bureau pour voir les détails</p>

          <div class="grille-3">
            <router-link
              v-for="bureau in store.synthese.bureaux"
              :key="bureau.id"
              :to="`/bureau/${bureau.id}`"
              class="card bureau-card"
            >
              <div class="bureau-header">
                <span class="bureau-numero">Bureau {{ bureau.numero }}</span>
                <span
                  class="badge"
                  :class="bureau.depouillementTermine ? 'badge--vert' : 'badge--gris'"
                >
                  {{ bureau.depouillementTermine ? '✓ Terminé' : 'En cours' }}
                </span>
              </div>
              <div class="bureau-nom">{{ bureau.nom }}</div>
              <div class="bureau-stats-mini">
                <span>{{ bureau.inscrits }} inscrits</span>
                <span>{{ bureau.bulletinsDepouilles }} bulletins dépouillés</span>
              </div>
            </router-link>
          </div>
        </section>

      </template>

      <div v-else class="alert alert--info">
        Aucune donnée disponible. Le dépouillement n'a pas encore commencé.
      </div>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useElectionStore } from '@/stores/election'

const store = useElectionStore()
const loading = ref(true)
let intervalId = null

const participationsParHeure = computed(() =>
  (store.synthese?.participationsParHeure || []).filter(p => p.totalVotants > 0)
)

function couleurTaux(taux) {
  if (taux >= 70) return '#1a7a4a'
  if (taux >= 50) return '#a07a10'
  return 'var(--bleu-rep)'
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

async function charger() {
  await Promise.all([store.chargerSynthese(), store.chargerCandidats()])
  loading.value = false
}

onMounted(() => {
  charger()
  intervalId = setInterval(charger, 30000)
})

onUnmounted(() => clearInterval(intervalId))
</script>

<style scoped>
.accueil-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.hero-statuts { display: flex; align-items: center; gap: 0.5rem; }
.derniere-maj { font-style: italic; color: var(--texte-doux); }

.stats-globales { margin-bottom: 2.5rem; }

.section-resultats,
.section-participation,
.section-bureaux { margin-bottom: 3rem; }

.resultats-liste { display: flex; flex-direction: column; gap: 0.75rem; }

.candidat-row {
  display: grid;
  grid-template-columns: 2rem 6px 1fr auto 200px;
  align-items: center;
  gap: 1rem;
  background: var(--blanc);
  border: 1px solid var(--gris-clair);
  border-radius: var(--rayon-lg);
  padding: 1rem 1.25rem;
  transition: box-shadow 0.2s;
}
.candidat-row:hover { box-shadow: var(--ombre); }
.candidat-row--premier {
  border-color: var(--or);
  background: linear-gradient(135deg, #fffdf5, var(--blanc));
}

.candidat-rang {
  font-family: var(--font-titre);
  font-size: 1.5rem;
  color: var(--texte-doux);
  text-align: center;
}
.candidat-row--premier .candidat-rang { color: var(--or); }

.candidat-couleur {
  width: 6px;
  height: 48px;
  border-radius: 3px;
}

.candidat-nom { font-weight: 600; font-size: 1rem; }
.candidat-liste { font-size: 0.8rem; color: var(--texte-doux); }

.candidat-stats { text-align: right; }
.candidat-voix { font-weight: 600; }
.candidat-pct { font-family: var(--font-titre); font-size: 1.25rem; color: var(--bleu-rep); }

.candidat-barre-wrap { min-width: 160px; }

/* Bureaux grid */
.bureau-card {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  display: block;
}
.bureau-card:hover {
  box-shadow: var(--ombre-lg);
  transform: translateY(-2px);
}

.bureau-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.bureau-numero {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: var(--texte-doux);
}

.bureau-nom {
  font-family: var(--font-titre);
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.bureau-stats-mini {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--texte-doux);
}

@media (max-width: 768px) {
  .candidat-row { grid-template-columns: 2rem 6px 1fr auto; }
  .candidat-barre-wrap { display: none; }
}
</style>
