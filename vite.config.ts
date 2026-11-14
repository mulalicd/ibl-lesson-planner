import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';

/**
 * S6 (E-15): pages are loaded on demand (App.tsx). So that opening /plan/… does not wait for the main file before it
 * even asks for the plan page's files, index.html asks for the opened page's files at once, in parallel
 * (<link rel="modulepreload">, chosen by the address). Only file names of this build are written into the page.
 */
function preloadOpenedPage(): Plugin {
  const routes: [string, string][] = [['/chat', 'ChatPage'], ['/dashboard', 'DashboardPage'], ['/plan/', 'PlanPage'], ['/login', 'LoginPage'], ['/uputstvo', 'GuidePage']];
  return {
    name: 'ibl-preload-opened-page',
    apply: 'build',
    transformIndexHtml(html, ctx) {
      const bundle = ctx.bundle;
      if (!bundle) return html;
      const chunks = Object.values(bundle).filter((c) => c.type === 'chunk');
      const files = (page: string) => {
        const entry = chunks.find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith(`/pages/${page}.tsx`));
        if (!entry || entry.type !== 'chunk') return [];
        const out = new Set<string>([entry.fileName]);
        const walk = (name: string) => {
          const c = bundle[name];
          if (!c || c.type !== 'chunk') return;
          for (const d of c.imports) if (!out.has(d)) { out.add(d); walk(d); }
        };
        walk(entry.fileName);
        return [...out];
      };
      const map = Object.fromEntries(routes.map(([prefix, page]) => [prefix, files(page)]));
      const script = `<script>(function(){var m=${JSON.stringify(map)},p=location.pathname,k=Object.keys(m).find(function(x){return p===x||p.indexOf(x)===0});if(p==='/')k='/chat';(m[k]||[]).forEach(function(f){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href='/'+f;document.head.appendChild(l);});})();</script>`;
      return html.replace('</title>', '</title>\n    ' + script);
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadOpenedPage()],
  // S6 (E-15): libraries in their own files, cached by the browser across releases of the app's own code
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (id.includes('@supabase')) return 'supabase';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
