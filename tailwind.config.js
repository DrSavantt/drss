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
      colors: {
        // Theme-aware colors using CSS variables
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },

        // Accent colors - consistent across themes
        'accent-mint': "var(--accent-mint)",
        'accent-coral': "var(--accent-coral)",
        'accent-yellow': "var(--accent-yellow)",

        // Legacy color support
        coral: {
          DEFAULT: '#FF6B6B',
          dark: '#FF5252',
        },
        mint: {
          DEFAULT: '#4ECDC4',
          light: '#00F5B8',
        },
        amber: {
          DEFAULT: '#FFE66D',
          light: '#FFD666',
        },
        slate: {
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
      borderColor: {
        DEFAULT: "var(--card-border)",
        card: "var(--card-border)",
        input: "var(--input-border)",
      },
      backgroundColor: {
        'input': "var(--input-bg)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}

