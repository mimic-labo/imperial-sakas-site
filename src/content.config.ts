import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const citationSchema = z.object({
  url: z.string().url(),
  author: z.string().min(1),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  type: z.enum(['x_post', 'web_article', 'official_doc', 'press_release', 'academic']),
  primaryScore: z.number().min(0).max(1).optional(),
  archivedSnapshot: z.string().url().optional(),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(8).max(80),
    description: z.string().min(60).max(160),
    slug: z.string().regex(/^[a-z0-9-]{12,40}$/),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
    tags: z.array(z.string()).min(1).max(8),
    category: z.enum(['ai', 'seo', 'llmo']),
    factStatus: z.enum(['verified', 'partial', 'pending']).default('pending'),
    citations: z.array(citationSchema).min(1),
    factCheckRunId: z.string().optional(),
    ogImage: z.string().optional(),
    articleType: z.enum(['analysis', 'roundup', 'tutorial', 'news']),
    basisCategories: z.array(z.enum([
      'evidence',
      'review',
      'expertise',
      'industry',
      'method',
      'scale',
      'award',
      'cost',
      'safety',
      'clinical',
      'price',
      'feature',
      'specialist',
    ])).min(2),
  }),
});

export const collections = { articles };
