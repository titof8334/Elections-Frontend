import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' }
})

// Inject JWT token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('elections_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('elections_token')
      localStorage.removeItem('elections_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ===== AUTH =====
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
}

// ===== PUBLIC =====
export const publicAPI = {
  getSynthese: () => api.get('/synthese'),
  getBureaux: () => api.get('/bureaux'),
  getBureau: (id) => api.get(`/bureaux/${id}`),
  getCandidats: () => api.get('/candidats'),
}

// ===== SCRUTATEUR =====
export const scrutateurAPI = {
  updateBureau: (id, data) => api.put(`/bureaux/${id}`, data),
  upsertParticipation: (bureauId, heure, votants) =>
    api.post(`/bureaux/${bureauId}/participations`, { heure, votants }),
  upsertResultat: (bureauId, data) =>
    api.post(`/bureaux/${bureauId}/resultats`, data),
}

// ===== ADMIN =====
export const adminAPI = {
  // Bureaux
  createBureau: (data) => api.post('/bureaux', data),
  deleteBureau: (id) => api.delete(`/bureaux/${id}`),
  assignScrutateur: (bureauId, userId) =>
    api.post(`/bureaux/${bureauId}/scrutateurs/${userId}`),
  removeScrutateur: (bureauId, userId) =>
    api.delete(`/bureaux/${bureauId}/scrutateurs/${userId}`),

  // Users
  getUsers: () => api.get('/users'),
  createUser: (data) => api.post('/users', data),
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Candidats
  createCandidat: (data) => api.post('/candidats', data),
  updateCandidat: (id, data) => api.put(`/candidats/${id}`, data),
  deleteCandidat: (id) => api.delete(`/candidats/${id}`),

  // Reset
  resetElection: () => api.delete('/reset'),
}

export default api
