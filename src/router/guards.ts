import type {NavigationGuard} from 'vue-router'
import {useAuthStore} from '@/stores/auth'

export const requireAuth: NavigationGuard = async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
}

export const redirectIfAuthenticated: NavigationGuard = async (to) => {
  const auth = useAuthStore()
  await auth.initialize()
  if (auth.isAuthenticated) {
    return typeof to.query.redirect === 'string' ? to.query.redirect : '/'
  }
}
