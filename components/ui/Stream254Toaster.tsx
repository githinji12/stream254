// components/ui/Stream254Toaster.tsx
'use client'

import { Toaster } from 'react-hot-toast'
import { useTheme } from 'next-themes'

export function Stream254Toaster() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : '#1f2937',
          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          borderRadius: '12px',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
            : '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
        success: {
          duration: 3000,
          iconTheme: { primary: '#007847', secondary: '#fff' },
        },
        error: {
          duration: 5000,
          iconTheme: { primary: '#bb0000', secondary: '#fff' },
        },
        loading: {
          iconTheme: { primary: '#6b7280', secondary: '#fff' },
        },
      }}
    />
  )
}