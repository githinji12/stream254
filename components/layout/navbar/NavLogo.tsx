// components/layout/navbar/NavLogo.tsx
'use client'

import { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GRADIENTS, ANIMATIONS, FOCUS_RING } from '@/lib/constants/navbar'

export const NavLogo = memo(function NavLogo() {
  const router = useRouter()

  const handleHomeClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      router.push('/')
    },
    [router]
  )

  return (
    <button
      onClick={handleHomeClick}
      className={`relative group ${FOCUS_RING}`}
      aria-label="Stream254 - Go to homepage"
    >
      {/* Animated gradient border */}
      <div
        className={`absolute -inset-0.5 ${GRADIENTS.kenyanFlag} rounded-lg opacity-75 group-hover:opacity-100 blur-sm transition-opacity duration-500 ${ANIMATIONS.gradientRotate}`}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-2 p-1.5 bg-white dark:bg-gray-900 rounded-lg group-hover:scale-105 transition-all duration-300 shadow-sm group-hover:shadow-lg">
        <div className={`p-1.5 rounded-md ${GRADIENTS.kenyanDiagonal}`}>
          <svg
            className="h-6 w-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <span className="font-bold text-xl hidden sm:block">
          <span className="text-[var(--kenya-red)] dark:text-[#ff6b6b]">Stream</span>
          <span className="text-[var(--kenya-black)] dark:text-white">254</span>
        </span>
      </div>
    </button>
  )
})