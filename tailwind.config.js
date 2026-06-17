/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:       '#080B14',
        card:             '#0D1120',
        cardHover:        '#0F1528',
        darkBorder:       '#1E2840',
        darkBorderHover:  '#2A3A6A',
        accent:           '#4F8EF7',
        accentPurple:     '#7B5FF7',
        accentHover:      '#3A7AE8',
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      animation: {
        'pulse-slow':  'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in':    'scaleIn 0.2s ease-out',
        'fade-in':     'fadeIn 0.3s ease-out',
        'float':       'float 6s ease-in-out infinite',
      },
      keyframes: {
        scaleIn: {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #4F8EF7, #7B5FF7)',
      },
    },
  },
  plugins: [],
}
