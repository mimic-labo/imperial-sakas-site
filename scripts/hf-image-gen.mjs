#!/usr/bin/env node
// HuggingFace Inference API で FLUX.1 schnell 画像生成（CF Workers AI 10K Neurons/日 超過時の予備）。
// FLUX.1 schnell は Apache-2.0、商用 OK。
//
// 環境変数:
//   HF_TOKEN  HuggingFace Read 権限のアクセストークン
//
// 使い方:
//   node scripts/hf-image-gen.mjs \
//     --slug claude-code-introduction-vscode-2026 \
//     --num 02 \
//     --prompt "abstract minimalist art ..."
//
// 出力先: public/article-images/<slug>-<num>.png

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { InferenceClient } from '@huggingface/inference';

const ROOT = process.cwd();
const outDir = path.resolve(ROOT, 'public/article-images');

const TOKEN = process.env.HF_TOKEN;
if (!TOKEN) {
  console.error('[hf-image-gen] HF_TOKEN が未設定です。');
  console.error('  Claude/credentials/.env に HF_TOKEN を追加してから source してください。');
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    slug: { type: 'string' },
    num: { type: 'string', default: '01' },
    prompt: { type: 'string' },
    model: {
      type: 'string',
      default: 'black-forest-labs/FLUX.1-schnell',
    },
    steps: { type: 'string', default: '4' },
  },
});

if (!values.slug || !values.prompt) {
  console.error('--slug と --prompt は必須');
  process.exit(1);
}

const client = new InferenceClient(TOKEN);

const blob = await client.textToImage({
  model: values.model,
  inputs: values.prompt,
  parameters: {
    num_inference_steps: Number(values.steps),
  },
});

const ab = await blob.arrayBuffer();
const buf = Buffer.from(ab);

await mkdir(outDir, { recursive: true });
const ext = blob.type?.includes('jpeg') || blob.type?.includes('jpg') ? 'jpg' : 'png';
const outPath = path.join(outDir, `${values.slug}-${values.num}.${ext}`);
await writeFile(outPath, buf);
console.log(
  `[hf-image-gen] wrote ${outPath} (${buf.length} bytes, model=${values.model}, mime=${blob.type})`,
);
