import axios from 'axios'
import { getOidcUser } from '@/services/oidc'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// Injecte le token Zitadel sur chaque requête
api.interceptors.request.use(async config => {
  const oidcUser = await getOidcUser()
  if (oidcUser?.access_token) {
    config.headers.Authorization = `Bearer ${oidcUser.access_token}`
  }
  return config
})

// Redirige vers /login sur 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(err)
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
  getCandidats: (electionId) => api.get(`/elections/${electionId}/candidats`),
}

// ===== UTILISATEUR AUTHENFIFIE =====
export const authUserAPI = {
  me: () => api.get(`/me/elections/${electionId}`),
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
  upsertResultat:       (electionId, bureauId, data) => api.post(`/delegue/elections/${electionId}/bureaux/${bureauId}/resultats`, data)
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
  deleteUser:  (electionId, id) => api.delete(`/owner/elections/${electionId}/users/${id}`),

  // Candidats
  createCandidat: (electionId, data) => api.post(`/owner/elections/${electionId}/candidats`, data),
  updateCandidat: (electionId, id, data) => api.put(`/owner/elections/${electionId}/candidats/${id}`, data),
  deleteCandidat: (electionId, id) => api.delete(`/owner/elections/${electionId}/candidats/${id}`),

  // Reset
  resetElection: () => api.delete(`/owner/elections/${electionId}/reset`),
}

// ===== ADMIN =====
export const adminAPI = {
  // Elections
  createElection: (data) => api.post('/admin/elections', data),
  createOwner:    (electionId,ownerId) => api.post(`/admin/elections/${id}/owner/${ownerId}`),

  // Users
  getUsers:       () => api.get('/admin/users'),
  updateUser:     (id,data) => api.put(`/admin/users/${id}`, data),
  deleteUser:     (id) => api.delete(`/admin/users/${id}`),
}

export default api
