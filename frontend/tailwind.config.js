/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          600: '#2563EB',
          700: '#1E40AF'
        }
      },
      borderRadius: {
        xl: '12px'
      }
    }
  },
  plugins: []
};
