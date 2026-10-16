/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#05080a',
        panel: '#0a1210',
        'panel-light': '#0f1c19',
        line: 'rgba(148, 255, 205, 0.14)',
        'line-bright': 'rgba(148, 255, 205, 0.35)',
        em: '#39ffb0',
        'em-core': '#0fe6a0',
        'em-deep': '#0a4d3a',
        cyan: '#3ce0e8',
        mist: '#93a6a1',
        alert: '#ff6a3d',
        critical: '#ff3d57',
        warning: '#ffb338',
        info: '#38bdf8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Noto Sans Tamil"', '"Noto Sans Devanagari"', 'sans-serif'],
        sans: ['Inter', '"Noto Sans Tamil"', '"Noto Sans Devanagari"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Noto Sans Tamil"', '"Noto Sans Devanagari"', 'monospace'],
      },
      boxShadow: {
        'glow-em': '0 0 25px rgba(57, 255, 176, 0.25)',
        'glow-cyan': '0 0 25px rgba(60, 224, 232, 0.25)',
        'glow-alert': '0 0 25px rgba(255, 106, 61, 0.25)',
        'glow-critical': '0 0 25px rgba(255, 61, 87, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'drift': 'drift 5s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
