/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            h1: {
              color: theme('colors.primary.DEFAULT'),
              fontWeight: '900',
            },
            h2: {
              color: theme('colors.primary.DEFAULT'),
              fontWeight: '900',
              borderBottom: '2px solid',
              borderColor: 'hsl(var(--primary) / 0.2)',
              paddingBottom: '0.5rem',
              marginTop: '2em',
            },
            h3: {
              color: theme('colors.foreground'),
              fontWeight: '800',
              marginTop: '1.5em',
            },
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.pink.500'),
              },
            },
            blockquote: {
              borderLeftColor: theme('colors.primary.DEFAULT'),
              backgroundColor: theme('colors.primary.DEFAULT / 5%'),
              padding: '1rem',
              borderRadius: '0.5rem',
              fontStyle: 'italic',
            },
            hr: {
              borderColor: theme('colors.border'),
              marginTop: '2em',
              marginBottom: '2em',
            },
          },
        },
      }),
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
