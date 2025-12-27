import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: true,
        proxy: {
          '/feishu-api': {
            target: 'https://open.feishu.cn',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/feishu-api/, ''),
          },
          '/xbotapi': {
            target: 'http://xbotapi.juhebot.com:33456',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/xbotapi/, ''),
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});