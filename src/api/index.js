import axios from 'axios'
import { getOidcUser, userManager } from '@/services/oidc'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// File d'attente pour les requêtes en attente pendant un refresh
let isRefreshing = false
let refreshQueue = []

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token))
  refreshQueue = []
}

async function tryRefresh() {
  const renewed = await userManager.signinSilent()
  return renewed.access_token
}

// Injecte le token sur chaque requête — rafraîchit silencieusement si expiré
api.interceptors.request.use(async config => {
  let oidcUser = await getOidcUser()

  if (oidcUser?.expired) {
    if (isRefreshing) {
      // Attendre que le refresh en cours se termine
      const token = await new Promise((resolve, reject) => refreshQueue.push({ resolve, reject }))
      config.headers.Authorization = `Bearer ${token}`
      return config
    }
    isRefreshing = true
    try {
      const token = await tryRefresh()
      processQueue(null, token)
      config.headers.Authorization = `Bearer ${token}`
    } catch (err) {
      processQueue(err)
      await userManager.removeUser()  // supprime le token périmé du localStorage
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
    return config
  }

  if (oidcUser?.access_token) {
    config.headers.Authorization = `Bearer ${oidcUser.access_token}`
  }
  return config
})

// Sur 401 inattendu : tente un refresh une fois puis rejoue la requête
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then(token => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    isRefreshing = true
    try {
      const token = await tryRefresh()
      processQueue(null, token)
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch (refreshErr) {
      processQueue(refreshErr)
      await userManager.removeUser()  // supprime le token périmé du localStorage
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

// ===== AUTH =====
export const authAPI = {
  // Retourne le profil applicatif de l'utilisateur connecté (rôle + bureaux)
  // Le backend valide le token Zitadel et renvoie les données depuis sa propre DB
  me:       () => api.get('/auth/me'),
}


// ===== PUBLIC =====
export const publicAPI = {
  getSynthese: (electionId) => api.get(`/elections/${electionId}/synthese`),
  getElections:  () => api.get('/elections'),
  getElection:  (electionId) => api.get(`/elections/${electionId}`),
  getBureaux:  (electionId) => api.get(`/elections/${electionId}/bureaux`),
  getBureau:   (electionId,bureauId) => api.get(`/elections/${electionId}/bureaux/${bureauId}`),
  getBureauSynthese:   (electionId,bureauId) => api.get(`/elections/${electionId}/bureaux/${bureauId}/synthese`),
  getCandidats: (electionId) => api.get(`/elections/${electionId}/candidats`),
}

// ===== UTILISATEUR AUTHENTIFIÉ =====
export const authUserAPI = {
  me: (electionId) => api.get(`/me/elections/${electionId}`),
  updateMe: (data) => api.put('/me',data),
  updateMyPrefs: (userElectionId,data) => api.put(`/me/userElection/${userElectionId}`,data),
  joinElection: (electionId) => api.post(`/me/elections/${electionId}`,""),
  leaveElection: (electionId) => api.delete(`/me/elections/${electionId}`),
  joinedElections: () => api.get(`/me/elections`),
  profile: () => api.get(`/me/profile`),
}

// ===== DELEGUE =====
export const delegueAPI = {
  updateBureau:         (electionId, id, data) => api.put(`/delegue/elections/${electionId}/bureaux/${id}`, data),
  upsertParticipation:  (electionId, bureauId, heure, votants) => api.post(`/delegue/elections/${electionId}/bureaux/${bureauId}/participations`, { heure, votants }),
  upsertResultat:       (electionId, bureauId, data) => api.post(`/delegue/elections/${electionId}/bureaux/${bureauId}/resultats`, data),
  getBureaux:           (electionId) => api.get(`/delegue/elections/${electionId}/bureaux`),
  majInscrits:          (electionId, id, data) => api.patch(`/delegue/elections/${electionId}/bureaux/${id}/inscrits`, data),
  majVotants:           (electionId, id, data) => api.patch(`/delegue/elections/${electionId}/bureaux/${id}/votants`, data),
}

// ===== OWNER =====
export const ownerAPI = {
  // Elections
  deleteElection:      (electionId) => api.delete(`/owner/elections/${electionId}`),
  updateElection:      (electionId,data) => api.put(`/owner/elections/${electionId}`,data),

  // Bureaux
  getBureaux:  (electionId) => api.get(`/owner/elections/${electionId}/bureaux`),
  getBureau:   (electionId,bureauId) => api.get(`/owner/elections/${electionId}/bureaux/${bureauId}`),
  createBureau:      (electionId, data) => api.post(`/owner/elections/${electionId}/bureaux`, data),
  deleteBureau:      (electionId, id) => api.delete(`/owner/elections/${electionId}/bureaux/${id}`),
  assignDelegue:  (electionId, bureauId, userId) => api.post(`/owner/elections/${electionId}/bureaux/${bureauId}/delegue/${userId}`),
  removeDelegue:  (electionId, bureauId, userId) => api.delete(`/owner/elections/${electionId}/bureaux/${bureauId}/delegue/${userId}`),
  assignAssesseur:  (electionId, bureauId, userId) => api.post(`/owner/elections/${electionId}/bureaux/${bureauId}/assesseurs/${userId}`),
  removeAssesseur:  (electionId, bureauId, userId) => api.delete(`/owner/elections/${electionId}/bureaux/${bureauId}/assesseurs/${userId}`),

  // Users
  getUsers:    (electionId,) => api.get(`/owner/elections/${electionId}/users`),
  createUser:  (electionId, data) => api.post(`/owner/elections/${electionId}/users`, data),
  updateUser:  (electionId, id, data) => api.put(`/owner/elections/${electionId}/users/${id}`, data),
  blacklistUser:  (electionId, id) => api.delete(`/owner/elections/${electionId}/users/${id}`),

  // Candidats
  createCandidat: (electionId, data) => api.post(`/owner/elections/${electionId}/candidats`, data),
  updateCandidat: (electionId, id, data) => api.put(`/owner/elections/${electionId}/candidats/${id}`, data),
  deleteCandidat: (electionId, id) => api.delete(`/owner/elections/${electionId}/candidats/${id}`),

  // Reset
  resetElection: (electionId) => api.delete(`/owner/elections/${electionId}/reset`),
}

// ===== ADMIN =====
export const adminAPI = {
  // Elections
  createElection: (data) => api.post('/admin/elections', data),
  createOwner:    (electionId,ownerId) => api.post(`/admin/elections/${electionId}/owner/${ownerId}`),

  // Users
  getUsers:       () => api.get('/admin/users'),
  createUser:     (data) => api.post('/admin/users', data),
  updateUser:     (id,data) => api.put(`/admin/users/${id}`, data),
  deleteUser:     (id) => api.delete(`/admin/users/${id}`),
}

export default api
