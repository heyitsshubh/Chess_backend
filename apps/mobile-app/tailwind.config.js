/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Dark premium palette
        background: '#0D0D0F',
        surface: '#16161A',
        card: '#1C1C22',
        border: '#2A2A35',
        primary: '#7B61FF',
        'primary-dim': '#4A3D9E',
        accent: '#00D4FF',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        // Chess board
        'board-light': '#F0D9B5',
        'board-dark': '#B58863',
        'board-highlight': '#F6F669',
        'board-selected': '#20B2AA',
        // Text
        'text-primary': '#F8F8FF',
        'text-secondary': '#9CA3AF',
        'text-muted': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SpaceMono', 'monospace'],
      },
    },
  },
  plugins: [],
};
