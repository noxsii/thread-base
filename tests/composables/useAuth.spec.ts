import { setActivePinia, createPinia } from 'pinia'
import { isRef } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { useAuth } from '@/composables/useAuth'
import { useAuthStore } from '@/stores/auth'

const mockUser = { id: 'u1' } as unknown as User
const mockSession = { access_token: 't' } as unknown as Session

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useAuth', () => {
  it('exposes reactive user, session, isAuthenticated', () => {
    const auth = useAuth()
    expect(isRef(auth.user)).toBe(true)
    expect(isRef(auth.session)).toBe(true)
    expect(isRef(auth.isAuthenticated)).toBe(true)
    expect(auth.user.value).toBeNull()
    expect(auth.isAuthenticated.value).toBe(false)
  })

  it('updates when the underlying store changes', () => {
    const store = useAuthStore()
    const auth = useAuth()
    store.user = mockUser
    store.session = mockSession
    expect(auth.user.value).toEqual(mockUser)
    expect(auth.isAuthenticated.value).toBe(true)
  })

  it('exposes signOut action', () => {
    const auth = useAuth()
    expect(typeof auth.signOut).toBe('function')
  })
})
