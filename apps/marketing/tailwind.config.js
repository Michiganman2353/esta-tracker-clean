/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          700: '#1e2f4d',
          800: '#162135',
          900: '#0f172a',
          950: '#0a0f1a',
        },
        gold: {
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#d4af37',
          500: '#b8941f',
          700: '#8a6914',
          800: '#5c4a10',
          900: '#3d310a',
          anchored: 'rgba(212, 175, 55, 0.3)',
        },
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
