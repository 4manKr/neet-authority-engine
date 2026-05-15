export default function BlogListingLoading() {
  return (
    <main className="min-h-screen bg-gray-50 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-8 w-72 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
          <div className="h-10 w-80 bg-gray-200 rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Blog cards skeleton */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="h-44 bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-20 bg-gray-200 rounded" />
                  <div className="h-5 bg-gray-200 rounded" />
                  <div className="h-5 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg" />
              ))}
            </div>
            <div className="h-40 bg-blue-100 rounded-2xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
