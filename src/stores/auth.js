import { defineStore } from 'pinia'
import { authAPI } from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('elections_token') || null,
    user: JSON.parse(localStorage.getItem('elections_user') || 'null'),
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    bureauxAutorisés: (state) => state.user?.bureaux || [],
  },

  actions: {
    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const response = await authAPI.login(email, password)
        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('elections_token', this.token)
        localStorage.setItem('elections_user', JSON.stringify(this.user))
        return true
      } catch (err) {
        this.error = err.response?.data?.reason || 'Erreur de connexion'
        return false
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('elections_token')
      localStorage.removeItem('elections_user')
    },

    canAccessBureau(bureauId) {
      if (this.isAdmin) return true
      return this.bureauxAutorisés.includes(bureauId)
    },
  }
})
