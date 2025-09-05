import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        helper: { background: '#ea8000' },
        konbase: {
          blue: '#0c2e62',
          cherry: '#d84165',
          'light-blue': '#0fb4ea',
          yellow: '#fce771',
          black: '#171716',
          white: '#e6e6dc',
          furry: '#a2779c',
          gzdacz: '#ea8000',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      spacing: {
        'density-compact': '0.25rem',
        'density-comfortable': '0.5rem',
        'density-spacious': '1rem',
      },
      fontSize: {
        'size-default': '1rem',
        'size-large': '1.125rem',
        'size-larger': '1.25rem',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addBase, addUtilities }: any) {
      addBase({
        '.text-size-default': {
          '--font-size-base': '1rem',
          '--font-size-sm': '0.875rem',
          '--font-size-lg': '1.125rem',
          '--font-size-xl': '1.25rem',
        },
        '.text-size-large': {
          '--font-size-base': '1.125rem',
          '--font-size-sm': '1rem',
          '--font-size-lg': '1.25rem',
          '--font-size-xl': '1.5rem',
        },
        '.text-size-larger': {
          '--font-size-base': '1.25rem',
          '--font-size-sm': '1.125rem',
          '--font-size-lg': '1.5rem',
          '--font-size-xl': '1.75rem',
        },
        '.contrast-default': {},
        '.contrast-increased': {
          '--background': '0 0% 100%',
          '--foreground': '240 10% 3.9%'
        },
        '.contrast-high': {
          '--background': '0 0% 100%',
          '--foreground': '0 0% 0%'
        },
        '.reduced-motion': {
          '*, *::before, *::after': {
            'animation-duration': '0.001ms !important',
            'animation-iteration-count': '1 !important',
            'transition-duration': '0.001ms !important'
          }
        },
        '.screen-reader-optimized': {
          'a, button, input, select': {
            outline: '2px solid currentColor !important',
            'outline-offset': '2px !important'
          }
        }
      })
      addUtilities({
        '.density-compact': {
          '--spacing-element': '0.5rem',
          '--padding-control': '0.25rem 0.5rem',
          '--form-element-height': '1.75rem',
          '--element-spacing': '0.5rem',
        },
        '.density-comfortable': {
          '--spacing-element': '1rem',
          '--padding-control': '0.5rem 0.75rem',
          '--form-element-height': '2.25rem',
          '--element-spacing': '1rem',
        },
        '.density-spacious': {
          '--spacing-element': '1.5rem',
          '--padding-control': '0.75rem 1rem',
          '--form-element-height': '2.75rem',
          '--element-spacing': '1.5rem',
        },
      })
    }
  ],
}

export default config
