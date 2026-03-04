import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nomlet: {
          pink: '#F7CBCA',
          offwhite: '#F1F7F7',
          teal: '#D5E5E5',
          aqua: '#A0C7C6',
          sage: '#5D6B6B',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(93, 107, 107, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;
