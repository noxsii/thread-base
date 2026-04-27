import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const store = useAuthStore()
  const { user, session, loading, isAuthenticated } = storeToRefs(store)
  return {
    user,
    session,
    loading,
    isAuthenticated,
    signOut: () => store.signOut(),
  }
}
