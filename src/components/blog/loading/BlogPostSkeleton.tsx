import { Helmet } from "react-helmet";

export const BlogPostSkeleton = () => {
  return (
    <>
      <Helmet>
        <title>Loading... - Get The Gift Blog</title>
        <meta name="description" content="Loading blog post content..." />
      </Helmet>
      <div className="container mx-auto px-2 sm:px-4 py-8 max-w-4xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    </>
  );
};