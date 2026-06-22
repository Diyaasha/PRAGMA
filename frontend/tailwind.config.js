/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EDF0F7',
          100: '#C8D0E5',
          200: '#9FAED0',
          300: '#7288BC',
          400: '#4B67A7',
          500: '#2B4A8F',
          600: '#1D3872',
          700: '#142C5C',
          800: '#0B1F45',
          900: '#041E42',
        },
        ink:     '#041E42',                               // Canara Bank navy — constant
        paper:   'rgb(var(--paper)   / <alpha-value>)',   // cream ↔ deep navy
        surface: 'rgb(var(--surface) / <alpha-value>)',   // elevated panel
        card:    'rgb(var(--card)    / <alpha-value>)',   // card surface
        line:    'rgb(var(--line)    / <alpha-value>)',   // hairline border
        brass: {
          DEFAULT: '#c69b4f',   // enterprise gold accent
          soft:    '#F0E8D5',
          deep:    '#9b7232',
          muted:   '#8b98aa',   // dark mode muted text
        },
        success: {
          DEFAULT: '#067647',
          50:      '#ECFDF3',
          200:     '#ABEFC6',
          700:     '#067647',
        },
        warning: {
          DEFAULT: '#B54708',
          50:      '#FFFAEB',
          200:     '#FEDF89',
          700:     '#B54708',
        },
        danger: {
          DEFAULT: '#B42318',
          50:      '#FEF3F2',
          200:     '#FECDCA',
          700:     '#B42318',
        },
      },
      fontFamily: {
        serif: ['"IBM Plex Serif"', 'Georgia', 'serif'],
        sans:  ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseRing: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        shimmer:   'shimmer 2s infinite linear',
        fadeIn:    'fadeIn 0.2s ease-out',
        slideIn:   'slideIn 0.25s ease-out',
        pulseRing: 'pulseRing 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
