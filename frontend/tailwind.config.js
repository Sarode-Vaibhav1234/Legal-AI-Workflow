/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          dark: '#0B132B',
          darker: '#060B19',
          navy: '#1C2541',
          teal: '#3A506B',
          gold: '#D4AF37',
          light: '#EAEAEA',
          card: 'rgba(28, 37, 65, 0.6)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
