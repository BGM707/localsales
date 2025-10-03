/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chart: {
          1: '#3b82f6', // blue
          2: '#10b981', // emerald
          3: '#f59e0b', // amber
          4: '#ef4444', // red
          5: '#8b5cf6', // violet
          6: '#06b6d4', // cyan
          7: '#84cc16', // lime
          8: '#f97316', // orange
          9: '#ec4899', // pink
          10: '#6366f1', // indigo
        }
      }
    },
  },
  plugins: [],
};
