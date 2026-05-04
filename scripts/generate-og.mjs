// astro build の前段で OG / Hero PNG を public/og/ public/hero/ に書き出す。
// satori + @resvg/resvg-js を pure Node.js で実行（CF Worker の native binding 制約を回避）。

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import matter from 'gray-matter';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { ogTemplate } from './og-template.mjs';

const ROOT = process.cwd();
const articlesDir = path.resolve(ROOT, 'src/content/articles');
const fontPath = path.resolve(ROOT, 'public/fonts/NotoSansCJKjp-Bold.otf');
const ogDir = path.resolve(ROOT, 'public/og');
const heroDir = path.resolve(ROOT, 'public/hero');

await mkdir(ogDir, { recursive: true });
await mkdir(heroDir, { recursive: true });

const fontData = await readFile(fontPath);

async function renderPng({ title, category, width, height }) {
  const svg = await satori(ogTemplate({ title, category, width, height }), {
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
  });
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

  const ogPng = await renderPng({
    title: data.title,
    category: data.category,
    width: 1200,
    height: 630,
  });
  await writeFile(path.join(ogDir, `${data.slug}.png`), ogPng);

  const heroPng = await renderPng({
    title: data.title,
    category: data.category,
    width: 1200,
    height: 675,
  });
  await writeFile(path.join(heroDir, `${data.slug}.png`), heroPng);

  console.log(`[generate-og] ✓ ${data.slug} (og + hero)`);
  count++;
}

const elapsedMs = Date.now() - startedAt;
console.log(
  `[generate-og] done: ${count} articles, ${skipped} skipped, ${elapsedMs}ms`,
);
