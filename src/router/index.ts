import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { redirectIfAuthenticated, requireAuth } from './guards'

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
      component: () => import('@/views/LoginView.vue'),
      beforeEnter: redirectIfAuthenticated,
    },
    {
      name: 'rules',
      path: '/rules',
      component: () => import('@/views/RulesView.vue'),
    },
  ],
})
