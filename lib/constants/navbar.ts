// lib/constants/navbar.ts

/**
 * Kenyan brand colors - reference CSS variables for theme support
 */
export const KENYA_COLORS = {
  red: 'var(--kenya-red, #bb0000)',
  redHover: 'var(--kenya-red-hover, #990000)',
  green: 'var(--kenya-green, #007847)',
  greenHover: 'var(--kenya-green-hover, #005c36)',
  black: 'var(--kenya-black, #000000)',
  white: 'var(--kenya-white, #ffffff)',
  mpesa: 'var(--kenya-mpesa, #4CAF50)',
} as const

/**
 * Gradient class strings - extracted for reuse and consistency
 */
export const GRADIENTS = {
  kenyanFlag: 'bg-gradient-to-r from-[var(--kenya-green)] via-[var(--kenya-black)] to-[var(--kenya-red)]',
  kenyanFlagVertical: 'bg-gradient-to-b from-[var(--kenya-green)] via-[var(--kenya-black)] to-[var(--kenya-red)]',
  kenyanDiagonal: 'bg-gradient-to-br from-[var(--kenya-red)] to-[var(--kenya-green)]',
  kenyanReverse: 'bg-gradient-to-bl from-[var(--kenya-green)] to-[var(--kenya-red)]',
} as const

/**
 * Animation class strings - for consistent motion design
 */
export const ANIMATIONS = {
  flagSlide: 'animate-flag-slide',
  gradientRotate: 'animate-gradient-rotate',
  gradientSlide: 'animate-gradient-slide',
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  slideInRight: 'animate-slide-in-right',
  pulse: 'animate-pulse',
  ping: 'animate-ping',
} as const

/**
 * Glassmorphism base classes
 */
export const GLASS_CLASSES = 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50'

/**
 * Focus ring utility for accessibility
 */
export const FOCUS_RING = 'focus:outline-none focus:ring-2 focus:ring-[var(--kenya-red)]/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900'

/**
 * Maasai pattern SVG as encoded data URI (reusable constant)
 */
export const MAASAI_PATTERN_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'>
  <g fill='none' fill-rule='evenodd'>
    <g fill='#bb0000' fill-opacity='1'>
      <path d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/>
    </g>
  </g>
</svg>`)}`

/**
 * Kenyan shield watermark SVG (encoded)
 */
export const KENYA_SHIELD_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'>
  <path d='M50 5 L90 25 L90 65 L50 95 L10 65 L10 25 Z' fill='none' stroke='currentColor' stroke-width='1.5' opacity='0.6'/>
  <path d='M50 15 L80 30 L80 60 L50 80 L20 60 L20 30 Z' fill='none' stroke='currentColor' stroke-width='1' opacity='0.4'/>
  <line x1='50' y1='25' x2='50' y2='75' stroke='currentColor' stroke-width='1' opacity='0.3'/>
</svg>`)}`

/**
 * Z-index layers for stacking context
 */
export const Z_INDEX = {
  base: 10,
  navbar: 50,
  dropdown: 60,
  mobileMenu: 70,
  modal: 100,
} as const

/**
 * Breakpoint constants for responsive design
 */
export const BREAKPOINTS = {
  mobile: 'md:hidden',
  desktop: 'hidden md:flex',
} as const