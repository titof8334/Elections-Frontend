import { defineStore } from 'pinia'
import { login as oidcLogin, logout as oidcLogout, getOidcUser } from '@/services/oidc'
import api from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Utilisateur applicatif retourné par le backend (/auth/me)
    user: null,
    // Token d'accès Zitadel courant (utilisé par l'intercepteur axios)
    accessToken: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    bureauxAutorisés: (state) => state.user?.bureaux || [],
  },

  actions: {
    /**
     * Redirige vers la page de connexion Zitadel.
     * @param {string} redirectTo - Route à atteindre après connexion
     */
    loginWithSSO(redirectTo = '/scrutateur') {
      return oidcLogin(redirectTo)
    },

    /**
     * Appelé après le retour du callback Zitadel.
     * Charge le token OIDC puis récupère le profil applicatif depuis le backend.
     */
    async initFromOidc() {
      this.loading = true
      this.error = null
      try {
        const oidcUser = await getOidcUser()
        if (!oidcUser || oidcUser.expired) {
          this.accessToken = null
          this.user = null
          return false
        }

        this.accessToken = oidcUser.access_token

        // Récupère le rôle et les bureaux depuis le backend applicatif
        const response = await api.get('/auth/me')
        this.user = response.data // { role, bureaux, nom, prenom, ... }

        return true
      } catch (err) {
        this.error = err.response?.data?.reason || 'Erreur d\'initialisation de session'
        this.accessToken = null
        this.user = null
        return false
      } finally {
        this.loading = false
      }
    },

    /**
     * Déconnexion : invalide le token côté Zitadel et vide l'état local.
     */
    logout() {
      this.accessToken = null
      this.user = null
      return oidcLogout()
    },

    canAccessBureau(bureauId) {
      if (this.isAdmin) return true
      return this.bureauxAutorisés.includes(bureauId)
    },
  },
})
