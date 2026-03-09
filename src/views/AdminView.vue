<template>
  <main class="page">
    <div class="container">
      <header class="page-header" style="margin-bottom: 2rem">
        <h1 class="section-title">Administration</h1>
      </header>

      <div class="alert alert--succes" v-if="messageSucces">{{ messageSucces }}</div>
      <div class="alert alert--erreur" v-if="messageErreur">{{ messageErreur }}</div>

      <!-- Onglets -->
      <div class="admin-tabs">
        <button class="admin-tab" :class="{ 'admin-tab--active': activeTab === 'elections' }" @click="activateTab('elections')">
          Elections
        </button>
        <button class="admin-tab" :class="{ 'admin-tab--active': activeTab === 'utilisateurs' }" @click="activateTab('utilisateurs')">
          Utilisateurs
        </button>
      </div>

      <!-- ===== ELECTIONS ===== -->
      <section v-if="activeTab === 'elections'" class="admin-panel">
        <div class="panel-header">
          <h2 class="section-title" style="font-size: 1.4rem">Elections</h2>
          <button v-if="auth.isAdmin" class="btn btn--primaire btn--sm" @click="ouvrirModalElection()">+ Ajouter</button>
        </div>

        <div class="card" style="padding: 0; overflow: hidden">
          <table class="tableau">
            <thead>
            <tr>
              <th>Nom</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="c in store.elections" :key="c.id" @click="ouvrirModalElection(c)">
              <td>{{ c.nom }}</td>
            </tr>
            <tr v-if="store.elections.length === 0">
              <td colspan="5" style="text-align: center; color: var(--texte-doux)">
                Aucune élection configurée
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== UTILISATEURS ===== -->
      <section v-if="activeTab === 'utilisateurs'" class="admin-panel">
        <div class="panel-header">
          <h2 class="section-title" style="font-size: 1.4rem">Utilisateurs</h2>
          <button class="btn btn--primaire btn--sm" @click="ouvrirModalUser()">+ Ajouter</button>
        </div>

        <div class="card" style="padding: 0; overflow: auto">
          <table class="tableau">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" @click="ouvrirModalUser(user)">
                <td><strong>{{ user.nom }} {{ user.prenom }}</strong></td>
                <td>{{ user.email }}</td>
                <td>
                  <span v-if="user.isAdmin" class="badge badge--rouge">Admin</span>
                </td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="5" style="text-align: center; color: var(--texte-doux)">Aucun utilisateur</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="alert alert--succes" v-if="messageSucces">{{ messageSucces }}</div>
      <div class="alert alert--erreur" v-if="messageErreur">{{ messageErreur }}</div>

    </div>

    <!-- ===== MODAL ELECTION ===== -->
    <div class="modal-overlay" v-if="showModalElection" @click.self="showModalElection = false">
      <div class="modal-box">
        <h2 class="modal-titre">{{ formElection.id ? "Modifier l'élection'" : 'Nouvelle élection' }}</h2>
        <div class="form-group">
          <label class="form-label">Nom</label>
          <input v-model="formElection.nom" type="text" class="form-control" placeholder="Municipales Sète 2026" />
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--fantome" @click="showModalElection = false">Annuler</button>
          <button class="btn btn--primaire" @click="sauvegarderElection">
            {{ formElection.id ? 'Modifier' : 'Créer' }}
          </button>
          <button v-if="formElection.id" class="btn btn--danger btn--sm" @click.stop="supprimerElection(formElection.id)">
            Supprimer
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL USER ===== -->
    <div class="modal-overlay" v-if="showModalUser" @click.self="showModalUser = false">
      <div class="modal-box">
        <h2 class="modal-titre">{{ formUser.id ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}</h2>
        <div class="form-group">
          <label class="form-label">Nom</label>
          <input v-model="formUser.nom" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Prénom</label>
          <input v-model="formUser.prenom" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="formUser.email" type="email" class="form-control" />
        </div>
        <div class="form-group">
          <label class="form-label">Administrateur</label>
          <input v-model="formUser.isAdmin" type="checkbox" class="form-control"/>
        </div>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--fantome" @click="showModalUser = false">Annuler</button>
          <button class="btn btn--primaire" @click="sauvegarderUser">
            {{ formUser.id ? 'Modifier' : 'Créer' }}
          </button>
          <button v-if="formUser.id"
              class="btn btn--danger btn--sm"
              @click="supprimerUser(formUser.id)"
              :disabled="formUser.email === 'christ.arnal@laposte.net'"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useElectionStore } from '@/stores/election'
