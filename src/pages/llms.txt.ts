import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const articles = await getCollection('articles');
  const sorted = articles.sort(
    (a, b) => b.data.updatedDate.valueOf() - a.data.updatedDate.valueOf()
  );

  const byCategory: Record<string, typeof sorted> = {};
  for (const a of sorted) {
    const cat = a.data.category;
    (byCategory[cat] ??= []).push(a);
  }

  const categoryLabel: Record<string, string> = {
    ai: 'AI',
    seo: 'SEO',
    llmo: 'LLMO',
  };

  const sections = Object.entries(byCategory)
    .map(([cat, arts]) => {
      const lines = arts
        .map(
          (a) =>
            `- [${a.data.title}](https://imperial.sakas.work/articles/${a.data.slug}/): ${a.data.description}`
        )
        .join('\n');
      return `## ${categoryLabel[cat] ?? cat}\n\n${lines}`;
    })
    .join('\n\n');

  const body = `# imperial

> AI動向 / SEO / LLMO / Claude Code に関する情報まとめと独自分析を発信する技術メディア。
> 全記事は出典明記・独自分析セクション付き。X 投稿は oEmbed 埋込のみ使用、本文転載なし。

${sections}

## About

- [About](https://imperial.sakas.work/about/): メディアの編集方針と運営者情報
- [Privacy](https://imperial.sakas.work/privacy/): プライバシーポリシー
- [Disclosure](https://imperial.sakas.work/disclosure/): 広告掲載・affiliate ポリシー
- [Contact](https://imperial.sakas.work/contact/): お問い合わせ
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
