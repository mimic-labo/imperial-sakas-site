#!/usr/bin/env node
// 記事コレクションの slug / title / description ユニーク制約検証
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';

const ARTICLES_DIR = new URL('../src/content/articles/', import.meta.url);

async function listArticles(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir.pathname ?? dir, e.name);
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
const seen = { slug: new Map(), title: new Map(), description: new Map() };
const errors = [];

for (const url of files) {
  const raw = await readFile(url, 'utf8');
  const { data } = matter(raw);
  for (const key of ['slug', 'title', 'description']) {
    const value = data[key];
    if (!value) {
      errors.push(`${url.pathname}: missing frontmatter "${key}"`);
      continue;
    }
    if (seen[key].has(value)) {
      errors.push(
        `${url.pathname}: duplicate ${key} "${value}" (also in ${seen[key].get(value)})`
      );
    } else {
      seen[key].set(value, url.pathname);
    }
  }
}

if (errors.length > 0) {
  console.error('[validate-collection] ❌ FAIL');
  for (const e of errors) console.error('  -', e);
  process.exit(1);
}
console.log(`[validate-collection] ✅ ${files.length} articles, all unique.`);
