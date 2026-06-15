/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--primary-50, #e0f7f6)',
          100: 'var(--primary-100, #b3ebe8)',
          200: 'var(--primary-200, #80ded9)',
          300: 'var(--primary-300, #4dd1ca)',
          400: 'var(--primary-400, #26c7bf)',
          500: 'var(--primary-500, #20b1aa)',
          600: 'var(--primary-600, #1d9f99)',
          700: 'var(--primary-700, #198c87)',
          800: 'var(--primary-800, #157975)',
          900: 'var(--primary-900, #0e5955)',
        },
        secondary: {
          50: '#fff4e0',
          100: '#ffe3b3',
          200: '#ffd180',
          300: '#ffbf4d',
          400: '#ffb126',
          500: '#fea501', // Main secondary color
          600: '#e69401',
          700: '#cc8301',
          800: '#b37201',
          900: '#8a5500',
        },
      },
    },
  },
  plugins: [],
}
