/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'premium-sm': '0px 1px 2px rgba(0,0,0,0.4), 0px 0px 0px 1px rgba(255,255,255,0.05) inset',
        'premium-card': '0px 4px 12px rgba(0,0,0,0.5), 0px 0px 0px 1px rgba(255,255,255,0.05) inset',
        'glow': '0px 0px 20px rgba(225, 29, 72, 0.3)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          'from': { backgroundPosition: '0 0' },
          'to': { backgroundPosition: '-200% 0' },
        },
      },
      colors: {
        // Base semantic colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Card colors
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        
        // Popover colors
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        
        // Primary colors
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        
        // Secondary colors
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        
        // Muted colors
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        
        // Accent colors
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        
        // Destructive colors
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        
        // Border & Input
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        // ========================================
        // DESIGN SYSTEM - Grayscale
        // ========================================
        'pure-black': 'hsl(var(--pure-black))',
        'rich-black': 'hsl(var(--rich-black))',
        'charcoal': 'hsl(var(--charcoal))',
        'dark-gray': 'hsl(var(--dark-gray))',
        'mid-gray': 'hsl(var(--mid-gray))',
        'slate': 'hsl(var(--slate))',
        'silver': 'hsl(var(--silver))',
        'light-gray': 'hsl(var(--light-gray))',
        'pale-gray': 'hsl(var(--pale-gray))',
        
        // ========================================
        // DESIGN SYSTEM - Reds
        // ========================================
        'red-dark': 'hsl(var(--red-dark))',
        'red-primary': 'hsl(var(--red-primary))',
        'red-bright': 'hsl(var(--red-bright))',
        'red-light': 'hsl(var(--red-light))',
        'red-pale': 'hsl(var(--red-pale))',
        
        // ========================================
        // DESIGN SYSTEM - Whites
        // ========================================
        'pure-white': 'hsl(var(--pure-white))',
        'off-white': 'hsl(var(--off-white))',
        'ghost-white': 'hsl(var(--ghost-white))',
        
        // ========================================
        // DESIGN SYSTEM - Supporting Colors
        // ========================================
        'success': 'hsl(var(--success))',
        'warning': 'hsl(var(--warning))',
        'info': 'hsl(var(--info))',
        'error': 'hsl(var(--error))',
        
        // Surface colors for premium depth
        'surface': 'hsl(var(--surface))',
        'surface-highlight': 'hsl(var(--surface-highlight))',
        
        // Glass morphism colors
        'glass': {
          bg: 'var(--glass-bg)',
          border: 'var(--glass-border)',
        },
        'hover': {
          bg: 'var(--hover-bg)',
        },
        'active': {
          ring: 'var(--active-ring)',
          shadow: 'var(--active-shadow)',
        },
      },
      screens: {
        'xs': '320px',
        'sm': '375px',
        'md': '428px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
