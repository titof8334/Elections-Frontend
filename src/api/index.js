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
  getSynthese: () => api.get('/synthese'),
  getBureaux:  () => api.get('/bureaux'),
  getBureau:   (id) => api.get(`/bureaux/${id}`),
  getCandidats: () => api.get('/candidats'),
}

// ===== DELEGUE =====
export const scrutateurAPI = {
  updateBureau: (id, data) => api.put(`/bureaux/${id}`, data),
  upsertParticipation: (bureauId, heure, votants) =>
    api.post(`/bureaux/${bureauId}/participations`, { heure, votants }),
  upsertResultat: (bureauId, data) =>
    api.post(`/bureaux/${bureauId}/resultats`, data),
  getUser:    (id) => api.get(`/user/${id}`),
  updateUser:    (id, data) => api.post(`/user/${id}`, data),
}

// ===== ADMIN =====
export const adminAPI = {
  // Bureaux
  createBureau:      (data) => api.post('/bureaux', data),
  updateBureau:      (id, data) => api.put(`/bureaux/${id}`, data),
  deleteBureau:      (id) => api.delete(`/bureaux/${id}`),
  assignScrutateur:  (bureauId, userId) => api.post(`/bureaux/${bureauId}/scrutateurs/${userId}`),
  removeScrutateur:  (bureauId, userId) => api.delete(`/bureaux/${bureauId}/scrutateurs/${userId}`),

  // Users
  getUsers:    () => api.get('/users'),
  createUser:  (data) => api.post('/users', data),
  updateUser:  (id,data) => api.put('/users/${id}', data),
  deleteUser:  (id) => api.delete(`/users/${id}`),

  // Candidats
  createCandidat: (data) => api.post('/candidats', data),
  updateCandidat: (id, data) => api.put(`/candidats/${id}`, data),
  deleteCandidat: (id) => api.delete(`/candidats/${id}`),

  // Reset
  resetElection: () => api.delete('/reset'),
}

export default api
