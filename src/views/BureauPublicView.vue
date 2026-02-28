<template>
  <main class="page">
    <div class="container">

      <div v-if="loading" class="spinner"></div>

      <template v-else-if="bureau">
        <div class="bureau-public-header">
          <router-link to="/" class="btn btn--fantome btn--sm">← Retour</router-link>
          <div>
            <h1 class="section-title">Bureau {{ bureau.numero }} — {{ bureau.nom }}</h1>
            <p class="section-subtitle">{{ bureau.adresse }}</p>
          </div>
          <span
            class="badge"
            :class="bureau.depouillementTermine ? 'badge--vert' : 'badge--or'"
          >
            {{ bureau.depouillementTermine ? '✓ Dépouillement terminé' : 'En cours de dépouillement' }}
          </span>
        </div>

        <!-- Stats bureau -->
        <div class="grille-4" style="margin-bottom: 2rem">
          <div class="card stat-box">
            <div class="stat-box__valeur">{{ bureau.inscrits.toLocaleString('fr-FR') }}</div>
            <div class="stat-box__label">Inscrits</div>
          </div>
          <div class="card stat-box">
            <div class="stat-box__valeur">{{ bureau.bulletinsDepouilles.toLocaleString('fr-FR') }}</div>
            <div class="stat-box__label">Bulletins dépouillés</div>
          </div>
          <div class="card stat-box">
            <div class="stat-box__valeur">{{ bureau.bulletinsNuls }}</div>
            <div class="stat-box__label">Bulletins nuls</div>
          </div>
          <div class="card stat-box">
            <div class="stat-box__valeur">{{ bureau.bulletinsBlancs }}</div>
            <div class="stat-box__label">Bulletins blancs</div>
          </div>
        </div>

        <!-- Participation par heure -->
        <section style="margin-bottom: 2rem" v-if="bureau.participations.length > 0">
          <h2 class="section-title" style="font-size: 1.4rem">Participation</h2>
          <p class="section-subtitle">Taux de participation aux différentes heures</p>
          <div class="card">
            <table class="tableau">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Votants</th>
                  <th>Taux</th>
                  <th>Progression</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in bureau.participations" :key="p.id">
                  <td><strong>{{ p.heure === 'final' ? 'Final' : p.heure }}</strong></td>
                  <td>{{ p.votants.toLocaleString('fr-FR') }}</td>
                  <td>
                    <strong>{{ p.tauxParticipation.toFixed(1) }}%</strong>
                  </td>
                  <td style="width: 40%">
                    <div class="progress-bar-wrap">
                      <div class="progress-bar-fill" :style="{ width: `${p.tauxParticipation}%`, background: 'var(--bleu-rep)' }"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Résultats -->
        <section v-if="resultatsAvecCandidats.length > 0">
          <h2 class="section-title" style="font-size: 1.4rem">Résultats</h2>
          <p class="section-subtitle">
            {{ bureau.bulletinsDepouilles }} bulletins dépouillés
            <span v-if="!bureau.depouillementTermine"> (résultats partiels)</span>
            <span v-else> (résultats définitifs)</span>
          </p>
          <div class="resultats-bureau">
            <div
              v-for="(r, i) in resultatsAvecCandidats"
              :key="r.candidatId"
              class="candidat-ligne"
              :class="{ 'candidat-ligne--premier': i === 0 }"
            >
              <div class="candidat-couleur" :style="{ background: r.couleur }"></div>
              <div class="candidat-info">
                <strong>{{ r.prenom }} {{ r.nom }}</strong>
                <span class="candidat-liste">{{ r.liste }}</span>
              </div>
              <div class="candidat-voix-info">
                <span class="voix">{{ r.voix.toLocaleString('fr-FR') }} voix</span>
                <span class="pct">{{ r.pourcentage.toFixed(2) }}%</span>
              </div>
              <div class="barre-mini">
                <div class="progress-bar-wrap">
                  <div class="progress-bar-fill" :style="{ width: `${r.pourcentage}%`, background: r.couleur }"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div v-else class="alert alert--info">
          Les résultats de ce bureau ne sont pas encore disponibles.
        </div>

      </template>

      <div v-else class="alert alert--erreur">Bureau introuvable.</div>

    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useElectionStore } from '@/stores/election'

const route = useRoute()
const store = useElectionStore()
const loading = ref(true)
const bureau = ref(null)

const resultatsAvecCandidats = computed(() => {
  if (!bureau.value || !store.candidats.length) return []
  const totalVoix = bureau.value.resultats.reduce((s, r) => s + r.voix, 0)
  return bureau.value.resultats.map(r => {
    const candidat = store.candidats.find(c => c.id === r.candidatId)
    const pct = totalVoix > 0 ? (r.voix / totalVoix) * 100 : 0
    return {
      ...r,
      nom: candidat?.nom || '?',
      prenom: candidat?.prenom || '',
      liste: candidat?.liste || '',
      couleur: candidat?.couleur || '#ccc',
      pourcentage: pct
    }
  }).sort((a, b) => b.voix - a.voix)
})

onMounted(async () => {
  await store.chargerCandidats()
  bureau.value = await store.chargerBureau(route.params.id)
  loading.value = false
})
</script>

<style scoped>
.bureau-public-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.resultats-bureau { display: flex; flex-direction: column; gap: 0.6rem; }

.candidat-ligne {
  display: grid;
  grid-template-columns: 6px 1fr auto 180px;
  align-items: center;
  gap: 1rem;
  background: var(--blanc);
  border: 1px solid var(--gris-clair);
  border-radius: var(--rayon);
  padding: 0.9rem 1.25rem;
}
.candidat-ligne--premier { border-color: var(--or); background: #fffdf5; }

.candidat-couleur { width: 6px; height: 40px; border-radius: 3px; }

.candidat-info { display: flex; flex-direction: column; }
.candidat-liste { font-size: 0.8rem; color: var(--texte-doux); }

.candidat-voix-info { text-align: right; }
.voix { display: block; font-weight: 600; }
.pct { font-family: var(--font-titre); font-size: 1.1rem; color: var(--bleu-rep); }
</style>
