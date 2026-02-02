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
      },
    },
  },
  plugins: [],
};
