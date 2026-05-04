import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from '@/App.vue'
import { router } from '@/router'
import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import '@/assets/main.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(i18n)

const auth = useAuthStore()
await auth.initialize()

app.use(router)
app.mount('#app')
