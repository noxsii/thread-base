import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null && state.session !== null,
  },

  actions: {
    async initialize() {
      if (this.initialized) return
      this.initialized = true

      const { data } = await supabase.auth.getSession()
      this.session = data.session
      this.user = data.session?.user ?? null

      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
      })

      this.loading = false
    },

    async signOut() {
      await supabase.auth.signOut()
    },
  },
})
