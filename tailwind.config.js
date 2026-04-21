/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAFAF8',
        teal: {
          DEFAULT: '#8FAF9F',
          accent: '#809E8F',
          deep: '#6C877A',
        },
        coral: {
          DEFAULT: '#CFAE9A',
          accent: '#C39E87',
        },
        lavender: {
          DEFAULT: '#B8AEC4',
          accent: '#C9C1D1',
        },
        gold: '#C8BB93',
        slate: {
          300: '#4A4A4A',
          400: '#5A5A5A',
          500: '#767676',
          600: '#8A8A8A',
          700: '#ECEBE7',
          card: '#FFFFFF',
        },
        muted: '#DDD9D3',
        text: {
          primary: '#2C2C2C',
          secondary: '#4A4A4A',
        },
        border: {
          soft: '#E8E8E6',
          muted: '#DDD9D3',
        },
      },
      fontFamily: {
        heading: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
