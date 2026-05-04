import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

function uuidEmail(uuid: string) {
  return `${uuid}@thread-base.local`
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null && session.value !== null)

  async function initialize() {
    if (initialized.value) return
    initialized.value = true

    const { data } = await supabase.auth.getSession()
    session.value = data.session
    user.value = data.session?.user ?? null

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })

    loading.value = false
  }

  async function signInWithUuid(uuid: string) {
    const email = uuidEmail(uuid)
    const password = uuid

    const first = await supabase.auth.signInWithPassword({ email, password })
    if (!first.error) return first.data

    const signupRes = await supabase.functions.invoke<{ ok: boolean; id: string }>(
      'uuid-signup',
      { body: { uuid } },
    )
    if (signupRes.error) throw signupRes.error

    const second = await supabase.auth.signInWithPassword({ email, password })
    if (second.error) throw second.error
    return second.data
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return {
    user,
    session,
    loading,
    isAuthenticated,
    initialize,
    signInWithUuid,
    signOut,
  }
})
