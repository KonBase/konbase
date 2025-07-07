import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Custom theme colors based on provided palette
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
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
        helper: {
          background: '#ea8000',
        },
        konbase: {
          // New color palette
          'pastel-yellow': '#fce771',    // Accent
          'navy-blue': '#0c2e62',        // Primary
          'bright-pink': '#d84165',      // Warning
          'sky-blue': '#0fb4ea',         // Information
          'charcoal-gray': '#1b1b1b',    // Text
          'light-gray': '#e7eaef',       // Light Background
          'pale-blue': '#9eabc0',        // 25% dark background
          'slate-blue': '#556d91',       // 50% dark background
          'deep-navy': '#082045',        // 75% dark background
          'midnight-blue': '#061731',    // Dark Background
          
          // Legacy aliases for backward compatibility
          blue: '#0c2e62',
          cherry: '#d84165',
          'light-blue': '#0fb4ea',
          yellow: '#fce771',
          black: '#1b1b1b',
          white: '#e7eaef',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      spacing: {
        // Added spacing variables for UI density
        'density-compact': '0.25rem',
        'density-comfortable': '0.5rem',
        'density-spacious': '1rem',
      },
      fontSize: {
        // Text size variants for accessibility
        'size-default': '1rem',
        'size-large': '1.125rem',
        'size-larger': '1.25rem',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addBase, addUtilities, theme }) {
      // Add base styles for accessibility features
      addBase({
        // Text size classes
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
          'html, body': { fontSize: '1.125rem' },
        },
        '.text-size-larger': {
          '--font-size-base': '1.25rem',
          '--font-size-sm': '1.125rem',
          '--font-size-lg': '1.5rem',
          '--font-size-xl': '1.75rem',
          'html, body': { fontSize: '1.25rem' },
        },

        // Contrast modes
        '.contrast-default': {},
        '.contrast-increased': {
          '--background': '0 0% 100%',
          '--foreground': '240 10% 3.9%',
          'img, video': { filter: 'contrast(1.2)' },
          'a, button, input, select': {
            '--tw-ring-opacity': 1,
            '--tw-ring-color': 'rgb(0 0 0 / var(--tw-ring-opacity))',
            outline: '2px solid currentColor',
          },
        },
        '.contrast-high': {
          '--background': '0 0% 100%',
          '--foreground': '0 0% 0%',
          body: {
            color: '#000',
            background: '#fff',
          },
          'img, video': { filter: 'contrast(1.5)' },
          'a, button, input, select': {
            outline: '3px solid currentColor',
          },
        },

        // Animation levels
        '.animations-full': {},
        '.animations-reduced': {
          '*, *::before, *::after': {
            'animation-duration': '0.001ms !important',
            'transition-duration': '0.001ms !important',
          },
        },
        '.animations-none': {
          '*, *::before, *::after': {
            animation: 'none !important',
            transition: 'none !important',
          },
        },

        // Reduced motion
        '.reduced-motion': {
          '*, *::before, *::after': {
            'animation-duration': '0.001ms !important',
            'animation-iteration-count': '1 !important',
            'transition-duration': '0.001ms !important',
          },
        },

        // Screen reader optimizations
        '.screen-reader-optimized': {
          'a, button, input, select': {
            outline: '2px solid currentColor !important',
            'outline-offset': '2px !important',
          },
          '.sr-only': {
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: '0',
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            borderWidth: '0',
          },
        },
      });

      // Add utilities for density
      addUtilities({
        '.density-compact': {
          '--spacing-element': '0.5rem',
          '--padding-control': '0.25rem 0.5rem',
          '--form-element-height': '1.75rem',
          '--element-spacing': '0.5rem',
          '.card': { padding: '0.5rem' },
          '.card-header': { padding: '0.5rem', paddingBottom: '0.25rem' },
          '.card-content': { padding: '0.5rem', paddingTop: '0' },
          '.card-footer': { padding: '0.5rem', paddingTop: '0.25rem' },
          'button, .btn': { padding: '0.25rem 0.5rem', fontSize: '0.875rem' },
          'input, select, textarea': {
            padding: '0.25rem 0.5rem',
            minHeight: '1.75rem',
          },
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
          '.card': { padding: '1.5rem' },
          '.card-header': { padding: '1.5rem', paddingBottom: '0.75rem' },
          '.card-content': { padding: '1.5rem', paddingTop: '0' },
          '.card-footer': { padding: '1.5rem', paddingTop: '0.75rem' },
          'button, .btn': { padding: '0.75rem 1.25rem' },
          'input, select, textarea': {
            padding: '0.75rem 1rem',
            minHeight: '2.75rem',
          },
          '.form-group': { marginBottom: '1.5rem' },
          'h1, h2, h3, h4, h5, h6': { marginBottom: '1rem' },
          p: { marginBottom: '1rem', lineHeight: '1.8' },
        },
      });
    },
  ],
} satisfies Config;
