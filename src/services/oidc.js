import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

const oidcConfig = {
  authority: import.meta.env.VITE_ZITADEL_ISSUER,
  client_id: import.meta.env.VITE_ZITADEL_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_ZITADEL_REDIRECT_URI,
  post_logout_redirect_uri: import.meta.env.VITE_ZITADEL_POST_LOGOUT_URI,

  // Scopes demandés à Zitadel
  scope: 'openid profile email',

  // PKCE est activé par défaut dans oidc-client-ts
  response_type: 'code',

  // Stockage de la session dans localStorage
  userStore: new WebStorageStateStore({ store: window.localStorage }),

  // Renouvellement silencieux du token (optionnel, nécessite une iframe)
  automaticSilentRenew: false,
}

export const userManager = new UserManager(oidcConfig)

/**
 * Déclenche la redirection vers la page de connexion Zitadel.
 * @param {string} redirectTo - Route de l'app à atteindre après login (ex: '/scrutateur')
 */
export function login(redirectTo = '/scrutateur') {
  return userManager.signinRedirect({ state: redirectTo })
}

/**
 * Traite le retour Zitadel sur /auth/callback.
 * Retourne l'objet OIDC User.
 */
export function handleCallback() {
  return userManager.signinRedirectCallback()
}

/**
 * Retourne l'utilisateur OIDC courant (depuis le storage), ou null.
 */
export function getOidcUser() {
  return userManager.getUser()
}

/**
 * Déconnexion : invalide la session côté Zitadel et redirige.
 */
export function logout() {
  return userManager.signoutRedirect()
}
