import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './index.html',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  safelist: [
    // Force include commonly used classes that might not be detected
    'min-h-screen', 'bg-gradient-to-br', 'from-purple-900', 'via-blue-900', 'to-indigo-900',
    'text-white', 'relative', 'overflow-hidden', 'absolute', 'inset-0', 'w-80', 'h-80',
    'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'rounded-full', 'mix-blend-multiply',
    'filter', 'blur-xl', 'opacity-20', 'animate-blob', 'animation-delay-2000', 'animation-delay-4000',
    'container', 'mx-auto', 'p-4', 'md:p-8', 'z-10', 'text-center', 'mb-12', 'animate-fade-in',
    'flex', 'justify-center', 'mb-4', 'bg-gradient-to-br', 'from-purple-600', 'to-blue-600',
    'rounded-2xl', 'shadow-2xl', 'transform', 'hover:scale-110', 'transition-transform',
    'animate-glow', 'animate-float', 'h-12', 'w-12', 'text-5xl', 'md:text-6xl', 'font-bold',
    'tracking-tight', 'bg-clip-text', 'text-transparent', 'from-purple-200', 'to-pink-200',
    'text-gray-300', 'mt-2', 'text-lg', 'items-center', 'gap-2', 'h-5', 'w-5',
    'text-yellow-400', 'animate-pulse', 'grid', 'grid-cols-1', 'lg:grid-cols-5', 'gap-8',
    'items-start', 'lg:col-span-2', 'flex-col', 'gap-6', 'animate-slide-in-left',
    'backdrop-blur-lg', 'bg-white/10', 'border', 'border-white/20', 'hover:shadow-purple-500/20',
    'hover:shadow-blue-500/20', 'transition-all', 'duration-300', 'lg:col-span-3',
    'animate-slide-in-right', 'hover:shadow-indigo-500/20', 'mt-12', 'text-gray-400',
    'text-sm', 'animation-delay-1000', 'h-4', 'w-4'
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
