// app/creator-studio/loading.tsx
export default function CreatorStudioLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-to-br from-gray-50 to-gray-100">
      <div className="fixed top-16 left-0 right-0 h-1 z-30"
        style={{
          background: 'linear-gradient(90deg, #007847 0%, #007847 33%, #000000 33%, #000000 34%, #bb0000 34%, #bb0000 66%, #000000 66%, #000000 67%, #007847 67%, #007847 100%)'
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Skeleton */}
          <aside className="hidden lg:block lg:w-64">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </aside>
          {/* Content Skeleton */}
          <main className="flex-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}