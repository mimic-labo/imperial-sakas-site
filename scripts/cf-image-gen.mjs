#!/usr/bin/env node
// Cloudflare Workers AI で画像を生成（多モデル対応）。
//
// 環境変数:
//   CLOUDFLARE_API_TOKEN  Workers AI Read 権限のトークン
//   CLOUDFLARE_ACCOUNT_ID 対象アカウント ID
//
// 使い方:
//   node scripts/cf-image-gen.mjs \
//     --slug claude-code-introduction-vscode-2026 \
//     --num 01 \
//     --model @cf/black-forest-labs/flux-1-schnell \
//     --prompt "abstract minimalist art ..."
//
// 対応モデル例:
//   @cf/black-forest-labs/flux-1-schnell  抽象画像、JSON+base64 で返却、~1,000 neurons
//   @cf/black-forest-labs/flux-2-dev      高品質、JSON+base64、~4,200+ neurons
//   @cf/leonardo/lucid-origin             text rendering 強、JSON+base64、~2,544 neurons
//   @cf/leonardo/phoenix-1.0              coherent text、image/jpg バイナリ stream、~2,120 neurons
//
// 出力先: public/article-images/<slug>-<num>.<ext>（jpg or png）

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';

const ROOT = process.cwd();
const outDir = path.resolve(ROOT, 'public/article-images');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!TOKEN || !ACCOUNT) {
  console.error(
    '[cf-image-gen] CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID が未設定です。',
  );
  console.error('  Claude/credentials/.env から source するか、環境変数で渡してください。');
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    slug: { type: 'string' },
    num: { type: 'string', default: '01' },
    prompt: { type: 'string' },
    model: {
      type: 'string',
      default: '@cf/black-forest-labs/flux-1-schnell',
    },
    // モデルにより推奨値が違う:
    //   FLUX.1 schnell: 4 steps, FLUX.2 dev: 28, Lucid Origin: 25, Phoenix 1.0: 25
    steps: { type: 'string', default: '4' },
    width: { type: 'string', default: '1024' },
    height: { type: 'string', default: '1024' },
    negativePrompt: { type: 'string' },
  },
});

if (!values.slug || !values.prompt) {
  console.error('--slug と --prompt は必須');
  process.exit(1);
}

const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run/${values.model}`;

const body = {
  prompt: values.prompt,
  num_steps: Number(values.steps),
  steps: Number(values.steps), // FLUX 系は steps 名で受ける、Leonardo 系は num_steps で受ける
  width: Number(values.width),
  height: Number(values.height),
};
if (values.negativePrompt) body.negative_prompt = values.negativePrompt;

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`[cf-image-gen] HTTP ${res.status}: ${text.slice(0, 800)}`);
  process.exit(1);
}

const contentType = res.headers.get('content-type') ?? '';
let imgBuf;
let ext = 'png';

if (contentType.includes('application/json')) {
  // FLUX 系 / Lucid Origin: { result: { image: <base64> } }
  const json = await res.json();
  const b64 = json?.result?.image;
  if (!b64) {
    console.error(
      '[cf-image-gen] JSON 応答に画像データなし:',
      JSON.stringify(json).slice(0, 600),
    );
    process.exit(1);
  }
  imgBuf = Buffer.from(b64, 'base64');
  // magic byte で実体形式を判定（FLUX.1 schnell は実は JPEG を返す等、モデル依存で混在）
  if (imgBuf[0] === 0xff && imgBuf[1] === 0xd8 && imgBuf[2] === 0xff) {
    ext = 'jpg';
  } else if (imgBuf[0] === 0x89 && imgBuf[1] === 0x50 && imgBuf[2] === 0x4e && imgBuf[3] === 0x47) {
    ext = 'png';
  } else {
    ext = 'png'; // fallback
  }
} else if (contentType.startsWith('image/')) {
  // Phoenix 1.0: image/jpg のバイナリ stream
  const ab = await res.arrayBuffer();
  imgBuf = Buffer.from(ab);
  ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
} else {
  console.error(`[cf-image-gen] 想定外の Content-Type: ${contentType}`);
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, `${values.slug}-${values.num}.${ext}`);
await writeFile(outPath, imgBuf);
console.log(
  `[cf-image-gen] wrote ${outPath} (${imgBuf.length} bytes, model=${values.model}, content-type=${contentType})`,
);
