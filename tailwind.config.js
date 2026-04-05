/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surface palette – dark tactical theme
        surface: {
          base: '#08090D',
          1: '#0F1117',
          2: '#161820',
          3: '#1E2030',
          4: '#252840',
          border: '#2A2D3E',
          'border-subtle': '#1E2130',
        },
        // Brand accent
        accent: {
          DEFAULT: '#4F8EF7',
          bright: '#6BA3FA',
          dim: '#3A72D4',
          muted: 'rgba(79,142,247,0.12)',
        },
        // Alliance colors
        alliance: {
          red: '#EF4444',
          'red-dim': 'rgba(239,68,68,0.15)',
          'red-border': 'rgba(239,68,68,0.3)',
          blue: '#3B7FF5',
          'blue-dim': 'rgba(59,127,245,0.15)',
          'blue-border': 'rgba(59,127,245,0.3)',
        },
        // Text palette
        ink: {
          DEFAULT: '#E8EAEF',
          secondary: '#A0A4B8',
          muted: '#666B82',
          disabled: '#3E4155',
        },
        // Status colors
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#4F8EF7',
          'success-dim': 'rgba(34,197,94,0.12)',
          'warning-dim': 'rgba(245,158,11,0.12)',
          'danger-dim': 'rgba(239,68,68,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,142,247,0.2)',
        'glow-accent': '0 0 20px rgba(79,142,247,0.25)',
        'glow-red': '0 0 16px rgba(239,68,68,0.2)',
        'glow-blue': '0 0 16px rgba(59,127,245,0.2)',
        'panel': '0 2px 8px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(79,142,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.03) 1px, transparent 1px)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
    },
  },
  plugins: [],
}
