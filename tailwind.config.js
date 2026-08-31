/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dnd: {
          parchment: '#f5e6ca',
          leather: '#8B4513',
          gold: '#DAA520',
          blood: '#8B0000',
          dark: '#1a1a2e',
          deep: '#16213e',
          text: '#f0e6d3',
          scroll: '#e8d5b5',
          ink: '#2c1810',
          muted: '#8a7f76',
        },
      },
      fontFamily: {
        fantasy: ['Cinzel', 'serif'],
        handwriting: ['Caveat', 'cursive'],
        body: ['system-ui', 'sans-serif'],
      },
      boxShadow: {
        'dnd-glow': '0 0 10px #DAA520',
        'dnd-card': '0 4px 16px rgba(0, 0, 0, 0.45)',
      },
      borderRadius: {
        'dnd-lg': '14px',
      },
      keyframes: {
        'initiative-flash': {
          '0%': { borderColor: '#DAA520', boxShadow: '0 0 10px #DAA520' },
          '100%': { borderColor: 'transparent', boxShadow: 'none' },
        },
        'dice-roll': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.15)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'initiative-flash': 'initiative-flash 1.2s ease-in-out infinite',
        'dice-roll': 'dice-roll 0.6s ease-in-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}