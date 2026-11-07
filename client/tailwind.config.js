/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary blue from the Figma design (#4566EC) and its navy progress fill.
        brand: {
          50: '#eef1fe',
          100: '#dfe4fd',
          200: '#c9d0fb',
          300: '#a3b1f7',
          400: '#7389f2',
          500: '#4566ec',
          600: '#3a57dc',
          700: '#2f47bd',
          800: '#253d97',
          900: '#1d2f75',
        },
        ink: {
          DEFAULT: '#181818',
          muted: '#6b6b6b',
          faint: '#a5a5a5',
        },
        line: '#e3e3e3',
        pending: {
          bg: '#fde8e8',
          fg: '#e05a5a',
        },
      },
      boxShadow: {
        sheet: '0 -8px 32px rgba(0,0,0,0.12)',
        fab: '0 10px 24px rgba(69,102,236,0.35)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      animation: {
        'slide-up': 'slide-up 220ms cubic-bezier(.2,.8,.2,1)',
        'sheet-up': 'sheet-up 280ms cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in 180ms ease-out',
      },
    },
  },
  plugins: [],
};
