// satori 用 VNode を返す共有テンプレ。
// width / height で OG (1200x630) と Hero (1200x675) の両用。

const ACCENT = '#c9a64a';
const BG = '#0e0e10';
const FG = '#f5f5f5';
const MUTED = '#a8a8a8';

const CATEGORY_LABEL = {
  ai: 'AI',
  seo: 'SEO',
  llmo: 'LLMO',
};

export function ogTemplate({ title, category, width, height }) {
  const padding = 80;
  return {
    type: 'div',
    key: null,
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width,
        height,
        padding: `${padding}px`,
        background: BG,
        color: FG,
        fontFamily: 'Noto Sans JP, sans-serif',
        position: 'relative',
        boxSizing: 'border-box',
      },
      children: [
        {
          type: 'div',
          key: null,
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 8,
              background: ACCENT,
              display: 'flex',
            },
          },
        },
        {
          type: 'div',
          key: null,
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            },
            children: [
              {
                type: 'div',
                key: null,
                props: {
                  style: {
                    fontSize: 28,
                    fontWeight: 700,
                    color: ACCENT,
                    letterSpacing: 4,
                    display: 'flex',
                  },
                  children: 'imperial.sakas.work',
                },
              },
              {
                type: 'div',
                key: null,
                props: {
                  style: {
                    fontSize: 22,
                    fontWeight: 700,
                    color: BG,
                    background: ACCENT,
                    padding: '4px 16px',
                    borderRadius: 4,
                    display: 'flex',
                  },
                  children: CATEGORY_LABEL[category] ?? category,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          key: null,
          props: {
            style: {
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.3,
              color: FG,
              display: 'flex',
              flexWrap: 'wrap',
            },
            children: title,
          },
        },
        {
          type: 'div',
          key: null,
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 24,
              color: MUTED,
            },
            children: [
              {
                type: 'div',
                key: null,
                props: {
                  style: { display: 'flex' },
                  children: 'AI / SEO / LLMO Trend Media',
                },
              },
              {
                type: 'div',
                key: null,
                props: {
                  style: {
                    display: 'flex',
                    color: ACCENT,
                    fontWeight: 700,
                    letterSpacing: 2,
                  },
                  children: '— imperial',
                },
              },
            ],
          },
        },
      ],
    },
  };
}
