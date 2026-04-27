import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const store = useAuthStore()
  return {
    user: computed(() => store.user),
    session: computed(() => store.session),
    isAuthenticated: computed(() => store.isAuthenticated),
    signOut: () => store.signOut(),
  }
}
