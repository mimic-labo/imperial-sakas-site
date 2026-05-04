#!/usr/bin/env node
// 単発実行: ターミナル風 chrome + Shiki ハイライトのコードカード PNG を生成。
//
// 使い方:
//   node scripts/code-card.mjs \
//     --slug claude-code-introduction-vscode-2026 \
//     --num 01 \
//     --lang bash \
//     --title "セットアップコマンド" \
//     --code "$(cat tmp/code.txt)"
//
// 出力先: public/code-cards/<slug>-<num>.png

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { codeToTokens } from 'shiki';

const ROOT = process.cwd();
const fontPath = path.resolve(ROOT, 'public/fonts/NotoSansCJKjp-Bold.otf');
const outDir = path.resolve(ROOT, 'public/code-cards');

const { values } = parseArgs({
  options: {
    slug: { type: 'string' },
    num: { type: 'string', default: '01' },
    lang: { type: 'string', default: 'bash' },
    title: { type: 'string', default: '' },
    code: { type: 'string' },
    codeFile: { type: 'string' },
    width: { type: 'string', default: '1200' },
    theme: { type: 'string', default: 'github-dark' },
  },
});

if (!values.slug) {
  console.error('--slug is required');
  process.exit(1);
}

let codeText = values.code;
if (!codeText && values.codeFile) {
  codeText = await readFile(path.resolve(ROOT, values.codeFile), 'utf-8');
}
if (!codeText) {
  console.error('--code or --codeFile is required');
  process.exit(1);
}

const width = Number(values.width);
const fontData = await readFile(fontPath);

const { tokens } = await codeToTokens(codeText, {
  lang: values.lang,
  theme: values.theme,
});

const FONT_SIZE = 22;
const LINE_HEIGHT = 1.55;
const PADDING = 56;
const CHROME_HEIGHT = 44;
const TITLE_HEIGHT = values.title ? 36 : 0;
const codeBlockHeight =
  Math.max(tokens.length, 3) * FONT_SIZE * LINE_HEIGHT + PADDING;
const totalHeight =
  CHROME_HEIGHT + TITLE_HEIGHT + codeBlockHeight + PADDING;

const BG = '#0d1117';
const CHROME_BG = '#161b22';
const FG_DEFAULT = '#e6edf3';

const dot = (color) => ({
  type: 'div',
  key: null,
  props: {
    style: {
      width: 14,
      height: 14,
      borderRadius: 7,
      background: color,
      display: 'flex',
    },
  },
});

const linesNode = tokens.map((line, i) => ({
  type: 'div',
  key: null,
  props: {
    style: {
      display: 'flex',
      gap: 16,
    },
    children: [
      {
        type: 'div',
        key: null,
        props: {
          style: {
            width: 36,
            color: '#6e7681',
            textAlign: 'right',
            display: 'flex',
            justifyContent: 'flex-end',
          },
          children: String(i + 1),
        },
      },
      {
        type: 'div',
        key: null,
        props: {
          style: {
            display: 'flex',
            flexWrap: 'nowrap',
            color: FG_DEFAULT,
            whiteSpace: 'pre',
          },
          children:
            line.length === 0
              ? ' '
              : line.map((tok) => ({
                  type: 'span',
                  key: null,
                  props: {
                    style: {
                      color: tok.color ?? FG_DEFAULT,
                      whiteSpace: 'pre',
                    },
                    children: tok.content,
                  },
                })),
        },
      },
    ],
  },
}));

const titleNode = values.title
  ? {
      type: 'div',
      key: null,
      props: {
        style: {
          padding: '8px 24px',
          color: '#8b949e',
          fontSize: 16,
          background: '#0d1117',
          display: 'flex',
        },
        children: values.title,
      },
    }
  : null;

const root = {
  type: 'div',
  key: null,
  props: {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width,
      height: totalHeight,
      background: BG,
      fontFamily: 'Noto Sans JP, monospace',
      borderRadius: 12,
    },
    children: [
      {
        type: 'div',
        key: null,
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: CHROME_BG,
            height: CHROME_HEIGHT,
            padding: '0 16px',
          },
          children: [dot('#ff5f56'), dot('#ffbd2e'), dot('#27c93f')],
        },
      },
      ...(titleNode ? [titleNode] : []),
      {
        type: 'div',
        key: null,
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            padding: `${PADDING / 2}px ${PADDING}px`,
            fontSize: FONT_SIZE,
            lineHeight: LINE_HEIGHT,
            fontFamily: 'Noto Sans JP, monospace',
          },
          children: linesNode,
        },
      },
    ],
  },
};

const svg = await satori(root, {
  width,
  height: totalHeight,
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

await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, `${values.slug}-${values.num}.png`);
await writeFile(outPath, png);
console.log(`[code-card] wrote ${outPath} (${png.length} bytes, ${tokens.length} lines)`);
