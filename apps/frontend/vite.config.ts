import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Validate required environment variables for production builds
  if (mode === 'production') {
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ]
    
    const missingVars = requiredEnvVars.filter(key => !env[key])
    if (missingVars.length > 0) {
      console.error('⚠️  Error: Missing required environment variables:', missingVars.join(', '))
      console.error('   Firebase will not initialize correctly in production.')
      console.error('   Set these variables in your Vercel Dashboard or .env file.')
    }
  }
  
  return {
    // Explicitly set root for Vercel/Turborepo compatibility
    // Root must be the directory containing index.html and src/
    root: __dirname,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Force optimization of dependencies for monorepo
    // This prevents workspace resolution issues
    optimizeDeps: {
      force: true,
      include: ['react', 'react-dom', 'react-router-dom', 'firebase', 'date-fns', 'zustand'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    build: {
      // Output directory relative to the root (packages/frontend)
      outDir: 'dist',
      sourcemap: true,
      // Performance optimizations
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'date-vendor': ['date-fns'],
          },
        },
      },
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
  }
})
