// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import rehypeMermaid from 'rehype-mermaid';
import rehypeShiki from '@shikijs/rehype';

// https://astro.build/config
export default defineConfig({
  site: 'https://imperial.sakas.work',
  output: 'static',
  // 標準 syntaxHighlight (Shiki) は rehype プラグインの前に走るため、
  // rehype-mermaid が <code class="language-mermaid"> を pick できない問題があった。
  // markdown 全体で false にして、rehype 段階で順序制御する。
  markdown: {
    syntaxHighlight: false,
  },
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [
    sitemap(),
    mdx({
      // 順序重要: rehype-mermaid を先に走らせて mermaid block を SVG 化、
      // 残ったコードブロックを @shikijs/rehype で highlight。
      rehypePlugins: [
        [rehypeMermaid, { strategy: 'inline-svg' }],
        [rehypeShiki, { theme: 'github-dark' }],
      ],
    }),
  ],
  build: { format: 'directory' },
});
