import { defineStore } from 'pinia'
import { publicAPI, scrutateurAPI, adminAPI } from '@/api'

export const useElectionStore = defineStore('election', {
  state: () => ({
    synthese: null,
    bureaux: [],
    candidats: [],
    bureauCourant: null,
    loading: false,
    error: null,
    lastUpdate: null,
  }),

  getters: {
    totalInscrits: (state) => state.synthese?.totalInscrits || 0,
    totalVotants: (state) => state.synthese?.totalVotants || 0,
    tauxParticipation: (state) => state.synthese?.tauxParticipationGlobal || 0,
    resultatsGlobaux: (state) => state.synthese?.resultatsGlobaux || [],
    bureauxTermines: (state) => state.synthese?.bureauxTermines || 0,
    totalBureaux: (state) => state.synthese?.totalBureaux || 0,
  },

  actions: {
    async chargerSynthese() {
      try {
        const res = await publicAPI.getSynthese()
        this.synthese = res.data
        this.lastUpdate = new Date()
      } catch (err) {
        this.error = 'Erreur lors du chargement de la synthèse'
      }
    },

    async chargerBureaux() {
      try {
        const res = await publicAPI.getBureaux()
        this.bureaux = res.data
      } catch (err) {
        this.error = 'Erreur lors du chargement des bureaux'
      }
    },

    async chargerBureau(id) {
      this.loading = true
      try {
        const res = await publicAPI.getBureau(id)
        this.bureauCourant = res.data
        return res.data
      } catch (err) {
        this.error = 'Bureau introuvable'
        return null
      } finally {
        this.loading = false
      }
    },

    async chargerCandidats() {
      try {
        const res = await publicAPI.getCandidats()
        this.candidats = res.data
      } catch (err) {
        this.error = 'Erreur lors du chargement des candidats'
      }
    },

    async sauvegarderParticipation(bureauId, heure, votants) {
      const res = await scrutateurAPI.upsertParticipation(bureauId, heure, votants)
      // Refresh bureau
      await this.chargerBureau(bureauId)
      return res.data
    },

    async sauvegarderResultat(bureauId, candidatId, voix, bulletinsDepouilles, estFinal = false) {
      const res = await scrutateurAPI.upsertResultat(bureauId, {
        candidatId, voix, bulletinsDepouilles, estFinal
      })
      await this.chargerBureau(bureauId)
      return res.data
    },

    async mettreAJourBureau(id, data) {
      const res = await scrutateurAPI.updateBureau(id, data)
      await this.chargerBureau(id)
      return res.data
    },

    // Admin actions
    async creerBureau(data) {
      const res = await adminAPI.createBureau(data)
      await this.chargerBureaux()
      return res.data
    },

    async supprimerBureau(id) {
      await adminAPI.deleteBureau(id)
      await this.chargerBureaux()
    },

    async creerCandidat(data) {
      const res = await adminAPI.createCandidat(data)
      await this.chargerCandidats()
      return res.data
    },

    async modifierCandidat(id, data) {
      const res = await adminAPI.updateCandidat(id, data)
      await this.chargerCandidats()
      return res.data
    },

    async supprimerCandidat(id) {
      await adminAPI.deleteCandidat(id)
      await this.chargerCandidats()
    },
  }
})
