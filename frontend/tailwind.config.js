/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',               // ← Enable class-based dark mode
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
  extend: {
    colors: {
      dark: '#0f0f0f',
      charcoal: '#1a1a1a',
      lightGray: '#f5f5f5',
      mediumGray: '#666666',
    },
    fontFamily: {
      inter: ['Inter', 'ui-sans-serif', 'system-ui'],
    },
    borderRadius: {
      xl: '12px',
    },
  },
},
  plugins: [],
};
