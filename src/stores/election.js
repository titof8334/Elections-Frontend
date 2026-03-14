import { defineStore } from 'pinia'
import { publicAPI, delegueAPI, ownerAPI, adminAPI, authUserAPI} from '@/api'

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
    etatBureau(bureau) {
      if(bureau.depouillementTermine) return 'termine'
      else if(bureau.votants) return 'depouillement'
      else if(bureau.inscrits) return "ouvert"
      else return "ferme"
    },
    etatDisplay(etat) {
      switch (etat) {
        case 'ferme' :
          return { text: "Fermé", color: "badge--gris" }
        case 'ouvert' :
          return { text: "Ouvert - Votes en cours", color: "badge--or" }
        case 'depouillement' :
          return { text: "Clos - Dépouillement en cours", color: "badge--rouge" }
        default :
          return { text: "✓ Terminé", color: "badge--vert" }
      }
    },
    etatBureauDisplay(bureau) {
      return this.etatDisplay(this.etatBureau(bureau))
    },
    selectionnerElectionParDefaut() {
      if (this.elections.length > 0) {
        if (!this.electionCourante || !this.elections.some(e => e.id === this.electionCourante.id)) {
          this.electionCourante = this.elections.find(e => e.isOwner)
              || this.elections.find(e => e.isScrutateur)
              || this.elections.find(e => e.isSubscriber)
              || this.elections[0]
        }
      } else {
        this.electionCourante = undefined
      }
    },
    async chargerElections(all = true) {
      try {
        const res = all ? await publicAPI.getElections() : await authUserAPI.joinedElections()
        this.elections = res.data
        this.selectionnerElectionParDefaut()
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
        this.error = 'Erreur lors du chargement des utilisateurs'
      }
    },
    async resetElection() {
      this.loading = true
      if (!this.electionCourante) {
        this.error = "Pas d'élection courante"
        this.loading = false
        return null
      }
      try {
        const res = await ownerAPI.resetElection(this.electionCourante.id)
        this.electionCourante = res.data
      } catch (err) {
        this.error = 'Problème lors de la réinitialisation'
        return null
      } finally {
        this.loading = false
      }
    },
    async chargerElection(id) {
      this.loading = true
      if(!id) {
        if (!this.electionCourante) return null
        id = this.electionCourante.id
      }
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
        this.candidats = res.data
        return this.candidats
      } catch (err) {
        this.error = 'Erreur lors du chargement des candidats'
      }
    },

    async sauvegarderParticipation(bureauId, heure, votants) {
      const res = await delegueAPI.upsertParticipation(this.electionCourante.id, bureauId, heure, votants)
      // Refresh bureau
      this.bureauCourant = res.data
      return res.data
    },
    async mettreAJourInscritsBureau(bureauId, inscrits) {
      await delegueAPI.majInscrits(this.electionCourante.id, bureauId,inscrits)
    },
    async mettreAJourVotantsBureau(bureauId, votants) {
      const res = await delegueAPI.majVotants(this.electionCourante.id, bureauId, votants)
      return res.data
    },

    async sauvegarderResultats(resultats) {
      const res = await delegueAPI.upsertResultat(this.electionCourante.id, this.bureauCourant.id, resultats)
      this.bureauCourant = res.data
      return res.data
    },

    async mettreAJourBureau(id, data) {
      const res = await delegueAPI.updateBureau(this.electionCourante.id, id, data)
      await this.chargerBureau(id)
      return res.data
    },

    // Admin actions
    async creerElection(data) {
      const res = await adminAPI.createElection(data)
      await this.chargerElections()
      return res.data
    },
    async modifierElection(id, data) {
      const res = await ownerAPI.updateElection(id, data)
      await this.chargerElections()
      return res.data
    },
    async supprimerElection(id) {
      await ownerAPI.deleteElection(id)
      await this.chargerElections()
    },

    // ****** BUREAUX ******
    /** Bureaux d'une élection **/
    async chargerBureaux() {
      try {
        const res = await publicAPI.getBureaux(this.electionCourante.id)
        this.bureaux = res.data
      } catch (err) {
        this.error = 'Erreur lors du chargement des bureaux'
      }
    },
    /** Bureaux avec utilisateurs associés **/
    async chargerBureauxWithUsers() {
      try {
        const res = await ownerAPI.getBureaux(this.electionCourante.id)
        this.bureaux = res.data
      } catch (err) {
        this.error = 'Erreur lors du chargement des bureaux'
      }
    },
    /** Bureaux gérés par un scrutateur **/
    async chargerBureauxScrutateur() {
      try {
        const res = await delegueAPI.getBureaux(this.electionCourante.id)
        this.bureaux = res.data
      } catch (err) {
        this.error = 'Erreur lors du chargement des bureaux'
      }
    },

    async chargerBureau(id,withUsers = false) {
      this.loading = true
      try {
        const res = withUsers ? await ownerAPI.getBureau(this.electionCourante.id, id) : await publicAPI.getBureau(this.electionCourante.id, id)
        this.bureauCourant = res.data
      } catch (err) {
        this.error = 'Bureau introuvable'
        return null
      } finally {
        this.loading = false
      }
    },
    async chargerBureauSynthese(id) {
      this.loading = true
      try {
        const res = await publicAPI.getBureauSynthese(this.electionCourante.id, id)
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
      await this.chargerBureauxWithUsers()
      return res.data
    },
    async modifierBureau(id, data) {
      const res = await delegueAPI.updateBureau(this.electionCourante.id,id, data)
      await this.chargerBureauxWithUsers()
      return res.data
    },
    async supprimerBureau(id) {
      await ownerAPI.deleteBureau(this.electionCourante.id,id)
      await this.chargerBureauxWithUsers()
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
        return res.data
      } catch (err) {
        this.error = 'Profil introuvable'
        return null
      } finally {
        this.loading = false
      }
    }
  }
})
