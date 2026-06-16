/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PRAGMA — institutional navy. Redefining `primary` retints the whole app.
        primary: {
          50:  '#EEF2F9',
          100: '#D7E0EF',
          200: '#B0C2DD',
          300: '#8099C2',
          400: '#5070A0',
          500: '#2F5184',
          600: '#1D3D6B',
          700: '#142C4F',
          800: '#0D1F39',
          900: '#081627',
        },
        ink: '#081627',
        accent: {
          DEFAULT: '#B98A2E',  // muted brass — used sparingly
          soft:    '#F3E9D2',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
