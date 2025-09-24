/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',
        secondary: '#4CAF50',
        accent: '#66BB6A',
        light: '#81C784',
        dark: '#1B5E20',
        darker: '#0D4A14',
      },
      boxShadow: {
        neomorphic: '12px 12px 24px #0a0a0a, -12px -12px 24px #1a1a1a',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};