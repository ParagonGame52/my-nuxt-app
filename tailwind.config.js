/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './pages/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './layouts/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'app-dark': '#0a0a0a',
        'app-light': '#F6F6F2',
        canvas: {
          DEFAULT: '#0a0a0a',
          card: '#191919',
          soft: '#1a1c20',
        },
        hairline: {
          DEFAULT: '#212327',
          subtle: '#1f2125',
          border: '#212327',
        },
        ink: {
          DEFAULT: '#ffffff',
          body: '#dadbdf',
          mute: '#7d8187',
        },
        accent: {
          sunset: '#ff7a17',
          'sunset-soft': '#ffc285',
          breeze: '#a0c3ec',
          ember: '#5a2510',
        }
      },
    },
  },
  plugins: [],
}
