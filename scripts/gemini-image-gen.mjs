#!/usr/bin/env node
//
// ⚠️ 退避コード（2026-05-04 時点で Free tier 利用不可、復活は Pro key 切替時）
//
// 実測結果（2026-05-04）:
//   - gemini-2.5-flash-image / -preview: Free tier `quota: limit 0`（公式エラー確認）
//   - imagen-4.0-generate-001 系: "only available on paid plans"
//   → 現在の Free tier の API key (...Fqw4) では一切利用不可
//
// 復活手順:
//   1. Google Cloud Console (console.cloud.google.com/billing) で
//      Google AI Pro $10 credits 紐付き Cloud project を確認
//   2. Google AI Studio (aistudio.google.com/apikey) で同 project を選んで
//      新規 API key を発行
//   3. Claude/credentials/.env の GEMINI_API_KEY_IMPERIAL_SAKAS を新 key で上書き
//   4. （任意）~/.claude/settings.json に nanobanana-mcp-server を追加:
//      {
//        "mcpServers": {
//          "nanobanana": {
//            "command": "uvx",
//            "args": ["nanobanana-mcp-server@latest"],
//            "env": { "GEMINI_API_KEY_IMPERIAL_SAKAS": "${GEMINI_API_KEY_IMPERIAL_SAKAS}" }
//          }
//        }
//      }
//      → Claude Code 再起動で有効化
//
// 採用上の代替（Phase A.1 確定）:
//   - 抽象画像 → CF Workers AI FLUX.1 schnell (scripts/cf-image-gen.mjs)
//   - 日本語ラベル付き図版 → Mermaid (rehype-mermaid 統合済)
//   - コードカード → Shiki + Satori (scripts/code-card.mjs)
//
// ----------------------------------------------------------------------
// Google Gemini API (Nano Banana = gemini-2.5-flash-image) で
// 日本語テキスト入り図版を生成。Free tier 不可・Pro key 必要。
// （Imagen 3/4 は Paid プラン限定のため不採用）
//
// 環境変数:
//   GEMINI_API_KEY_IMPERIAL_SAKAS  Google AI Studio で発行した API key
//
// 使い方:
//   node scripts/gemini-image-gen.mjs \
//     --slug claude-code-introduction-vscode-2026 \
//     --num 02 \
//     --prompt "Claude Code と VS Code の連携アーキテクチャ図。日本語ラベル含む。indigo と gold のシンプルな配色"
//
// 出力先: public/article-images/<slug>-<num>.png

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { GoogleGenAI } from '@google/genai';

const ROOT = process.cwd();
const outDir = path.resolve(ROOT, 'public/article-images');

const KEY = process.env.GEMINI_API_KEY_IMPERIAL_SAKAS;
if (!KEY) {
  console.error('[gemini-image-gen] GEMINI_API_KEY_IMPERIAL_SAKAS が未設定です。');
  console.error('  Claude/credentials/.env に GEMINI_API_KEY_IMPERIAL_SAKAS を追加してから source してください。');
  process.exit(1);
}

const { values } = parseArgs({
  options: {
    slug: { type: 'string' },
    num: { type: 'string', default: '01' },
    prompt: { type: 'string' },
    // Nano Banana 系の GA 版（2026-05 時点で Free tier 可）。
    // モデル一覧確認: scripts/__diag-gemini-models.mjs（必要に応じて再生成）。
    // 最新候補: nano-banana-pro-preview / gemini-3.1-flash-image-preview / gemini-3-pro-image-preview。
    // 上位互換 Paid: imagen-4.0-generate-001 / imagen-4.0-ultra-generate-001 等。
    model: { type: 'string', default: 'gemini-2.5-flash-image' },
  },
});

if (!values.slug || !values.prompt) {
  console.error('--slug と --prompt は必須');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: KEY });

const response = await ai.models.generateContent({
  model: values.model,
  contents: [{ parts: [{ text: values.prompt }] }],
  config: {
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const parts = response?.candidates?.[0]?.content?.parts ?? [];
const imagePart = parts.find((p) => p?.inlineData?.data);

if (!imagePart) {
  console.error(
    '[gemini-image-gen] 画像データが取得できませんでした。response 抜粋:',
    JSON.stringify(parts, null, 2).slice(0, 600),
  );
  process.exit(1);
}

const b64 = imagePart.inlineData.data;
const mimeType = imagePart.inlineData.mimeType ?? 'image/png';
const buf = Buffer.from(b64, 'base64');

await mkdir(outDir, { recursive: true });
const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
const outPath = path.join(outDir, `${values.slug}-${values.num}.${ext}`);
await writeFile(outPath, buf);
console.log(
  `[gemini-image-gen] wrote ${outPath} (${buf.length} bytes, model=${values.model}, mime=${mimeType})`,
);
