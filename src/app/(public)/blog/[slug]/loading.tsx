export default function BlogDetailLoading() {
  return (
    <main className="min-h-screen bg-white animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
          <div className="h-5 w-20 bg-blue-100 rounded-full mb-4" />
          <div className="h-10 bg-gray-200 rounded mb-2" />
          <div className="h-10 w-3/4 bg-gray-200 rounded mb-4" />
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* TOC sidebar skeleton */}
          <aside className="hidden lg:block space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </aside>

          {/* Article skeleton */}
          <div className="lg:col-span-3 space-y-4">
            <div className="h-72 bg-gray-200 rounded-2xl mb-8" />
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-100 rounded"
                style={{ width: i % 4 === 3 ? '60%' : '100%' }}
              />
            ))}
            <div className="h-6 w-48 bg-gray-200 rounded mt-8" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-4 bg-gray-100 rounded"
                style={{ width: i % 3 === 2 ? '70%' : '100%' }}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
