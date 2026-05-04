import { ref } from 'vue'
import { defineStore } from 'pinia'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const useDeviceUuidStore = defineStore(
  'deviceUuid',
  () => {
    const uuid = ref<string | null>(null)

    function ensure(): string {
      if (uuid.value && UUID_REGEX.test(uuid.value)) return uuid.value
      uuid.value = crypto.randomUUID()
      return uuid.value
    }

    function clear() {
      uuid.value = null
    }

    return { uuid, ensure, clear }
  },
  {
    persist: {
      key: 'thread-base.device-uuid',
      storage: localStorage,
    },
  },
)