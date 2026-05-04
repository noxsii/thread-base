import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from '@/App.vue'
import { router } from '@/router'
import { useAuthStore } from '@/stores/auth'
import '@/assets/main.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)

const auth = useAuthStore()
await auth.initialize()

app.use(router)
app.mount('#app')
