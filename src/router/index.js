import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'accueil',
    component: () => import('@/views/AccueilView.vue'),
    meta: { title: 'Résultats en direct' }
  },
  {
    path: '/bureau/:id',
    name: 'bureau-public',
    component: () => import('@/views/BureauPublicView.vue'),
    meta: { title: 'Bureau de vote' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Connexion', guestOnly: true }
  },
  {
    path: '/scrutateur',
    name: 'scrutateur-home',
    component: () => import('@/views/ScrutateurHomeView.vue'),
    meta: { title: 'Mes bureaux', requiresAuth: true }
  },
  {
    path: '/scrutateur/bureau/:id',
    name: 'scrutateur-bureau',
    component: () => import('@/views/ScrutateurBureauView.vue'),
    meta: { title: 'Saisie dépouillement', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { title: 'Administration', requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  document.title = `${to.meta.title || 'Élections'} — Dépouillement`

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return next('/login')
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login')
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return next('/scrutateur')
  }
  next()
})

export default router
