/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maha: {
          navy: '#0d2347',
          blue: '#1b4b8a',
          accent: '#e66b27', // Maharashtra saffron/orange accent
          light: '#f4f7fb',
          dark: '#0a1628',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
