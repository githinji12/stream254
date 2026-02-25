// components/ui/KenyanButton.tsx
'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface KenyanButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  children: ReactNode
  className?: string
}

export default function KenyanButton({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}: KenyanButtonProps) {
  const baseStyles = 'px-6 py-3 font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants: Record<string, string> = {
    primary: 'bg-linear-to-r from-kenya-red to-red-700 text-white hover:from-red-700 hover:to-kenya-red shadow-kenya hover:shadow-lg hover:-translate-y-0.5',
    secondary: 'bg-linear-to-r from-kenya-green to-green-700 text-white hover:from-green-700 hover:to-kenya-green shadow-kenya-green hover:shadow-lg hover:-translate-y-0.5',
    outline: 'border-2 border-kenya-black text-kenya-black hover:bg-kenya-black hover:text-white',
    ghost: 'text-gray-700 hover:text-kenya-red hover:bg-kenya-red/10',
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}