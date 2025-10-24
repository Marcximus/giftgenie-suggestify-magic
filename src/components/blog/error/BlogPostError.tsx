interface BlogPostErrorProps {
  type: 'error' | 'not-found';
  error?: Error;
}

export const BlogPostError = ({ type, error }: BlogPostErrorProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {type === 'not-found' ? 'Blog Post Not Found' : 'Error Loading Blog Post'}
          </h1>
          <p className="text-gray-600">
            {type === 'not-found' 
              ? "The blog post you're looking for doesn't exist or has been removed."
              : "There was an error loading this blog post. Please try again later."}
          </p>
          {error && (
            <p className="text-sm text-red-600 mt-2">
              Error details: {error.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};