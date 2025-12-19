import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const isProd = process.env.BUILD_MODE === 'prod'

export default defineConfig({
  plugins: [
    react({
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }), 
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2015',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false, // Disable in production for better performance
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Simplified manual chunks for better stability
        manualChunks: (id) => {
          // Node modules
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'utils-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            // Group other vendors
            return 'vendor';
          }
          // Source code chunks
          if (id.includes('/src/pages/')) {
            return 'pages';
          }
          if (id.includes('/src/components/')) {
            return 'components';
          }
          if (id.includes('/src/lib/')) {
            return 'lib';
          }
          if (id.includes('/src/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/src/utils/')) {
            return 'utils';
          }
          // Core app
          return 'app';
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react'
    ],
    exclude: [
      'recharts'
    ]
  },
  esbuild: {
    target: 'es2015',
    drop: isProd ? ['console', 'debugger'] : [],
  },
  server: {
    hmr: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})