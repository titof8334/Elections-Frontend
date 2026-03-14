<template>
  <main class="page">
    <div class="container">
      <header class="page-header" style="margin-bottom: 2rem">
        <h1 class="section-title">Gestion des bureaux, candidats et délégués</h1>
        <div class="form-group">
          <label class="form-label">Nom</label>
          <input v-model="formElection.nom" type="text" class="form-control" placeholder="Municipales Sète 2026" />
        </div>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--primaire" @click="sauvegarderElection">
            Mettre à jour
          </button>
          <button class="btn btn--danger" @click="showReset">
            ⚠ Reset
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Délégués</label>
          <h4 v-for="delegue in delegues()" :key="delegue.id">
            {{delegue.nom + ' ' + delegue.prenom + (delegue.isTitulaire ? '(Titulaire)' : ' (Suppléant)') }} <br>
          </h4>
        </div>
      </header>

      <div class="alert alert--succes" v-if="messageSucces">{{ messageSucces }}</div>
      <div class="alert alert--erreur" v-if="messageErreur">{{ messageErreur }}</div>

      <!-- Onglets -->
      <div class="admin-tabs">
        <button class="admin-tab" :class="{ 'admin-tab--active': activeTab === 'candidats' }" @click="activateTab('candidats')">
          Candidats
        </button>
        <button class="admin-tab" :class="{ 'admin-tab--active': activeTab === 'bureaux' }" @click="activateTab('bureaux')">
          Bureaux
        </button>
        <button class="admin-tab" :class="{ 'admin-tab--active': activeTab === 'utilisateurs' }" @click="activateTab('utilisateurs')">
          Utilisateurs
        </button>
      </div>


