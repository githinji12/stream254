// components/profile/SkeletonLoader.tsx
'use client'

export function SkeletonLoader() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-to-br from-gray-50 to-gray-100">
      <div className="fixed top-16 left-0 right-0 h-1 z-30 bg-to-r from-[#007847] via-[#000000] to-[#bb0000]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Skeleton */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-6 sm:p-8 mb-8 animate-pulse">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Avatar Skeleton */}
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl bg-gray-200" />
            
            {/* Profile Info Skeleton */}
            <div className="flex-1 space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-full max-w-md bg-gray-200 rounded" />
            </div>
            
            {/* Action Buttons Skeleton */}
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 rounded-full" />
              <div className="h-10 w-16 bg-gray-200 rounded-full" />
            </div>
          </div>
          
          {/* Stats Skeleton */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-gray-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 w-12 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Tabs Skeleton */}
        <div className="mb-6 animate-pulse">
          <div className="flex gap-1 border-b border-gray-200">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 w-20 bg-gray-200 rounded-t" />
            ))}
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  <div className="flex gap-2 pt-3">
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                    <div className="h-3 w-12 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}