// astro build の前段で OG / Hero PNG を public/og/ public/hero/ に書き出す。
// satori + @resvg/resvg-js を pure Node.js で実行（CF Worker の native binding 制約を回避）。
// 背景に各記事の hero 画像 (public/article-images/<slug>-hero.png) を base64 dataURL で埋込。
// 該当 hero がない記事はデフォルト背景フォールバック画像を使用。

import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogTemplate } from './og-template.mjs';

const ROOT = process.cwd();
const articlesDir = path.resolve(ROOT, 'src/content/articles');
const fontPath = path.resolve(ROOT, 'public/fonts/NotoSansCJKjp-Bold.otf');
const articleImagesDir = path.resolve(ROOT, 'public/article-images');
const ogDir = path.resolve(ROOT, 'public/og');
const heroDir = path.resolve(ROOT, 'public/hero');

await mkdir(ogDir, { recursive: true });
await mkdir(heroDir, { recursive: true });

const fontData = await readFile(fontPath);

// デフォルト背景: 単色 1x1 PNG（記事専用 hero がない場合のフォールバック）。
// PNG signature + 8x8 dark navy minimal データ。
const FALLBACK_BG_DATAURL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFElEQVQI12P8/5+hngEJMOEUAQA0NgIBhBQwlgAAAABJRU5ErkJggg==';

function detectMime(buf) {
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // WebP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
  return 'image/png';
}

async function loadBgDataUrl(slug) {
  // 拡張子混在に対応（CF Workers AI が JSON 応答でも JPEG/PNG どちらを返すかは future-proofing）
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const f = path.join(articleImagesDir, `${slug}-hero.${ext}`);
    try {
      await access(f);
      const buf = await readFile(f);
      const mime = detectMime(buf);
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch {
      // try next
    }
  }
  return FALLBACK_BG_DATAURL;
}

async function renderPng({ title, category, width, height, bgDataUrl }) {
  const svg = await satori(
    ogTemplate({ title, category, width, height, bgDataUrl }),
    {
      width,
      height,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } })
    .render()
    .asPng();
  return png;
}

const entries = await readdir(articlesDir);
let count = 0;
let skipped = 0;
const startedAt = Date.now();

for (const entry of entries) {
  if (!entry.endsWith('.mdx') && !entry.endsWith('.md')) continue;
  const fullPath = path.join(articlesDir, entry);
  const raw = await readFile(fullPath, 'utf-8');
  const { data } = matter(raw);
  if (!data.slug || !data.title || !data.category) {
    console.warn(`[generate-og] skip ${entry}: missing slug/title/category`);
    skipped++;
    continue;
  }

  const bgDataUrl = await loadBgDataUrl(data.slug);

  const ogPng = await renderPng({
    title: data.title,
    category: data.category,
    width: 1200,
    height: 630,
    bgDataUrl,
  });
  await writeFile(path.join(ogDir, `${data.slug}.png`), ogPng);

  const heroPng = await renderPng({
    title: data.title,
    category: data.category,
    width: 1200,
    height: 675,
    bgDataUrl,
  });
  await writeFile(path.join(heroDir, `${data.slug}.png`), heroPng);

  console.log(`[generate-og] ✓ ${data.slug} (og + hero, bg=${bgDataUrl === FALLBACK_BG_DATAURL ? 'fallback' : 'article-hero'})`);
  count++;
}

const elapsedMs = Date.now() - startedAt;
console.log(
  `[generate-og] done: ${count} articles, ${skipped} skipped, ${elapsedMs}ms`,
);
