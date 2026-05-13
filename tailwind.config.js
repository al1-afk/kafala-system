/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Cairo', 'Noto Kufi Arabic', 'sans-serif'],
      },
      colors: {
        // Brand: جمعية بسمة للتنمية البشرية
        // Primary: Dark forest green from the logo
        brand: {
          50: '#e6f4ec',
          100: '#c0e2cd',
          200: '#96cfac',
          300: '#6bbb8b',
          400: '#4cad73',
          500: '#2c9f5b',
          600: '#229150', // primary action
          700: '#187f43',
          800: '#0e6e37',
          900: '#005020',
          950: '#003d18',
        },
        // Accent: Warm orange from the logo
        accent: {
          50: '#fff4e5',
          100: '#ffe2bf',
          200: '#ffce95',
          300: '#ffba6a',
          400: '#ffac4a',
          500: '#ff9d29',
          600: '#f39200', // primary accent
          700: '#d97f00',
          800: '#bf6c00',
          900: '#9e5400',
          950: '#6b3a00',
        },
        // Keep emerald alias for backward compatibility, mapped to brand
        emerald: {
          50: '#e6f4ec',
          100: '#c0e2cd',
          200: '#96cfac',
          300: '#6bbb8b',
          400: '#4cad73',
          500: '#2c9f5b',
          600: '#229150',
          700: '#187f43',
          800: '#0e6e37',
          900: '#005020',
          950: '#003d18',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
