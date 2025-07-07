import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    // Configuração base essencial para produção
    base: isProduction ? '/' : '/',
    
    plugins: [react(), tailwindcss()],
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    // Configurações de build para produção
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        }
      }
    },
    
    // Configurações do servidor (somente desenvolvimento)
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api/internal': {
          target: 'https://10.101.200.180:7002',
          changeOrigin: true,
          secure: false, // Apenas para desenvolvimento
          // CORREÇÃO: Não remover o /api do caminho, apenas o /internal
          rewrite: (path) => path.replace(/^\/api\/internal/, '/api'),
          headers: {
            Connection: 'keep-alive'
          },
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[INTERNAL] Proxying: ${req.method} ${req.url} -> ${proxyReq.path}`);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`[INTERNAL] Response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
            });
            proxy.on('error', (err, _req, res) => {
              console.error('[INTERNAL] Proxy error:', err);
              if (!res.headersSent) {
                res.writeHead(500, {
                  'Content-Type': 'application/json'
                });
                res.end(JSON.stringify({ error: 'Internal API proxy error' }));
              }
            });
          }
        },
        '/api/external': {
          target: 'https://129.148.37.60:7002',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api\/external/, '/api'),
          headers: {
            Connection: 'keep-alive'
          },
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log(`[EXTERNAL] Proxying: ${req.method} ${req.url} -> ${proxyReq.path}`);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`[EXTERNAL] Response: ${req.method} ${req.url} -> ${proxyRes.statusCode}`);
            });
            proxy.on('error', (err, _req, res) => {
              console.error('[EXTERNAL] Proxy error:', err);
              if (!res.headersSent) {
                res.writeHead(502, {
                  'Content-Type': 'application/json'
                });
                res.end(JSON.stringify({ error: 'External API proxy error' }));
              }
            });
          }
        }
      }
    }
  };
});