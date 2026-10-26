import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

// 将打包产物（JS/CSS）内联进 index.html，并转为可直接双击打开的经典脚本（非 module），
// 从而在 file:// 离线环境下也能完整运行交互逻辑。
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inlineSingleFile(): Plugin {
  return {
    name: 'inline-single-file',
    enforce: 'post',
    apply: 'build',
    generateBundle(_options, bundle) {
      const htmlKey = Object.keys(bundle).find((key) => key.endsWith('.html'));
      if (!htmlKey) return;

      const htmlAsset = bundle[htmlKey] as { source: string | Uint8Array };
      let html = String(htmlAsset.source);

      let appCode = '';
      let cssCode = '';

      for (const [key, item] of Object.entries(bundle)) {
        if (key === htmlKey) continue;
        if (item.type === 'chunk') {
          appCode += item.code;
          const re = new RegExp(
            '<script[^>]*src="[^"]*' + escapeRegExp(item.fileName) + '"[^>]*></script>',
            'g'
          );
          html = html.replace(re, '');
          delete bundle[key];
        } else if (key.endsWith('.css')) {
          cssCode += String(item.source);
          const re = new RegExp(
            '<link[^>]*href="[^"]*' + escapeRegExp(item.fileName) + '"[^>]*>',
            'g'
          );
          html = html.replace(re, '');
          delete bundle[key];
        }
      }

      // 内联样式（可留在 head）
      if (cssCode) {
        html = html.replace('</head>', () => `<style>${cssCode}</style>\n</head>`);
      }

      // 应用脚本改为经典脚本并移到 </body> 之前，
      // 保证在 #root 与整段 DOM 就绪后执行（file:// 离线也能正常挂载）。
      // 必须使用函数式替换：代码中可能包含 $& 等替换模式，字符串式替换会被错误展开。
      const scriptTags = `<script src="data/historyData.js"></script>\n<script>${appCode}</script>\n`;
      html = html.replace('</body>', () => `${scriptTags}</body>`);

      htmlAsset.source = html;
    },
    // 构建完成后，把单文件产物同步到项目根目录 index.html（双击即可查看）
    writeBundle() {
      const built = path.resolve(__dirname, 'dist/index.entry.html');
      const deliverable = path.resolve(__dirname, 'index.html');
      if (fs.existsSync(built)) {
        fs.copyFileSync(built, deliverable);
        // GitHub Pages 直接发布 dist 目录，需要标准入口名 index.html
        fs.copyFileSync(built, path.resolve(__dirname, 'dist/index.html'));
      }
      // 数据文件由页面运行时按相对路径加载，必须一并复制进 dist
      const dataDir = path.resolve(__dirname, 'data');
      const distDataDir = path.resolve(__dirname, 'dist/data');
      if (fs.existsSync(dataDir)) {
        fs.mkdirSync(distDataDir, { recursive: true });
        for (const name of fs.readdirSync(dataDir)) {
          const from = path.join(dataDir, name);
          if (fs.statSync(from).isFile()) fs.copyFileSync(from, path.join(distDataDir, name));
        }
      }
      // 真题练习子页面（独立静态应用）整体复制进 dist
      const practiceDir = path.resolve(__dirname, 'practice');
      if (fs.existsSync(practiceDir)) {
        fs.cpSync(practiceDir, path.resolve(__dirname, 'dist/practice'), { recursive: true });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), inlineSingleFile()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      cssCodeSplit: false,
      modulePreload: false,
      assetsInlineLimit: 100000000,
      target: 'es2018',
      rollupOptions: {
        input: path.resolve(__dirname, 'index.entry.html'),
        output: {
          format: 'iife' as const,
          inlineDynamicImports: true,
          entryFileNames: 'assets/app.js',
          assetFileNames: 'assets/[name][extname]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
