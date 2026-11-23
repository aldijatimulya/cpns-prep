import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' + HashRouter: aman untuk GitHub Pages (project site) tanpa mengatur nama repo.
export default defineConfig({
  plugins: [react()],
  base: './',
})