<!-- ===== BUREAUX ===== -->
      <section v-if="activeTab === 'bureaux'" class="admin-panel">
        <div class="panel-header">
          <h2 class="section-title" style="font-size: 1.4rem">Bureaux de vote</h2>
          <button class="btn btn--primaire btn--sm" @click="ouvrirModalBureau()">+ Ajouter</button>
        </div>
        <div class="card" style="padding: 0; overflow: auto">
          <table class="tableau">
            <thead>
              <tr>
                <th>N°</th>
                <th>Nom</th>
                <th>Adresse</th>
                <th>Assesseurs</th>
                <th>Disponibilités</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bureau in store.bureaux" :key="bureau.id" @click="ouvrirModalBureau(bureau)">
                <td><strong>{{ bureau.numero }}</strong></td>
                <td>{{ bureau.nom }}</td>
                <td style="font-size: 0.85rem; color: var(--texte-doux)">{{ bureau.adresse }}</td>
                <td>
                  <span v-if="assesseurs(bureau).length" v-for="u in assesseurs(bureau)" :key="u.id" style="display:block">
                    {{ u.nom }} {{ u.prenom }} {{ u.isTitulaire ? '(titulaire)' : '(suppléant)' }}
                  </span>
                </td>
                <td>
                  Délégué(s) : <span><i>{{
                    dispsDelegue(bureau).map(u => u.nom + ' ' + u.prenom).join(",")
                  }}</i></span><br>
                  Assesseur(s) : <span v-if="assesseurs(bureau).length"><i>{{
                    dispsAssesseur(bureau).map(u => u.nom + ' ' + u.prenom+' ('+u.dispPeriode+')').join(",")
                  }}</i></span>

                </td>
              </tr>
              <tr v-if="store.bureaux.length === 0">
                <td colspan="5" style="text-align: center; color: var(--texte-doux)">
                  Aucun bureau configuré
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== CANDIDATS ===== -->
      <section v-if="activeTab === 'candidats'" class="admin-panel">
        <div class="panel-header">
          <h2 class="section-title" style="font-size: 1.4rem">Candidats / Listes</h2>
          <button class="btn btn--primaire btn--sm" @click="ouvrirModalCandidat()">+ Ajouter</button>
        </div>

        <div class="card" style="padding: 0; overflow: hidden">
          <table class="tableau">
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Nom</th>
                <th>Liste</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in store.candidats" :key="c.id" @click="ouvrirModalCandidat(c)"
                  :style="{ borderLeft: `20px solid ${c.couleur}` }">
                <td>{{ c.ordre }}</td>
                <td><strong>{{ c.prenom }} {{ c.nom }}</strong></td>
                <td>{{ c.liste }}</td>
              </tr>
              <tr v-if="store.candidats.length === 0">
                <td colspan="3" style="text-align: center; color: var(--texte-doux)">
                  Aucun candidat configuré
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ===== UTILISATEURS ===== -->
      <section v-if="activeTab === 'utilisateurs'" class="admin-panel">
        <div class="panel-header">
          <h2 class="section-title" style="font-size: 1.4rem">Participants</h2>
          <button class="btn btn--primaire btn--sm" @click="ouvrirModalUser()">+ Ajouter</button>
        </div>

        <div class="card" style="padding: 0; overflow: auto">
          <table class="tableau">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Gestionnaire</th>
                <th>Rôle</th>
                <th>Bureau(x) assigné(s)</th>
                <th>Disponibilité</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id" @click="ouvrirModalUser(user)">
                <td><strong>{{ user.nom }} {{ user.prenom }}</strong></td>
                <td>{{ user.email }}</td>
                <td><span v-if="user.isOwner" class="badge badge--vert">Oui</span></td>
                <td>
                  <span v-if="user.role && (user.role === 'delegue' || user.role === 'assesseur')" class="badge badge--bleu">{{ user.role }} {{ user.isTitulaire ? '(Titulaire)' : '(Suppléant)'}}</span>
                </td>
                <td>
                  <template v-for="bureau in user.bureaux" :key="bureau.id">{{ nomBureau(bureau.id) }} {{ user.role == 'assesseur' && bureau.periode != 'J' ? '('+bureau.periode+')' : ''}}<br></template>
                </td>
                <td>{{ nomBureau(user.dispBureauId) }}{{ user.dispBureauId && (user.dispAssesseur || user.dispDelegue) ? ' : ' : ' '}}{{ user.dispAssesseur ? 'assesseur ('+user.periode+')' : ''}}{{ user.dispAssesseur && user.dispDelegue ? ' / ' : ' '}}{{ user.dispDelegue ? 'Délégué' : ''}}</td>
              </tr>
              <tr v-if="users.length === 0">
                <td colspan="6" style="text-align: center; color: var(--texte-doux)">Aucun utilisateur</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    <!-- ===== MODAL RESET ===== -->
    <div class="modal-overlay" v-if="showModalReset" @click.self="showModalReset = false">
      <div class="modal-box">
        <h2 class="modal-titre" style="color: var(--rouge-rep)">⚠ Zone de danger</h2>
        <p style="margin-bottom: 0.75rem">
          Cette action va effacer <strong>toutes les participations et tous les résultats</strong>
          de l'élection <strong>{{ store.electionCourante?.nom }}</strong>.
        </p>
        <p style="margin-bottom: 1.5rem; color: var(--texte-doux); font-size: 0.9rem">
          Les bureaux, candidats et utilisateurs ne seront pas supprimés.
          Cette action est <strong>irréversible</strong>.
        </p>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--fantome" @click="showModalReset = false">Annuler</button>
          <button class="btn btn--danger" @click="resetElection">
            Confirmer la réinitialisation
          </button>
        </div>
      </div>
    </div>

    <!-- ===== MODAL BUREAU ===== -->
    <div class="modal-overlay" v-if="showModalBureau" @click.self="showModalBureau = false">
      <div class="modal-box">
        <h2 class="modal-titre">{{ formBureau.id ? 'Modifier le bureau' : 'Nouveau bureau' }}</h2>
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
        <div v-if="formBureau.id" class="form-group bureaux-checkboxes">
          <label  class="checkbox-label">Délégué</label>
          <template v-for="user in dispsDelegue(store.bureauCourant)" :key="user.id">
            <label>
              <input
                  type="checkbox"
                  :checked="user.role === 'delegue'"
                  @change="toggleAssignationDelegue(user.id, $event.target.checked)"
              >
              {{ user.nom }} {{ user.prenom }}
            </label>
          </template>
          <label  class="checkbox-label">Assesseurs</label>
          <label v-for="user in dispsAssesseur(store.bureauCourant)" :key="user.id" class="checkbox-label">
            <input
                type="checkbox"
                :checked="user.role === 'assesseur'"
                @change="toggleAssignationAssesseur(user.id, $event.target.checked)"
            />
            {{ user.nom }} {{ user.prenom }}
          </label>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--fantome" @click="showModalBureau = false">Annuler</button>
          <button class="btn btn--primaire" @click="sauvegarderBureau">
            {{ formBureau.id ? 'Modifier' : 'Créer' }}
          </button>
          <button v-if="formBureau.id" class="btn btn--danger btn--sm" @click.stop="supprimerBureau(formBureau.id)">
            Supprimer
          </button>
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
          <button v-if="formCandidat.id" class="btn btn--danger btn--sm" @click="supprimerCandidat(formCandidat.id)">Supprimer</button>
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
          <input v-model="formUser.email" type="email" class="form-control" :disabled="formUser.id"/>
        </div>
        <template v-if="store.electionCourante && formUser.id">
          <div class="form-group">
            <label class="form-label">Propriétaire</label>
            <input v-model="formUser.isOwner" type="checkbox" class="form-control"/>
          </div>
          <div class="form-group">
            <label class="form-label">Rôle</label>
            <div style="display: flex; align-items: center; gap: 0.75rem">
              <select v-model="formUser.role" class="form-control">
                <option value="aucun">Aucun</option>
                <option value="assesseur">Assesseur</option>
                <option value="delegue">Délégué</option>
              </select>
              <label v-if="formUser.role !== 'aucun'" class="checkbox-label">Titulaire <input v-model="formUser.isTitulaire" type="checkbox" class="form-control"/></label>
            </div>
          </div>
          <div v-if="formUser.role === 'assesseur'" class="form-group">
            <label class="form-label">Bureau assigné</label>
            <select v-model="formUser.bureauAssesseur" class="form-control">
              <option :value="null">— Aucun —</option>
              <option v-for="b in store.bureaux" :key="b.id" :value="b.id">
                Bureau {{ b.numero }} — {{ b.nom }}
              </option>
            </select>
            <select v-if="formUser.bureauAssesseur" v-model="formUser.periodeAssesseur">
              <option value="M">Matin</option>
              <option value="AM">Après-midi</option>
              <option value="J">Journée entière</option>
            </select>
          </div>
          <div v-if="formUser.role === 'delegue'" class="form-group">
            <label class="form-label">Bureaux assignés</label>
            <div class="bureaux-checkboxes">
              <label v-for="b in store.bureaux" :key="b.id" class="checkbox-label">
                <input type="checkbox" :value="b.id" v-model="formUser.bureauxDelegue" />
                Bureau {{ b.numero }} — {{ b.nom }}
              </label>
            </div>
          </div>
          <div class="form-group user-subgroup">
            <label class="form-label">Disponibilité</label>
            Bureau de vote
            <select v-model="formUser.dispBureauId" class="form-control">
              <option :value="null">— Aucun —</option>
              <option v-for="b in store.bureaux" :key="b.id" :value="b.id">
                Bureau {{ b.numero }} — {{ b.nom }}
              </option>
            </select>
            <div style="display: flex; flex-direction: column; gap: 0.5rem">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formUser.dispAssesseur" /><select v-if="formUser.dispAssesseur" v-model="formUser.periode">
                <option value="M">Matin</option>
                <option value="AM">Après-midi</option>
                <option value="J">Journée entière</option>
              </select>
                Assesseur
              </label>
              <label class="checkbox-label">
                <input type="checkbox" v-model="formUser.dispDelegue" />
                Délégué
              </label>
            </div>
          </div>
        </template>
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end">
          <button class="btn btn--fantome" @click="showModalUser = false">Annuler</button>
          <button class="btn btn--primaire" @click="sauvegarderUser">
            {{ formUser.id ? 'Modifier' : 'Créer' }}
          </button>
          <button v-if="formUser.id" class="btn btn--danger btn--sm" @click="supprimerUser(formUser.id)">
            Supprimer
          </button>
        </div>
      </div>
    </div>
    </div>
  </main>
