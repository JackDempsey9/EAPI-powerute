import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0f1a',
          900: '#111827',
          800: '#1e2533',
          700: '#2d3748',
        }
      }
    }
  },
  plugins: [],
}

export default config
