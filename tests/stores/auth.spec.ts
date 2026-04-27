import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/lib/supabase', () => {
  const listeners: Array<(event: string, session: unknown) => void> = []
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
        onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
          listeners.push(cb)
          return { data: { subscription: { unsubscribe: vi.fn() } } }
        }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
      },
    },
  }
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useAuthStore', () => {
  it('starts with null user, null session, loading=true', () => {
    const auth = useAuthStore()
    expect(auth.user).toBeNull()
    expect(auth.session).toBeNull()
    expect(auth.loading).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
  })

  it('initialize() loads the current session and flips loading=false', async () => {
    const auth = useAuthStore()
    await auth.initialize()
    expect(auth.loading).toBe(false)
  })

  it('initialize() is idempotent — only subscribes once', async () => {
    const { supabase } = await import('@/lib/supabase')
    const auth = useAuthStore()
    await auth.initialize()
    await auth.initialize()
    expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1)
  })

  it('signOut() calls supabase.auth.signOut', async () => {
    const { supabase } = await import('@/lib/supabase')
    const auth = useAuthStore()
    await auth.signOut()
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
