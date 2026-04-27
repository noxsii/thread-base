import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [vue(), vueDevTools(), tsconfigPaths()],
})