import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/sitemap.xml': {
        target: 'https://ckcqttsdpxfbpkzljctl.functions.supabase.co/functions/v1/generate-sitemap',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    cssCodeSplit: true,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui': [
            '@radix-ui/react-dialog', 
            '@radix-ui/react-slot', 
            '@radix-ui/react-toast',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox'
          ],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
          'query': ['@tanstack/react-query'],
          'forms': ['react-hook-form', '@hookform/resolvers'],
          'animations': ['framer-motion']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ]
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'tailwind-merge']
  },
  esbuild: {
    jsxInject: `import React from 'react'`
  }
}));