</template>

<script setup>
import {ref, reactive, onMounted, watch} from 'vue'
import { useElectionStore } from '@/stores/election'
import { useAuthStore } from '@/stores/auth'
import { adminAPI, ownerAPI } from '@/api'

const store = useElectionStore()
const auth = useAuthStore()
const messageSucces = ref('')
const messageErreur = ref('')

const activeTab = ref('candidats')
const users = ref([])
const showModalBureau = ref(false)
const showModalCandidat = ref(false)
const showModalUser = ref(false)
const showModalReset = ref(false)

const formElection = reactive({ id: null, nom: '' })
const formBureau = reactive({ id: null, numero: 1, nom: '', adresse: '', inscrits: 0 })
const formCandidat = reactive({ id: null, nom: '', prenom: '', liste: '', couleur: '#003189', ordre: 1 })
const formUser = reactive({ id: null, nom: '', prenom: '', email: '', bureauAssesseur: undefined, periodeAssesseur: 'J', bureauxDelegue: [], isAdmin: false, role: 'aucun', bureaux: [], isTitulaire: false, isOwner: false, dispBureauId: null, dispAssesseur: false, dispDelegue: false, periode: "J" })

async function activateTab(id) {
  switch(id) {
    case "bureaux":
      await store.chargerBureauxWithUsers()
      break;
    case "candidats":
      await store.chargerCandidats()
      break;
    case "utilisateurs":
      users.value = await store.chargerUsers()
      break;
  }
  activeTab.value = id
}
function assesseurs(bureau) {
  return bureau.users?.filter(u => u.role === 'assesseur') ?? []
}
function delegues() {
  return users.value?.filter(u => u.role === 'delegue') ?? []
}
function dispsDelegue(bureau) {
  return bureau.users?.filter(u => u.dispDelegue) ?? []
}
function dispsAssesseur(bureau) {
  return bureau.users?.filter(u => u.dispAssesseur)?? []
}

