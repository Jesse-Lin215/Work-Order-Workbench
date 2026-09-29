import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      viteSingleFile(),
      {
        name: 'serve-standalone-html-api',
        configureServer(server) {
          server.middlewares.use('/api/download-single-html', (req, res) => {
            const htmlPath = path.resolve(__dirname, 'dist/index.html');
            if (fs.existsSync(htmlPath)) {
              const content = fs.readFileSync(htmlPath);
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader(
                'Content-Disposition',
                'attachment; filename="workbench-standalone.html"'
              );
              res.end(content);
            } else {
              res.statusCode = 404;
              res.end('File not built yet.');
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
