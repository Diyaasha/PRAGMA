/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Institutional navy — redefining `primary` retints the whole app
        primary: {
          50:  '#EEF2F7',
          100: '#D5DEEA',
          200: '#AFC0D6',
          300: '#7E97B6',
          400: '#4F6E93',
          500: '#2D5078',
          600: '#1C3F63',
          700: '#143049',
          800: '#0E2335',
          900: '#0A1825',
        },
        ink:   '#0E1C2B',
        paper: '#FAF9F6',
        line:  '#E8E3DA',     // warm hairline
        brass: {
          DEFAULT: '#9A7B3F',
          soft:    '#ECE3CE',
          deep:    '#7A5F2C',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono:  ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
