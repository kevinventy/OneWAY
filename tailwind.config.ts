import type { Config } from 'tailwindcss';

/**
 * ONE WAY design tokens.
 * Brand palette inspired by the ONE WAY devis identity (Madagascar roads):
 *  - primary  : deep asphalt blue (trust, B2B)
 *  - accent   : signal amber (movement, "one way" road sign)
 *  - success  : delivered / accepted
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2fb',
          100: '#d8e1f4',
          200: '#b6c6e9',
          300: '#8aa3d8',
          400: '#5c7cc4',
          500: '#3f5cc0',
          600: '#2a44a0',
          700: '#223a82',
          800: '#1d3068',
          900: '#1b2a5e',
          950: '#16224d',
        },
        amber: {
          400: '#ff9a3c',
          500: '#f07d1a',
          600: '#d96a0c',
        },
        ink: {
          DEFAULT: '#0b1220',
          soft: '#1b2433',
          muted: '#5b6678',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,18,32,0.06), 0 8px 24px -12px rgba(11,18,32,0.18)',
        pop: '0 12px 40px -8px rgba(20,26,87,0.35)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
