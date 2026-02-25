// components/modals/FollowersModal.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Users, BadgeCheck } from 'lucide-react'

// 🎨 Kenyan Theme Constants
const KENYA_GRADIENT = {
  primary: 'linear-gradient(135deg, #bb0000, #007847)',
} as const

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  profileId: string
  type: 'followers' | 'following'
  supabase: any
}

export function FollowersModal({ isOpen, onClose, profileId, type, supabase }: FollowersModalProps) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      async function fetchUsers() {
        setLoading(true)
        try {
          if (type === 'followers') {
            const { data, error } = await supabase
              .from('follows')
              .select(`
                follower_id,
                profile:profiles!follows_follower_id_fkey (
                  id,
                  username,
                  full_name,
                  avatar_url,
                  is_verified
                )
              `)
              .eq('following_id', profileId)
            
            if (!error && data) {
              setUsers(data.map((f: any) => f.profile))
            }
          } else {
            const { data, error } = await supabase
              .from('follows')
              .select(`
                following_id,
                profile:profiles!follows_following_id_fkey (
                  id,
                  username,
                  full_name,
                  avatar_url,
                  is_verified
                )
              `)
              .eq('follower_id', profileId)
            
            if (!error && data) {
              setUsers(data.map((f: any) => f.profile))
            }
          }
        } catch (err) {
          console.error('Fetch users error:', err)
        } finally {
          setLoading(false)
        }
      }
      fetchUsers()
    }
  }, [isOpen, profileId, type, supabase])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="followers-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 id="followers-modal-title" className="text-lg font-semibold text-gray-900">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-transparent"
                style={{
                  borderTopColor: '#bb0000',
                  borderRightColor: '#000000',
                  borderBottomColor: '#007847'
                }}>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No {type} yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ background: KENYA_GRADIENT.primary }}>
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    {user.is_verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#1DA1F2] flex items-center justify-center border-2 border-white">
                        <BadgeCheck className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-medium text-gray-900 truncate">@{user.username}</p>
                      {user.is_verified && <BadgeCheck className="h-4 w-4 text-[#1DA1F2]" />}
                    </div>
                    {user.full_name && <p className="text-sm text-gray-500 truncate">{user.full_name}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}