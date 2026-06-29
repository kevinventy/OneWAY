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
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3461ff',
          600: '#1d3df5',
          700: '#162ce1',
          800: '#1828b6',
          900: '#1a288f',
          950: '#141a57',
        },
        amber: {
          400: '#ffb020',
          500: '#ff9500',
          600: '#e07b00',
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
