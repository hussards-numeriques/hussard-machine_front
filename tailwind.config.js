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
        'combo-grow': 'combo-grow 0.4s ease-out',
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
        'combo-grow': {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
