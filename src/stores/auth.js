import { defineStore } from 'pinia'
import { login as oidcLogin, logout as oidcLogout, getOidcUser } from '@/services/oidc'
import api, {authUserAPI, delegueAPI, publicAPI} from '@/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Utilisateur applicatif retourné par le backend (/auth/me)
    user: null,
    // Token d'accès Zitadel courant (utilisé par l'intercepteur axios)
    accessToken: null,
    loading: false,
    error: null,
    me: null,
    role: "aucun",
    isAdmin: false,
    isOwner:false
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
        console.log('[auth] initFromOidc – oidcUser:', oidcUser)
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
        console.log('[auth] Appel /auth/me…')
        const response = await api.get('/auth/me')
        console.log('[auth] /auth/me OK:', response.data)
        this.user = response.data // { role, bureaux, nom, prenom, ... }
        return true
      } catch (err) {
        console.error('[auth] initFromOidc erreur:', err)
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

    canAccessBureau(bureauId) {
      if (this.isAdmin || this.electionCourante.isOwner) return true
//      return this.bureauxAutorisés.includes(bureauId)
      return true
    },

    /**
     * Rafraîchit le profil applicatif depuis le backend sans toucher au token OIDC.
     * À appeler à l'ouverture de pages sensibles pour avoir des données à jour.
     */
/*    async chargerMe() {
      this.loading = true
      this.error = null
      try {
        let res = await auth.me
        return res.data;
      } catch (err) {
        this.error = err.response?.data?.reason || 'Impossible de récupérer le profil'
        return false
      } finally {
        this.loading = false
      }
    },*/

    /**
     * Permet à l'utilisateur connecté de mettre à jour son propre profil.
     */
    async mettreAJourProfil(data) {
      console.log("mettreAJourProfil : ", data)
      this.loading = true
      this.error = null
      try {
        console.log("userId : ", this.user?.id)
        console.log("Appel API")
        const res = await authUserAPI.updateMe(data);
        console.log("res : ", res)
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
      console.log("mettreAJourProfil : ", data)
      this.loading = true
      this.error = null
      try {
        console.log("Appel updateMyPrefs ",id,data)
        const res = await authUserAPI.updateMyPrefs(id, data);
        console.log(res)
        return res.data
      } catch (err) {
        console.log("erreur")
        console.log(err)
        this.error = err.response?.data?.reason || 'Erreur lors de la mise à jour du profil'
        return false
      } finally {
        this.loading = false
      }
    },
  },
})
