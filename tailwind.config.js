
export default {
  darkMode: 'class',
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        accent: {
          50:  '#f4fbf2',
          100: '#e5f6e2',
          200: '#cbedc6',
          300: '#a3df9b',
          400: '#72dd15', // Bright green from logo
          500: '#15750a', // Deep green from logo
          600: '#116108',
          700: '#0e4f06',
          800: '#0b3d05',
          900: '#082e04',
          950: '#041702',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted: '#64748B',
        },
        // Warm complementary colors for 3D elements
        warm: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          900: '#78350f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter Tight', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'elevated': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'glow': '0 0 30px rgba(217, 104, 32, 0.2)',
        'soft': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'soft-dark': '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        'inner-soft': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)',
        'inner-soft-dark': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.2)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
