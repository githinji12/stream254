// components/creator-studio/AnalyticsCard.tsx
import { Eye, Heart, Users, Wallet, TrendingUp } from 'lucide-react'

interface AnalyticsCardProps {
  title: string
  value: string
  trend?: string
  icon: 'eye' | 'heart' | 'users' | 'wallet'
  color: 'red' | 'green' | 'blue' | 'mpesa'
  subtitle?: string
}

const iconMap = {
  eye: Eye,
  heart: Heart,
  users: Users,
  wallet: Wallet,
}

const colorMap = {
  red: { bg: 'bg-[#bb0000]/10', text: 'text-[#bb0000]', icon: 'text-[#bb0000]' },
  green: { bg: 'bg-[#007847]/10', text: 'text-[#007847]', icon: 'text-[#007847]' },
  blue: { bg: 'bg-[#1DA1F2]/10', text: 'text-[#1DA1F2]', icon: 'text-[#1DA1F2]' },
  mpesa: { bg: 'bg-[#4CAF50]/10', text: 'text-[#4CAF50]', icon: 'text-[#4CAF50]' },
}

export function AnalyticsCard({ title, value, trend, icon, color, subtitle }: AnalyticsCardProps) {
  const Icon = iconMap[icon]
  const colors = colorMap[color]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${colors.bg}`}>
          <Icon className={`h-5 w-5 ${colors.icon}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 text-sm">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  )
}