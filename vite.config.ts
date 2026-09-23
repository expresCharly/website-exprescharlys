import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  for (const name of ['VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY']) {
    const value = env[name]?.trim()
    if (!value || value.startsWith('sb_publishable_')) continue
    let isAnon = false
    try { isAnon = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()).role === 'anon' } catch { /* Clave inválida. */ }
    if (!isAnon) throw new Error(`${name} debe contener una clave pública publishable o anon. Se detuvo la compilación para evitar publicar una clave privada.`)
  }
  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      host: true,
    },
    build: {
      outDir: 'dist',
      minify: 'esbuild',
      sourcemap: false,
    },
  }
})
