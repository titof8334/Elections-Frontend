import { defineStore } from 'pinia'
import { publicAPI, delegueAPI, ownerAPI, adminAPI, authUserAPI} from '@/api'
import {useAuthStore} from "@/stores/auth";

export const useElectionStore = defineStore('election', {
  state: () => ({
    elections: [],
    electionCourante: null,
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
    clearStore() {
      this.elections = []
      this.electionCourante = null
      this.bureaux = []
      this.bureauCourant = null
      this.synthese = null
      this.candidats = []
      this.loading = false
      this.error = null
      this.lastUpdate = null
    },

    async chargerSynthese() {
      try {
        const res = await publicAPI.getSynthese(this.electionCourante.id)
        this.synthese = res.data
        this.lastUpdate = new Date()
      } catch (err) {
        this.error = 'Erreur lors du chargement de la synthèse'
      }
    },

    async chargerElections(all = true) {
      try {
        const res = all ? await publicAPI.getElections() : await authUserAPI.joinedElections()
        this.elections = res.data
        if (this.elections.length > 0) {
          if (!this.electionCourante || !this.elections.some(e => e.id == this.electionCourante.id)) {
            this.electionCourante = this.elections.find(e => e.isOwner)
                || this.elections.find(e => e.isDelegue)
                || this.elections.find(e => e.isSubscriber)
                || this.elections[0]
          }
        } else {
          this.electionCourante = undefined
        }
        console.log("electionCourante")
        console.log(this.electionCourante)
      } catch (err) {
        this.error = 'Erreur lors du chargement des élections'
      }
    },
    async chargerUsers(all = false) {
      try {
        if(all) {
          const res = await adminAPI.getUsers()
          return res.data
        } else {
          const res = await ownerAPI.getUsers(this.electionCourante.id)
          return res.data
        }
      } catch (err) {
        this.error = 'Erreur lors du chargement des élections'
      }
    },

    async chargerElection(id) {
      this.loading = true
      try {
        const res = await publicAPI.getElection(id)
        this.electionCourante = res.data
        return res.data
      } catch (err) {
        this.error = 'Election introuvable'
        return null
      } finally {
        this.loading = false
      }
    },

    async chargerCandidats() {
      try {
        const res = await publicAPI.getCandidats(this.electionCourante.id)
        console.log("candidats : ")
        console.log(res.data)
        this.candidats = res.data
        return this.candidats
      } catch (err) {
        this.error = 'Erreur lors du chargement des candidats'
      }
    },

    async sauvegarderParticipation(bureauId, heure, votants) {
      const res = await delegueAPI.upsertParticipation(bureauId, heure, votants)
      // Refresh bureau
      await this.chargerBureau(bureauId)
      return res.data
    },

    async sauvegarderResultat(bureauId, candidatId, voix, bulletinsDepouilles, estFinal = false) {
      const res = await delegueAPI.upsertResultat(bureauId, {
        candidatId, voix, bulletinsDepouilles, estFinal
      })
      await this.chargerBureau(bureauId)
      return res.data
    },

    async mettreAJourBureau(id, data) {
      const res = await delegueAPI.updateBureau(id, data)
      await this.chargerBureau(id)
      return res.data
    },

    // Admin actions
    async creerElection(data) {
      console.log("création élection : ",data)
      const res = await adminAPI.createElection(data)
      await this.chargerElections()
      return res.data
    },
    async modifierElection(id, data) {
      console.log("modification élection : ",id,data)
      const res = await ownerAPI.updateElection(id, data)
      await this.chargerElections()
      return res.data
    },
    async supprimerElection(id,all = true) {
      await ownerAPI.deleteElection(id)
      await this.chargerElections()
    },

    // ****** BUREAUX ******

    async chargerBureaux(withUsers = false) {
      try {
        const res = withUsers ? await ownerAPI.getBureaux(this.electionCourante.id) : await publicAPI.getBureaux(this.electionCourante.id)
        this.bureaux = res.data
      } catch (err) {
        this.error = 'Erreur lors du chargement des bureaux'
      }
    },
    async chargerBureau(id,withUsers = false) {
      this.loading = true
      try {
        const res = withUsers ? await ownerAPI.getBureau(id) : await publicAPI.getBureau(id)
        this.bureauCourant = res.data
      } catch (err) {
        this.error = 'Bureau introuvable'
        return null
      } finally {
        this.loading = false
      }
    },
    async creerBureau(data) {
      const res = await ownerAPI.createBureau(this.electionCourante.id,data)
      await this.chargerBureaux(true)
      return res.data
    },
    async modifierBureau(id, data, withUsers = false) {
      const res = await delegueAPI.updateBureau(this.electionCourante.id,id, data)
      await this.chargerBureaux(true)
      return res.data
    },
    async supprimerBureau(id) {
      await ownerAPI.deleteBureau(this.electionCourante.id,id)
      await this.chargerBureaux(true)
    },

    async creerCandidat(data) {
      const res = await ownerAPI.createCandidat(this.electionCourante.id,data)
      await this.chargerCandidats()
      return res.data
    },
    async modifierCandidat(id, data) {
      const res = await ownerAPI.updateCandidat(this.electionCourante.id,id, data)
      await this.chargerCandidats()
      return res.data
    },
    async supprimerCandidat(id) {
      await ownerAPI.deleteCandidat(this.electionCourante.id,id)
      await this.chargerCandidats()
    },
    async chargerProfil() {
      this.loading = true
      try {
        const res = await authUserAPI.profile()
        this.loading = false
        return res.data
      } catch (err) {
        this.error = 'Profil introuvable'
        this.loading = false
        return null
      }
    }
  }
})
