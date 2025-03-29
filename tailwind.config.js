// tailwind.config.js
import { fontFamily } from 'tailwindcss/defaultTheme'

export default {
  darkMode: 'class', // Enable dark mode via class
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#121212',
        surface: '#1E1E1E',
        sidebar: '#151515',  // Darker sidebar color
        card: '#222222',     // Slightly darker card background
        input: '#262626',
        muted: '#8B8B8B',
        border: '#292929',   // More subtle border color
        primary: '#A855F7',       // bright purple button
        primaryHover: '#9333EA',
        secondary: '#EE46EF',     // secondary pink
        accent: '#A855F7',        // match primary for consistency
        danger: '#F87171',        // red
        text: '#E5E5E5',          // light gray
        textMuted: '#A1A1AA',     // muted gray
      },
      borderRadius: {
        md: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      boxShadow: {
        soft: '0 4px 12px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 