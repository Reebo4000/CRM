import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Production-optimized Vite configuration
export default defineConfig({
  plugins: [react()],
  
  // Build optimization
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging (disable in production if not needed)
    sourcemap: false,
    
    // Minification (using esbuild by default)
    minify: 'esbuild',
    
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'axios'
          ],
          
          // UI components chunk
          ui: [
            'react-hook-form',
            '@hookform/resolvers',
            'yup'
          ],
          
          // Internationalization chunk
          i18n: [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector'
          ]
        },
        
        // Naming pattern for chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096,
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Report compressed size
    reportCompressedSize: true,
    
    // Write bundle to disk
    write: true,
    
    // Empty output directory before build
    emptyOutDir: true
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  
  // Preview server configuration (for production testing)
  preview: {
    port: 4173,
    host: true,
    strictPort: true
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-hook-form',
      'yup',
      'i18next',
      'react-i18next'
    ],
    
    // Exclude from pre-bundling
    exclude: []
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // CSS configuration
  css: {
    // CSS modules configuration
    modules: {
      localsConvention: 'camelCase'
    },
    
    // PostCSS configuration
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    },
    
    // CSS preprocessing
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Environment variables
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Enable/disable features
  esbuild: {
    // Remove console and debugger in production
    drop: ['console', 'debugger']
  },
  
  // Worker configuration
  worker: {
    format: 'es'
  }
})
