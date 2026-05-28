import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        scada: {
          bg: '#0a0a0c',
          surface: '#111113',
          panel: '#18181b',
          border: '#27272a',
          text: '#e4e4e7',
          muted: '#71717a',
          green: '#22c55e',
          red: '#ef4444',
          amber: '#f59e0b',
        }
      }
    }
  },
  plugins: [],
}

export default config
