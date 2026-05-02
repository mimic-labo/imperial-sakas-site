#!/usr/bin/env node
// 統計値の出典隣接チェック（緩い実装、警告のみで exit 0）
// 数値+%/人/件/社/台/円 等を検出し、同一段落内にリンクまたは Citation 系コンポーネントがあるか確認
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ARTICLES_DIR = new URL('../src/content/articles/', import.meta.url);
const NUM_PATTERN = /\d+(?:[\.,]\d+)?\s?(?:%|人|件|社|台|円|億|万|倍|時間|分|秒|位|歳|年)/;

async function listArticles(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const url = new URL(`./${e.name}${e.isDirectory() ? '/' : ''}`, dir);
    if (e.isDirectory()) {
      out.push(...(await listArticles(url)));
    } else if (/\.(md|mdx)$/.test(e.name)) {
      out.push(url);
    }
  }
  return out;
}

const files = await listArticles(ARTICLES_DIR);
let warnings = 0;

for (const url of files) {
  const raw = await readFile(url, 'utf8');
  const body = raw.replace(/^---[\s\S]*?---\n?/, '');
  const paragraphs = body.split(/\n\s*\n/);
  for (const p of paragraphs) {
    if (NUM_PATTERN.test(p)) {
      const hasCitation = /<CitationCaption|\[.*?\]\(https?:\/\//.test(p);
      if (!hasCitation) {
        warnings++;
        console.warn(`[validate-stats] ⚠️  ${url.pathname}: 数値あり段落に出典隣接が見つかりません`);
        console.warn(`    > ${p.slice(0, 80).replace(/\n/g, ' ')}...`);
      }
    }
  }
}

if (warnings === 0) {
  console.log(`[validate-stats] ✅ ${files.length} articles, no missing citations near stats.`);
} else {
  console.log(`[validate-stats] ⚠️  ${warnings} 件の警告（exit 0 で続行、要改善）`);
}
