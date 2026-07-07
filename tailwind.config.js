/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui'],
        mono: ['Roboto Mono', 'ui-monospace', 'SFMono-Regular'],
      },
      colors: {
        primary: {
          DEFAULT: '#4f46e5', // indigo-600
          dark: '#312e81', // indigo-900
          light: '#c7d2fe', // indigo-200
        },
        secondary: {
          DEFAULT: '#fbbf24', // amber-400
        },
      },
      animation: {
        'bounce-short': 'bounce 0.5s infinite',
        'pop-in': 'pop-in 0.4s ease-out',
        shake: 'shake 0.4s ease-in-out',
        'score-pulse': 'score-pulse 0.4s ease-out',
        'flame-flicker': 'flame-flicker 1.2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'particle-rise': 'particle-rise 1.8s linear infinite',
        'gold-shimmer': 'gold-shimmer 2.5s ease-in-out infinite',
        'quest-pulse': 'quest-pulse 1s ease-in-out infinite',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        'score-pulse': {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'flame-flicker': {
          '0%, 100%': { transform: 'scale(1) translateY(0)' },
          '50%': { transform: 'scale(1.06) translateY(-0.5px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '0.9' },
        },
        'particle-rise': {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(-9px)', opacity: '0' },
        },
        'gold-shimmer': {
          '0%, 100%': { opacity: '0.75', filter: 'saturate(1)' },
          '50%': { opacity: '1', filter: 'saturate(1.4)' },
        },
        'quest-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.18)', opacity: '0.65' },
        },
      },
    },
  },
  plugins: [],
};
