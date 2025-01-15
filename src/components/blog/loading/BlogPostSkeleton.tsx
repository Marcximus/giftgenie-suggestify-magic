export const BlogPostSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="animate-pulse space-y-8">
          {/* Header image skeleton */}
          <div className="aspect-[21/9] bg-gray-200 rounded-lg" />
          
          {/* Author info skeleton */}
          <div className="flex gap-4">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-32 h-4 bg-gray-200 rounded" />
            <div className="w-28 h-4 bg-gray-200 rounded" />
          </div>
          
          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="w-3/4 h-6 bg-gray-200 rounded" />
            <div className="w-full h-4 bg-gray-200 rounded" />
            <div className="w-5/6 h-4 bg-gray-200 rounded" />
            <div className="w-4/5 h-4 bg-gray-200 rounded" />
          </div>
          
          {/* Related posts skeleton */}
          <div className="mt-12 pt-8 border-t">
            <div className="w-48 h-8 bg-gray-200 rounded mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg overflow-hidden shadow-md">
                  <div className="aspect-[16/9] bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="w-3/4 h-5 bg-gray-200 rounded" />
                    <div className="w-full h-4 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};