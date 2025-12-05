import { Button } from "@/components/ui/button";

interface BlogPostErrorProps {
  type: 'error' | 'not-found' | 'server-error';
  error?: Error;
}

export const BlogPostError = ({ type, error }: BlogPostErrorProps) => {
  const getErrorMessage = () => {
    switch(type) {
      case 'not-found':
        return {
          title: 'Blog Post Not Found',
          description: "The blog post you're looking for doesn't exist or has been removed.",
          showRetry: false
        };
      case 'server-error':
        return {
          title: 'Temporary Server Error',
          description: "We're experiencing high traffic. Please try refreshing the page.",
          showRetry: true
        };
      default:
        return {
          title: 'Error Loading Blog Post',
          description: "There was an error loading this blog post. Please try again later.",
          showRetry: true
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            {errorInfo.title}
          </h1>
          <p className="text-muted-foreground">
            {errorInfo.description}
          </p>
          {errorInfo.showRetry && (
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          )}
          {error && process.env.NODE_ENV === 'development' && (
            <p className="text-sm text-destructive mt-2">
              Error details: {error.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};