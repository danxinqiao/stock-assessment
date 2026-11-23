/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hit: '#16a34a',
        miss: '#dc2626',
        none: '#e5e7eb',
      },
      fontFamily: {
        sans: [
          'Geist',
          'PingFang SC',
          'Hiragino Sans GB',
          'Noto Sans CJK SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
