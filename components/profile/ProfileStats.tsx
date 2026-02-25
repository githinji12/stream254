// components/profile/ProfileStats.tsx
'use client'

export function ProfileStats({ videos, views, likes, followers, following }: {
  videos: number
  views: number
  likes: number
  followers: number
  following: number
}) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  return (
    <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t">
      <div><p className="text-2xl font-bold text-[#bb0000]">{videos}</p><p className="text-sm text-gray-500">Videos</p></div>
      <div><p className="text-2xl font-bold text-[#007847]">{formatNumber(views)}</p><p className="text-sm text-gray-500">Views</p></div>
      <div><p className="text-2xl font-bold text-[#bb0000]">{formatNumber(likes)}</p><p className="text-sm text-gray-500">Likes</p></div>
      <div><p className="text-2xl font-bold">{formatNumber(followers)}</p><p className="text-sm text-gray-500">Followers</p></div>
      <div><p className="text-2xl font-bold">{formatNumber(following)}</p><p className="text-sm text-gray-500">Following</p></div>
    </div>
  )
}