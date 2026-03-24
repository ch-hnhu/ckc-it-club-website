import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2e3820',
          light: '#4a5630',
          dark: '#1f2817',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
