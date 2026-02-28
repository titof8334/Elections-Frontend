<template>
  <main class="page">
    <div class="container">
      <header class="page-header" style="margin-bottom: 2rem">
        <h1 class="section-title">Administration</h1>
        <p class="section-subtitle">Gestion des bureaux, candidats et scrutateurs</p>
      </header>

      <div class="alert alert--succes" v-if="messageSucces">{{ messageSucces }}</div>
      <div class="alert alert--erreur" v-if="messageErreur">{{ messageErreur }}</div>

      <!-- Onglets -->
      <div class="admin-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="admin-tab"
          :class="{ 'admin-tab--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ===== BUREAUX ===== -->
      <section v-show="activeTab === 'bureaux'" class="admin-panel">
        <div class="panel-header">
          <h2 class="section-title" style="font-size: 1.4rem">Bureaux de vote</h2>
          <button class="btn btn--primaire btn--sm" @click="showModalBureau = true">+ Ajouter</button>
        </div>

        <div class="card" style="padding: 0; overflow: hidden">
          <table class="tableau">
            <thead>
              <tr>
                <th>N°</th>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Inscrits</th>
                <th>Scrutateurs</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bureau in store.bureaux" :key="bureau.id">
                <td><strong>{{ bureau.numero }}</strong></td>
                <td>{{ bureau.nom }}</td>
                <td style="font-size: 0.85rem; color: var(--texte-doux)">{{ bureau.adresse }}</td>
                <td>{{ bureau.inscrits }}</td>
                <td>
                  <button class="btn btn--fantome btn--sm" @click="ouvrirAssignation(bureau)">
                    Gérer scrutateurs
                  </button>
                </td>
                <td>
                  <button class="btn btn--danger btn--sm" @click="supprimerBureau(bureau.id)">
                    Supprimer
                  </button>
                </td>
              </tr>
              <tr v-if="store.bureaux.length === 0">
                <td colspan="6" style="text-align: center; color: var(--texte-doux)">
                  Aucun bureau configuré
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== CANDIDATS ===== -->
      <section v-show="activeTab === 'candidats'" class="admin-panel">
        <div class="panel-header">
          <h2 class="section-title" style="font-size: 1.4rem">Candidats / Listes</h2>
          <button class="btn btn--primaire btn--sm" @click="ouvrirModalCandidat()">+ Ajouter</button>
        </div>

        <div class="card" style="padding: 0; overflow: hidden">
          <table class="tableau">
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Couleur</th>
                <th>Nom</th>
                <th>Liste</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in store.candidats" :key="c.id">
                <td>{{ c.ordre }}</td>
                <td>
                  <div :style="{ width: '24px', height: '24px', borderRadius: '50%', background: c.couleur }"></div>
                </td>
                <td><strong>{{ c.prenom }} {{ c.nom }}</strong></td>
                <td>{{ c.liste }}</td>
                <td style="display: flex; gap: 0.5rem">
                  <button class="btn btn--fantome btn--sm" @click="ouvrirModalCandidat(c)">Modifier</button>
                  <button class="btn btn--danger btn--sm" @click="supprimerCandidat(c.id)">Supprimer</button>
                </td>
              </tr>
              <tr v-if="store.candidats.length === 0">
                <td colspan="5" style="text-align: center; color: var(--texte-doux)">
                  Aucun candidat configuré
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== UTILISATEURS ===== -->
      <section v-show="activeTab === 'utilisateurs'" class="admin-panel">
        <div class="panel-header">
          <h2 class="section-title" style="font-size: 1.4rem">Scrutateurs</h2>
          <button class="btn btn--primaire btn--sm" @click="showModalUser = true">+ Ajouter</button>
        </div>

        <div class="card" style="padding: 0; overflow: hidden">
          <table class="tableau">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Bureaux assignés</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td><strong>{{ user.nom }}</strong></td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge" :class="user.role === 'admin' ? 'badge--rouge' : 'badge--bleu'">
                    {{ user.role }}
                  </span>
                </td>
                <td>{{ user.bureaux.length }} bureau(x)</td>
                <td>
                  <button
                    class="btn btn--danger btn--sm"
                    @click="supprimerUser(user.id)"
                    :disabled="user.email === 'admin@elections.local'"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="5" style="text-align: center; color: var(--texte-doux)">Aucun utilisateur</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== DANGER ZONE ===== -->
      <section v-show="activeTab === 'danger'" class="admin-panel">
        <h2 class="section-title" style="font-size: 1.4rem; color: var(--rouge-rep)">⚠ Zone dangereuse</h2>
        <p class="section-subtitle">Ces actions sont irréversibles.</p>
        <div class="card" style="border: 2px solid var(--rouge-rep)">
          <h3 style="margin-bottom: 0.5rem">Réinitialiser le dépouillement</h3>
          <p style="font-size: 0.9rem; color: var(--texte-doux); margin-bottom: 1rem">
            Supprime tous les résultats, participations et remet les bureaux à zéro. Les bureaux, candidats et utilisateurs sont conservés.
          </p>
          <button class="btn btn--danger" @click="resetElection">
            ⚠ Réinitialiser toutes les données de vote
          </button>
        </div>
      </section>

    </div>

    <!-- ===== MODAL BUREAU ===== -->
    <div class="modal-overlay" v-if="showModalBureau" @click.self="showModalBureau = false">
      <div class="modal-box">
        <h2 class="modal-titre">Nouveau bureau</h2>
        <div class="form-group">
          <label class="form-label">Numéro</label>
          <input v-model.number="formBureau.numero" type="number" min="1" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Nom</label>
          <input v-model="formBureau.nom" type="text" class="form-control" placeholder="École primaire Jean Jaurès" />
        </div>
        <div class="form-group">
          <label class="form-label">Adresse</label>
          <input v-model="formBureau.adresse" type="text" class="form-control" placeholder="12 rue de la Mairie" />
        </div>
        <div class="form-group">
          <label class="form-label">Nombre d'inscrits</label>
          <input v-model.number="formBureau.inscrits" type="number" min="0" class="form-control" />
        </div>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--fantome" @click="showModalBureau = false">Annuler</button>
          <button class="btn btn--primaire" @click="creerBureau">Créer</button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL CANDIDAT ===== -->
    <div class="modal-overlay" v-if="showModalCandidat" @click.self="showModalCandidat = false">
      <div class="modal-box">
        <h2 class="modal-titre">{{ formCandidat.id ? 'Modifier le candidat' : 'Nouveau candidat' }}</h2>
        <div class="grille-2">
          <div class="form-group">
            <label class="form-label">Prénom</label>
            <input v-model="formCandidat.prenom" type="text" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">Nom</label>
            <input v-model="formCandidat.nom" type="text" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Liste / Parti</label>
          <input v-model="formCandidat.liste" type="text" class="form-control" placeholder="Liste du Rassemblement Citoyen" />
        </div>
        <div class="grille-2">
          <div class="form-group">
            <label class="form-label">Couleur</label>
            <div style="display: flex; gap: 0.5rem; align-items: center">
              <input v-model="formCandidat.couleur" type="color" style="width: 40px; height: 36px; border: 1px solid var(--gris-clair); border-radius: var(--rayon); padding: 2px; cursor: pointer" />
              <input v-model="formCandidat.couleur" type="text" class="form-control" placeholder="#003189" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Ordre d'affichage</label>
            <input v-model.number="formCandidat.ordre" type="number" min="1" class="form-control" />
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--fantome" @click="showModalCandidat = false">Annuler</button>
          <button class="btn btn--primaire" @click="sauvegarderCandidat">
            {{ formCandidat.id ? 'Modifier' : 'Créer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL USER ===== -->
    <div class="modal-overlay" v-if="showModalUser" @click.self="showModalUser = false">
      <div class="modal-box">
        <h2 class="modal-titre">Nouvel utilisateur</h2>
        <div class="form-group">
          <label class="form-label">Nom complet</label>
          <input v-model="formUser.nom" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="formUser.email" type="email" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <input v-model="formUser.password" type="password" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Rôle</label>
          <select v-model="formUser.role" class="form-control">
            <option value="scrutateur">Scrutateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Bureaux assignés</label>
          <div class="bureaux-checkboxes">
            <label v-for="b in store.bureaux" :key="b.id" class="checkbox-label">
              <input type="checkbox" :value="b.id" v-model="formUser.bureauIds" />
              Bureau {{ b.numero }} — {{ b.nom }}
            </label>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--fantome" @click="showModalUser = false">Annuler</button>
          <button class="btn btn--primaire" @click="creerUser">Créer</button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL ASSIGNATION ===== -->
    <div class="modal-overlay" v-if="showModalAssignation" @click.self="showModalAssignation = false">
      <div class="modal-box">
        <h2 class="modal-titre">Scrutateurs — Bureau {{ bureauAssignation?.numero }}</h2>
        <p style="font-size: 0.9rem; color: var(--texte-doux); margin-bottom: 1rem">
          {{ bureauAssignation?.nom }}
        </p>
        <div class="bureaux-checkboxes">
          <label v-for="user in scrutateurs" :key="user.id" class="checkbox-label">
            <input
              type="checkbox"
              :checked="estAssigne(user.id)"
              @change="toggleAssignation(user.id, $event.target.checked)"
            />
            {{ user.nom }} ({{ user.email }})
          </label>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem">
          <button class="btn btn--primaire" @click="showModalAssignation = false">Fermer</button>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useElectionStore } from '@/stores/election'
import { adminAPI } from '@/api'

const store = useElectionStore()
const messageSucces = ref('')
const messageErreur = ref('')

const activeTab = ref('bureaux')
const tabs = [
  { id: 'bureaux', label: 'Bureaux' },
  { id: 'candidats', label: 'Candidats' },
  { id: 'utilisateurs', label: 'Utilisateurs' },
  { id: 'danger', label: '⚠ Reset' },
]

const users = ref([])
const showModalBureau = ref(false)
const showModalCandidat = ref(false)
const showModalUser = ref(false)
const showModalAssignation = ref(false)
const bureauAssignation = ref(null)

const formBureau = reactive({ numero: 1, nom: '', adresse: '', inscrits: 0 })
const formCandidat = reactive({ id: null, nom: '', prenom: '', liste: '', couleur: '#003189', ordre: 1 })
const formUser = reactive({ nom: '', email: '', password: '', role: 'scrutateur', bureauIds: [] })

const scrutateurs = computed(() => users.value.filter(u => u.role === 'scrutateur'))

function showMsg(msg, type = 'succes') {
  if (type === 'succes') { messageSucces.value = msg; messageErreur.value = '' }
  else { messageErreur.value = msg; messageSucces.value = '' }
  setTimeout(() => { messageSucces.value = ''; messageErreur.value = '' }, 3500)
}

// ===== BUREAUX =====
async function creerBureau() {
  try {
    await store.creerBureau({ ...formBureau })
    showModalBureau.value = false
    Object.assign(formBureau, { numero: 1, nom: '', adresse: '', inscrits: 0 })
    showMsg('Bureau créé ✓')
  } catch (e) {
    showMsg(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}

async function supprimerBureau(id) {
  if (!confirm('Supprimer ce bureau ? Toutes ses données seront perdues.')) return
  try {
    await store.supprimerBureau(id)
    showMsg('Bureau supprimé ✓')
  } catch (e) {
    showMsg('Erreur lors de la suppression', 'erreur')
  }
}

// ===== ASSIGNATION =====
function ouvrirAssignation(bureau) {
  bureauAssignation.value = bureau
  showModalAssignation.value = true
}

function estAssigne(userId) {
  return bureauAssignation.value?.scrutateurs?.includes(userId) ?? false
}

async function toggleAssignation(userId, checked) {
  if (!bureauAssignation.value) return
  try {
    if (checked) {
      await adminAPI.assignScrutateur(bureauAssignation.value.id, userId)
    } else {
      await adminAPI.removeScrutateur(bureauAssignation.value.id, userId)
    }
    await store.chargerBureaux()
    bureauAssignation.value = store.bureaux.find(b => b.id === bureauAssignation.value.id)
    showMsg('Assignation mise à jour ✓')
  } catch (e) {
    showMsg('Erreur', 'erreur')
  }
}

// ===== CANDIDATS =====
function ouvrirModalCandidat(candidat = null) {
  if (candidat) {
    Object.assign(formCandidat, { ...candidat })
  } else {
    Object.assign(formCandidat, { id: null, nom: '', prenom: '', liste: '', couleur: '#003189', ordre: store.candidats.length + 1 })
  }
  showModalCandidat.value = true
}

async function sauvegarderCandidat() {
  try {
    if (formCandidat.id) {
      await store.modifierCandidat(formCandidat.id, { ...formCandidat })
      showMsg('Candidat modifié ✓')
    } else {
      await store.creerCandidat({ ...formCandidat })
      showMsg('Candidat créé ✓')
    }
    showModalCandidat.value = false
  } catch (e) {
    showMsg(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}

async function supprimerCandidat(id) {
  if (!confirm('Supprimer ce candidat ?')) return
  try {
    await store.supprimerCandidat(id)
    showMsg('Candidat supprimé ✓')
  } catch (e) {
    showMsg('Erreur', 'erreur')
  }
}

// ===== UTILISATEURS =====
async function chargerUsers() {
  try {
    const res = await adminAPI.getUsers()
    users.value = res.data
  } catch {}
}

async function creerUser() {
  try {
    await adminAPI.createUser({ ...formUser })
    await chargerUsers()
    showModalUser.value = false
    Object.assign(formUser, { nom: '', email: '', password: '', role: 'scrutateur', bureauIds: [] })
    showMsg('Utilisateur créé ✓')
  } catch (e) {
    showMsg(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}

async function supprimerUser(id) {
  if (!confirm('Supprimer cet utilisateur ?')) return
  try {
    await adminAPI.deleteUser(id)
    await chargerUsers()
    showMsg('Utilisateur supprimé ✓')
  } catch (e) {
    showMsg('Erreur', 'erreur')
  }
}

// ===== RESET =====
async function resetElection() {
  if (!confirm('⚠ ATTENTION : Êtes-vous sûr de vouloir effacer TOUTES les données de vote ? Cette action est irréversible.')) return
  if (!confirm('Dernière confirmation : effacer tous les résultats et participations ?')) return
  try {
    await adminAPI.resetElection()
    await store.chargerBureaux()
    showMsg('Données réinitialisées ✓')
  } catch (e) {
    showMsg('Erreur lors de la réinitialisation', 'erreur')
  }
}

onMounted(async () => {
  await Promise.all([store.chargerBureaux(), store.chargerCandidats(), chargerUsers()])
})
</script>

<style scoped>
.admin-tabs {
  display: flex;
  gap: 0.25rem;
  background: var(--blanc);
  border: 1px solid var(--gris-clair);
  border-radius: var(--rayon);
  padding: 0.25rem;
  margin-bottom: 1.5rem;
  width: fit-content;
}

.admin-tab {
  padding: 0.5rem 1.25rem;
  border: none;
  background: transparent;
  border-radius: calc(var(--rayon) - 1px);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--texte-doux);
  transition: all 0.2s;
}

.admin-tab:hover { color: var(--texte); background: var(--creme); }

.admin-tab--active {
  background: var(--bleu-nuit) !important;
  color: var(--blanc) !important;
}

.admin-panel { animation: slide-up 0.2s ease; }

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 22, 40, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
  backdrop-filter: blur(2px);
}

.modal-box {
  background: var(--blanc);
  border-radius: var(--rayon-lg);
  padding: 2rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slide-up 0.25s ease;
}

.modal-titre {
  font-family: var(--font-titre);
  font-size: 1.4rem;
  margin-bottom: 1.25rem;
}

.bureaux-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--gris-clair);
  border-radius: var(--rayon);
  padding: 0.75rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.checkbox-label input { width: 16px; height: 16px; accent-color: var(--bleu-rep); }
</style>
