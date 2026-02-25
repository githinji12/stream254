// components/creator-studio/QuickActions.tsx
'use client'

import Link from 'next/link'
import { Upload, DollarSign, BarChart3 } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="flex gap-2">
      <Link
        href="/upload"
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #bb0000, #007847)' }}
      >
        <Upload className="h-4 w-4" />
        Upload
      </Link>
      <Link
        href="/creator-studio?tab=earnings"
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <DollarSign className="h-4 w-4" />
        Earnings
      </Link>
      <Link
        href="/creator-studio?tab=audience"
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <BarChart3 className="h-4 w-4" />
        Analytics
      </Link>
    </div>
  )
}