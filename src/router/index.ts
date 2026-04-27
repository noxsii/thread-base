import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { requireAuth } from './guards'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      beforeEnter: requireAuth,
    },
    {
      name: 'login',
      path: '/login',
      // TODO: replace HomeView placeholder with a real LoginView before shipping auth
      component: () => import('@/views/HomeView.vue'),
    },
  ],
})
