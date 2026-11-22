/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/**/*.js'],
  theme: {
    extend: {
      screens: {
        // Figma: sm frames are 402px, lg frames 1512px. Layout switches at 1024.
        lg: '1024px',
        xl: '1280px',
      },
      colors: {
        mint: {
          red: '#f2412e', // brand red (logo, eyebrows)
          cta: '#ee1b0f', // final CTA / feature red
          ink: '#0f0f11',
          paper: '#f3f3f2',
          card: '#292929',
          panel: '#1e1e20',
          menu: '#131315',
          line: '#303033',
          muted: '#8c8c8c',
          body: '#bdbbb6',
          caption: '#7b7b7b',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        btn: '13.104px',
        card: '20px',
      },
    },
  },
  plugins: [],
};
