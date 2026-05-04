const STORAGE_KEY = 'thread-base.device-uuid'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function useDeviceUuid() {
  function read(): string | null {
    const value = localStorage.getItem(STORAGE_KEY)
    return value && UUID_REGEX.test(value) ? value.toLowerCase() : null
  }

  function ensure(): string {
    const existing = read()
    if (existing) return existing
    const fresh = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, fresh)
    return fresh
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY)
  }

  return { read, ensure, clear }
}