/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B5FEF',
          foreground: '#FFFFFF',
          50: '#E8E8FD',
          100: '#D1D1FB',
          200: '#A3A3F7',
          300: '#7575F3',
          400: '#5B5FEF',
          500: '#4A4DE0',
          600: '#3B3EC7',
          700: '#2D30A0',
          800: '#1F2279',
          900: '#111352',
        },
        success: {
          DEFAULT: '#22C55E',
        },
        warning: {
          DEFAULT: '#F59E0B',
        },
        danger: {
          DEFAULT: '#EF4444',
        },
        background: {
          DEFAULT: '#F7F8FC',
        },
        muted: {
          DEFAULT: '#F1F5F9',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
}
