import { defineStore } from 'pinia'
import { login as oidcLogin, logout as oidcLogout, getOidcUser } from '@/services/oidc'
import api, {authAPI, authUserAPI, delegueAPI, publicAPI} from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Utilisateur applicatif retourné par le backend (/auth/me)
    user: null,
    // Token d'accès Zitadel courant (utilisé par l'intercepteur axios)
    accessToken: null,
    loading: false,
    error: null,
    me: null,
    role: "aucun"
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    isAdmin: (state) => state.user?.isAdmin,
    bureauxAutorisés: (state) => state.user?.bureaux || [],
  },

  actions: {
    /**
     * Redirige vers la page de connexion Zitadel.
     * @param {string} redirectTo - Route à atteindre après connexion
     */
    loginWithSSO(redirectTo = '/') {
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
          this.error = oidcUser?.expired
              ? 'Session expirée, veuillez vous reconnecter.'
              : 'Session OIDC introuvable (localStorage vide ?).'
          this.accessToken = null
          this.user = null
          return false
        }

        this.accessToken = oidcUser.access_token

        // Récupère le rôle et les bureaux depuis le backend applicatif
        const response = await authAPI.me()
        this.user = response.data // { role, bureaux, nom, prenom, ... }
        return true
      } catch (err) {
        this.error = err.response?.data?.reason
            || err.message
            || 'Erreur d\'initialisation de session'
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

    /**
     * Permet à l'utilisateur connecté de mettre à jour son propre profil.
     */
    async mettreAJourProfil(data) {
      this.loading = true
      this.error = null
      try {
        const res = await authUserAPI.updateMe(data);
        this.user.nom = res.data.nom
        this.user.prenom = res.data.prenom
        this.user.email = res.data.email
        return true
      } catch (err) {
        this.error = err.response?.data?.reason || 'Erreur lors de la mise à jour du profil'
        return false
      } finally {
        this.loading = false
      }
    },
    async mettreAJourProfilElection(id, data) {
      this.loading = true
      this.error = null
      try {
        const res = await authUserAPI.updateMyPrefs(id, data);
        return res.data
      } catch (err) {
        this.error = err.response?.data?.reason || 'Erreur lors de la mise à jour du profil'
        return false
      } finally {
        this.loading = false
      }
    },
  },
})
