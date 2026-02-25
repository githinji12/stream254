// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🇰🇪 Kenyan Flag Colors - for direct use (bg-kenya-red, text-kenya-green)
        'kenya-red': '#bb0000',
        'kenya-green': '#007847',
        'kenya-black': '#000000',
        'kenya-white': '#ffffff',
        'kenya-gold': '#FFD700',
        
        // Brand aliases for convenience
        brand: {
          primary: '#bb0000',
          secondary: '#007847', 
          accent: '#000000',
          light: '#ffffff',
        },
      },
      backgroundImage: {
        // Kenyan Flag Gradient - use as bg-kenya-flag
        'kenya-flag': 'linear-gradient(135deg, #bb0000 0%, #000000 50%, #007847 100%)',
        'kenya-flag-horizontal': 'linear-gradient(90deg, #007847 0%, #000000 33%, #bb0000 66%, #000000 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'kenya': '0 4px 14px 0 rgba(187, 0, 0, 0.25)',
        'kenya-green': '0 4px 14px 0 rgba(0, 120, 71, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

