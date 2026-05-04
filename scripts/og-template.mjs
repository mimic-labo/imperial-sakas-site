// satori 用 VNode を返す共有テンプレ。
// width / height で OG (1200x630) と Hero (1200x675) の両用。
// 背景に抽象画像（base64 dataURL で渡す）を敷き、暗い overlay で文字可読性を確保。

const ACCENT = '#c9a64a';
const FG = '#f5f5f5';
const MUTED = '#cfcfcf';
const SITE_NAME = 'Imperial Sakas 情報メディア';
const DOMAIN = 'imperial.sakas.work';

const CATEGORY_LABEL = {
  ai: 'AI',
  seo: 'SEO',
  llmo: 'LLMO',
};

/**
 * @param {object} input
 * @param {string} input.title
 * @param {'ai'|'seo'|'llmo'} input.category
 * @param {number} input.width
 * @param {number} input.height
 * @param {string} input.bgDataUrl - 背景に敷く抽象画像の data URL（base64 PNG）
 */
export function ogTemplate({ title, category, width, height, bgDataUrl }) {
  const padding = 72;
  return {
    type: 'div',
    key: null,
    props: {
      style: {
        display: 'flex',
        width,
        height,
        position: 'relative',
        fontFamily: 'Noto Sans JP, sans-serif',
        boxSizing: 'border-box',
        background: '#0a0e16',
        backgroundImage: `url(${bgDataUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
      children: [
        // 暗い overlay（タイトル可読性確保、ただし背景画像を残す程度の弱さ）
        {
          type: 'div',
          key: null,
          props: {
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                'linear-gradient(135deg, rgba(10,14,22,0.55) 0%, rgba(10,14,22,0.20) 50%, rgba(10,14,22,0.65) 100%)',
              display: 'flex',
            },
          },
        },
        // 上部 accent bar（ブランドシグネチャ）
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
        // メインコンテナ（タイトル中央 + 左下サイト名 + 右下バッジ）
        {
          type: 'div',
          key: null,
          props: {
            style: {
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width,
              height,
              padding: `${padding + 20}px ${padding}px ${padding}px`,
              boxSizing: 'border-box',
            },
            children: [
              // タイトル（中央寄せ、最大要素）
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
                    textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                  },
                  children: title,
                },
              },
            ],
          },
        },
        // 左下: サイト名
        {
          type: 'div',
          key: null,
          props: {
            style: {
              position: 'absolute',
              left: padding,
              bottom: padding - 24,
              display: 'flex',
              fontSize: 22,
              fontWeight: 700,
              color: MUTED,
              letterSpacing: 1,
              textShadow: '0 1px 6px rgba(0,0,0,0.7)',
            },
            children: SITE_NAME,
          },
        },
        // 右下: [カテゴリ] - imperial.sakas.work
        {
          type: 'div',
          key: null,
          props: {
            style: {
              position: 'absolute',
              right: padding,
              bottom: padding - 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            },
            children: [
              {
                type: 'div',
                key: null,
                props: {
                  style: {
                    display: 'flex',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#0a0e16',
                    background: ACCENT,
                    padding: '4px 14px',
                    borderRadius: 4,
                  },
                  children: CATEGORY_LABEL[category] ?? category,
                },
              },
              {
                type: 'div',
                key: null,
                props: {
                  style: {
                    display: 'flex',
                    fontSize: 22,
                    fontWeight: 700,
                    color: ACCENT,
                    letterSpacing: 1,
                    textShadow: '0 1px 6px rgba(0,0,0,0.7)',
                  },
                  children: DOMAIN,
                },
              },
            ],
          },
        },
      ],
    },
  };
}
