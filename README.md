# imperial — AI / SEO / LLMO トレンドメディア

`imperial.sakas.work` で公開されている、AI動向・SEO・LLMO・Claude Code 等の技術トレンドを独自視点でまとめるメディアの Astro v6 プロジェクト。

- 公開URL: <https://imperial.sakas.work/>
- リポジトリ: `mimic-labo/imperial-sakas-site`
- ホスティング: Cloudflare Pages（プロジェクト名: `imperial-sakas-site`）

## 編集方針（必須）

- ファクト・信頼性・**ハルシネーションゼロ**・規約遵守
- 結論ファースト + 引用直下出典 + 引用ごとに独自分析
- X 投稿は oEmbed 埋込のみ・本文転載禁止
- 全外部リンクは `rel="nofollow noopener"`（`<ExtLink>` コンポーネント経由）
- 統計値には必ず出典隣接（`<CitationCaption>` または markdown link）
- frontmatter `citations` は zod で1件以上必須

## ローカル開発

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # 本番ビルド (dist/client + dist/server)
npm run preview      # 本番相当プレビュー
npm run validate     # prebuild 検証スクリプト単体実行
```

## ビルド構成

- `output: 'static'` で SSG メイン。`@astrojs/cloudflare` adapter 入りのため `mode: 'server'` 表示になるが、prerender で全ページが静的化される
- 出力先は `dist/client/`（HTMLとアセット） + `dist/server/`（Worker entrypoint、現状未使用）
- Cloudflare Pages の Build output directory は **`dist/client`** を指定
- prebuild で `validate-collection.mjs`（slug/title/description ユニーク）と `validate-stats.mjs`（統計値出典隣接）が走る

## ディレクトリ

```text
src/
├── content.config.ts            # zod schema (citations 必須・basisCategories ≥2 ・slug regex)
├── content/articles/            # 記事 .md / .mdx
├── components/
│   ├── article/                 # Conclusion / TableOfContents / XEmbed / CitationCaption /
│   │                            # OriginalAnalysis / FactBadge / ExtLink / CitationList /
│   │                            # ComparisonTable / FAQ
│   ├── seo/                     # JsonLd
│   └── layout/                  # （未配置、必要に応じて追加）
├── layouts/BaseLayout.astro
├── pages/
│   ├── index.astro              # トップ（最新記事一覧）
│   ├── articles/[...slug].astro # 動的ルーティング
│   └── llms.txt.ts              # AI クローラ向けサイト概要（自動生成）
└── styles/                      # 必要に応じて
```

## デプロイ

`/deploy-imperial-sakas` スキル（`skills/deploy-imperial-sakas/`）または手動で:

```sh
git add -A
git commit -m "site: <変更要約>"
git push origin main
# → Cloudflare Pages が GitHub から自動取り込みしてビルド & デプロイ
```

## カテゴリ enum

`src/content.config.ts` の `category` は `'ai' | 'seo' | 'llmo'` の3区分でスタート（M1）。Claude Code 等は ai に内包。M2 以降で必要に応じて拡張。

## ロードマップ

- **M1**（達成済）: 空サイト公開・全エンドポイント疎通確認
- **M2**: サブエージェント階層（`agents/imperial-sakas-commander/` ほか8体）の運用本体充実 + 記事制作パイプライン稼働
- **M3**: AIOv 計測導入 + article-updater + web-fetch-summary 本実装
