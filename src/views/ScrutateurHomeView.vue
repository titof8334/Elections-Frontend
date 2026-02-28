<template>
  <main class="page">
    <div class="container">
      <header class="page-header">
        <div>
          <h1 class="section-title">Mes bureaux de vote</h1>
          <p class="section-subtitle">Bienvenue, {{ auth.user?.nom }}</p>
        </div>
      </header>

      <div v-if="loading" class="spinner"></div>

      <template v-else>
        <div v-if="mesBureaux.length === 0" class="alert alert--info">
          Aucun bureau ne vous est assigné. Contactez l'administrateur.
        </div>

        <div v-else class="grille-2">
          <div
            v-for="bureau in mesBureaux"
            :key="bureau.id"
            class="card bureau-scrutateur-card"
          >
            <div class="bureau-scrutateur-header">
              <div>
                <span class="bureau-numero-label">Bureau {{ bureau.numero }}</span>
                <h3 class="bureau-nom">{{ bureau.nom }}</h3>
                <p class="bureau-adresse">{{ bureau.adresse }}</p>
              </div>
              <span
                class="badge"
                :class="bureau.depouillementTermine ? 'badge--vert' : 'badge--gris'"
              >
                {{ bureau.depouillementTermine ? '✓ Terminé' : 'En cours' }}
              </span>
            </div>

            <hr class="sep" />

            <div class="bureau-info-grille">
              <div class="info-item">
                <span class="info-label">Inscrits</span>
                <span class="info-val">{{ bureau.inscrits.toLocaleString('fr-FR') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Bulletins dépouillés</span>
                <span class="info-val">{{ bureau.bulletinsDepouilles }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Nuls</span>
                <span class="info-val">{{ bureau.bulletinsNuls }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Blancs</span>
                <span class="info-val">{{ bureau.bulletinsBlancs }}</span>
              </div>
            </div>

            <div style="display: flex; gap: 0.75rem; margin-top: 1rem">
              <router-link
                :to="`/scrutateur/bureau/${bureau.id}`"
                class="btn btn--primaire"
                style="flex: 1; justify-content: center"
              >
                ✏ Saisir les données
              </router-link>
              <router-link
                :to="`/bureau/${bureau.id}`"
                class="btn btn--fantome btn--sm"
              >
                Voir
              </router-link>
            </div>
          </div>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useElectionStore } from '@/stores/election'

const auth = useAuthStore()
const store = useElectionStore()
const loading = ref(true)

const mesBureaux = computed(() => {
  if (auth.isAdmin) return store.bureaux
  return store.bureaux.filter(b => auth.bureauxAutorisés.includes(b.id))
})

onMounted(async () => {
  await store.chargerBureaux()
  loading.value = false
})
</script>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.bureau-scrutateur-card { display: flex; flex-direction: column; }

.bureau-scrutateur-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.bureau-numero-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--texte-doux);
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
}

.bureau-nom {
  font-family: var(--font-titre);
  font-size: 1.2rem;
  color: var(--bleu-nuit);
}

.bureau-adresse {
  font-size: 0.85rem;
  color: var(--texte-doux);
}

.bureau-info-grille {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  background: var(--creme);
  border-radius: var(--rayon);
  padding: 0.6rem 0.9rem;
}

.info-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--texte-doux);
}

.info-val {
  font-family: var(--font-titre);
  font-size: 1.4rem;
  color: var(--bleu-rep);
}
</style>