function showMsg(msg, type = 'succes') {
  if (type === 'succes') { messageSucces.value = msg; messageErreur.value = '' }
  else { messageErreur.value = msg; messageSucces.value = '' }
  setTimeout(() => { messageSucces.value = ''; messageErreur.value = '' }, 3500)
}

// ===== ELECTIONS =====
async function sauvegarderElection() {
  try {
      await store.modifierElection(formElection.id, { nom: formElection.nom })
      showMsg('Election modifiée ✓')
  } catch (e) {
    console.error("Erreur sauvegarderElection :", e)
    showMsg(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}

// ===== BUREAUX =====
function ouvrirModalBureau(bureau = null) {
  if (bureau) {
    // Recharger bureau ???
    store.bureauCourant = bureau
    Object.assign(formBureau, { id: bureau.id, numero: bureau.numero, nom: bureau.nom, adresse: bureau.adresse, inscrits: bureau.inscrits })
  } else {
    store.bureauCourant = undefined
    Object.assign(formBureau, { id: null, numero: store.bureaux.length + 1, nom: '', adresse: '', inscrits: 0 })
  }
  showModalBureau.value = true
}
async function sauvegarderBureau() {
  if (!formBureau.nom?.trim()) { showMsg('Le nom du bureau est obligatoire', 'erreur'); return }
  if (!formBureau.numero || formBureau.numero < 1) { showMsg('Le numéro du bureau doit être au moins 1', 'erreur'); return }
  try {
    if (formBureau.id) {
      await store.modifierBureau(formBureau.id, { numero: formBureau.numero, nom: formBureau.nom, adresse: formBureau.adresse, inscrits: formBureau.inscrits })
      showMsg('Bureau modifié ✓')
    } else {
      await store.creerBureau({ numero: formBureau.numero, nom: formBureau.nom, adresse: formBureau.adresse, inscrits: formBureau.inscrits })
      showMsg('Bureau créé ✓')
    }
    await store.chargerBureauxWithUsers()
    showModalBureau.value = false
  } catch (e) {
    showMsg(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}
function nomBureau(id) {
  const bureau = store.bureaux.find(b => b.id === id)
  if (!bureau) return ''
  return `${bureau.numero} - ${bureau.nom}`
}
async function supprimerBureau(id) {
  if (!confirm('Supprimer ce bureau ? Toutes ses données seront perdues.')) return
  try {
    await store.supprimerBureau(id)
    showMsg('Bureau supprimé ✓')
    showModalBureau.value = false
  } catch (e) {
    showMsg('Erreur lors de la suppression', 'erreur')
  }
}
async function toggleAssignationAssesseur(userId, checked) {
  if (!store.bureauCourant) return
  try {
    if (checked) {
      await ownerAPI.assignAssesseur(store.electionCourante.id, store.bureauCourant.id, userId)
    } else {
      await ownerAPI.removeAssesseur(store.electionCourante.id, store.bureauCourant.id, userId)
    }
    await store.chargerBureauxWithUsers()
    store.bureauCourant = store.bureaux.find(b => b.id === store.bureauCourant.id)
    showMsg('Assignation mise à jour ✓')
  } catch (e) {
    showMsg('Erreur', 'erreur')
  }
}
async function toggleAssignationDelegue(userId, checked) {
  if (!store.bureauCourant) return
  try {
    if (checked) {
      await ownerAPI.assignDelegue(store.electionCourante.id, store.bureauCourant.id, userId)
    } else {
      await ownerAPI.removeDelegue(store.electionCourante.id, store.bureauCourant.id, userId)
    }
    await store.chargerBureauxWithUsers()
    store.bureauCourant = store.bureaux.find(b => b.id === store.bureauCourant.id)
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
  if (!formCandidat.nom?.trim()) { showMsg('Le nom du candidat est obligatoire', 'erreur'); return }
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
  showModalCandidat.value = false
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
      isOwner: user.isOwner,
      role: user.role,
      isTitulaire: user.isTitulaire,
      bureauxDelegue: user.role == 'delegue' ? user.bureaux.map(b => b.id) : [],
      bureauAssesseur: user.role == 'assesseur' && user.bureaux && user.bureaux.length > 0 ? user.bureaux[0].id : undefined,
      periodeAssesseur: user.role == 'assesseur' && user.bureaux && user.bureaux.length > 0 ? user.bureaux[0].periode : "J",
      bureaux: user.bureaux,
      dispBureauId: user.dispBureauId ?? null,
      dispAssesseur: user.dispAssesseur ?? false,
      dispDelegue: user.dispDelegue ?? false,
      periode: user.periode
    })
  } else {
    Object.assign(formUser, {
      id: null,
      nom: '', prenom: '', email: '',
      isAdmin: false, isOwner: false, role: 'aucun', isTitulaire: false,
      bureauxDelegue: [],
      bureauAssesseur: undefined,
      periodeAssesseur: "J",
      bureaux: [],
      dispBureauId: null, dispAssesseur: false, dispDelegue: false, periode: 'J' })
  }
  showModalUser.value = true
}
async function sauvegarderUser() {
  if (!formUser.nom?.trim()) { showMsg('Le nom est obligatoire', 'erreur'); return }
  if (!formUser.prenom?.trim()) { showMsg('Le prénom est obligatoire', 'erreur'); return }
  if (!formUser.email?.trim()) { showMsg('L\'email est obligatoire', 'erreur'); return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formUser.email)) { showMsg('L\'email n\'est pas valide', 'erreur'); return }
  let bureaux = [];
  switch(formUser.role) {
    case 'delegue':
      bureaux = formUser.bureauxDelegue.map(b => { return {id: b,periode: ''} } )
      break;
    case 'assesseur':
      bureaux = formUser.bureauAssesseur ? [{id: formUser.bureauAssesseur, periode: formUser.periodeAssesseur }] : []
      break;
    default:
      break;
  }
  try {
    const payload = {
      nom: formUser.nom,
      prenom: formUser.prenom,
      email: formUser.email,
      role: formUser.id ? formUser.role : "aucun",
      isTitulaire: formUser.id ? formUser.isTitulaire : false,
      isAdmin: formUser.id ? formUser.isAdmin : false,
      isOwner: formUser.id ? formUser.isOwner : false,
      bureaux: formUser.id ? bureaux : [],
      dispBureauId: formUser.id ? formUser.dispBureauId : undefined,
      dispAssesseur: formUser.id ? formUser.dispAssesseur : false,
      dispDelegue: formUser.id ? formUser.dispDelegue : false,
      periode: formUser.id ? formUser.periode : ""
    }

    if(store.electionCourante) {
      if(formUser.id) {
        await ownerAPI.updateUser(store.electionCourante.id, formUser.id, payload)
        showMsg('Utilisateur modifié ✓')
      } else {
        await ownerAPI.createUser(store.electionCourante.id, payload)
        showMsg('Utilisateur créé ✓')
      }
    } else {
      if (formUser.id) {
        await adminAPI.updateUser(formUser.id, payload)
        showMsg('Utilisateur modifié ✓')
      } else {
        await adminAPI.createUser(payload)
        showMsg('Utilisateur créé ✓')
      }
    }
    users.value = await store.chargerUsers(auth.isAdmin)
    showModalUser.value = false
  } catch (e) {
    showMsg(e.response?.data?.reason || 'Erreur', 'erreur')
  }
}
async function supprimerUser(id) {
  if (!confirm('Supprimer cet utilisateur ?')) return
  try {
    await ownerAPI.blacklistUser(store.electionCourante.id, id)
    users.value = await store.chargerUsers(auth.isAdmin)
    showMsg('Utilisateur retiré ✓')
  } catch (e) {
    showMsg('Erreur', 'erreur')
  }
}

// ===== RESET =====
function showReset() {
  showModalReset.value = true
}

async function resetElection() {
  try {
    await store.resetElection()
    showModalReset.value = false
    showMsg('Données réinitialisées ✓')
  } catch (e) {
    showMsg('Erreur lors de la réinitialisation', 'erreur')
  }
}

onMounted(async () => {
  if (!store.electionCourante) return
  await store.chargerElection()
  Object.assign(formElection, { id: store.electionCourante.id, nom: store.electionCourante.nom })
  users.value = await store.chargerUsers()
  await activateTab(activeTab.value)
})

watch(() => store.electionCourante, async (newVal, oldVal) => {
  if (newVal?.id !== oldVal?.id) {
    if (!newVal) return
    Object.assign(formElection, { id: newVal.id, nom: newVal.nom })
    users.value = await store.chargerUsers()
    await activateTab(activeTab.value)
  }
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
