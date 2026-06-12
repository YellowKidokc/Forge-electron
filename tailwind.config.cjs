/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          dark: '#050505',
          card: '#0a0a0a',
          accent: '#dc2626',
          amber: '#f59e0b',
          text: '#d1d5db',
          bright: '#f9fafb'
        }
      },
      fontFamily: {
        serif: ['"Crimson Text"', 'Georgia', 'serif'],
        display: ['Oswald', 'Inter', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        'red-glow': '0 0 24px rgba(220, 38, 38, 0.18)'
      }
    }
  },
  plugins: []
};
