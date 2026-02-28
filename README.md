# Elections-Frontend

Interface web pour le suivi en direct du dépouillement électoral.

Développé avec **Vue 3**, **Vite**, **Pinia** et **Vue Router**.

## Prérequis

- Node.js 18+
- L'API backend `Elections-Backend` doit être en cours d'exécution sur `http://localhost:8080`

## Installation

```bash
npm install
npm run dev
# L'application est disponible sur http://localhost:5173
```

## Build de production

```bash
npm run build
# Les fichiers sont générés dans le dossier /dist
```

## Configuration

Pour pointer vers un backend différent (production), modifiez le proxy dans `vite.config.js` :

```js
server: {
  proxy: {
    '/api': {
      target: 'https://votre-backend.fr',
      changeOrigin: true
    }
  }
}
```

Ou configurez la variable `VITE_API_URL` et adaptez `src/api/index.js`.

## Structure de l'application

```
src/
├── api/          # Client HTTP (axios) — toutes les requêtes API
├── components/   # Composants réutilisables (Navbar...)
├── router/       # Vue Router — routes et guards
├── stores/       # Pinia — état global (auth, election)
├── styles/       # CSS global — design system
└── views/        # Pages de l'application
    ├── AccueilView.vue          # Résultats publics live (auto-refresh 30s)
    ├── BureauPublicView.vue     # Détail d'un bureau (public)
    ├── LoginView.vue            # Connexion scrutateur
    ├── ScrutateurHomeView.vue   # Liste des bureaux assignés
    ├── ScrutateurBureauView.vue # Saisie dépouillement
    └── AdminView.vue            # Administration complète
```

## Fonctionnalités

### Vue publique (sans connexion)
- **Résultats en direct** — synthèse commune, classement des candidats, barres de progression
- **Taux de participation** — par heure et bureau
- **Détail par bureau** — résultats et participation d'un bureau spécifique
- **Auto-refresh** toutes les 30 secondes

### Espace scrutateur (connexion requise)
- Liste des bureaux assignés avec état du dépouillement
- **Saisie des données par bureau** :
  - Informations générales (inscrits, bulletins dépouillés/nuls/blancs)
  - Taux de participation à 5 tranches horaires (9h, 11h, 14h, 17h, clôture)
  - Résultats partiels et finaux par candidat

### Administration (compte admin requis)
- Gestion des **bureaux** (création, suppression, assignation des scrutateurs)
- Gestion des **candidats/listes** (avec couleur et ordre d'affichage)
- Gestion des **utilisateurs scrutateurs**
- **Réinitialisation** complète des données de vote
