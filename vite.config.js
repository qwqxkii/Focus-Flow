import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/',
  plugins: [vue()],
  assetsInclude: ['**/*.md'],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "sass:math";
          @use "sass:color";
        `,
        api: "modern"
      }
    }
  },
  build: {
    cssCodeSplit: true,
    cssMinify: true
  },
  server: {
    proxy: {
      '/api/hitokoto': {
        target: 'https://v1.hitokoto.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hitokoto/, '')
      }
    }
  }
}) 