import { useAuthStore } from '@/stores/auth'
import { adminAPI, authAPI, ownerAPI } from '@/api'

const store = useElectionStore()
const auth = useAuthStore()
const messageSucces = ref('')
const messageErreur = ref('')

const activeTab = ref('elections')
const users = ref([])
const showModalElection = ref(false)
const showModalUser = ref(false)
const electionAssignation = ref(undefined)

const formElection = reactive({ id: null, nom: '' })
const formUser = reactive({ id: null, nom: '', prenom: '', email: '', isAdmin: false})

async function activateTab(id) {
  switch(id) {
    case "elections":
      await store.chargerElections()
      break;
    case "utilisateurs":
      users.value = await store.chargerUsers(true)
      break;
  }
  activeTab.value = id
}

function showMsg(msg, type = 'succes') {
  if (type === 'succes') { messageSucces.value = msg; messageErreur.value = '' }
  else { messageErreur.value = msg; messageSucces.value = '' }
  setTimeout(() => { messageSucces.value = ''; messageErreur.value = '' }, 3500)
}

// ===== ELECTIONS =====
function ouvrirModalElection(election = null) {
  if (election) {
    electionAssignation.value = election
    Object.assign(formElection, { id: election.id, nom: election.nom })
  } else {
    electionAssignation.value = undefined
    Object.assign(formElection, { id: null, nom: '' })
  }
  showModalElection.value = true
}
async function sauvegarderElection() {
  console.log("sauvegarderElection : ",formElection)
  try {
    if (formElection.id) {
      console.log("modification")
      await store.modifierElection(formElection.id, { nom: formElection.nom })
      showMsg('Election modifiée ✓')
    } else {
      console.log("création")
      await store.creerElection({ nom: formElection.nom })
      showMsg('Election créée ✓')
    }
    showModalElection.value = false
  } catch (e) {
    console.error("Erreur sauvegarderElection :", e)
    showMsg(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}
async function supprimerElection(id) {
  if (!confirm('Supprimer cette élection ? Toutes ses données seront perdues.')) return
  try {
    await store.supprimerElection(id)
    showMsg('Election supprimée ✓')
    showModalElection.value = false
  } catch (e) {
    showMsg('Erreur lors de la suppression', 'erreur')
  }
}

// ===== UTILISATEURS =====
function ouvrirModalUser(user = null) {
  if (user) {
    Object.assign(formUser, {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      isAdmin: user.isAdmin,
    })
  } else {
    Object.assign(formUser, {
      id: null,
      nom: '', prenom: '', email: '',
      isAdmin: false
    })
  }
  showModalUser.value = true
}
async function sauvegarderUser() {
  try {
    const payload = {
      nom: formUser.nom,
      prenom: formUser.prenom,
      email: formUser.email,
      isAdmin: formUser.isAdmin,
    }

    if (formUser.id) {
      await adminAPI.updateUser(formUser.id, payload)
      showMsg('Utilisateur modifié ✓')
    } else {
      await adminAPI.createUser(payload)
      showMsg('Utilisateur créé ✓')
    }
    users.value = await store.chargerUsers(true)
    showModalUser.value = false
  } catch (e) {
    showMsg(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}
async function supprimerUser(id) {
  if (!confirm('Supprimer cet utilisateur ?')) return
  try {
    await adminAPI.deleteUser(id)
    users.value = await store.chargerUsers(true)
    showMsg('Utilisateur supprimé ✓')
  } catch (e) {
    showMsg('Erreur', 'erreur')
  }
}

onMounted(async () => {
  await activateTab('elections')
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
.user-subgroup {
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
