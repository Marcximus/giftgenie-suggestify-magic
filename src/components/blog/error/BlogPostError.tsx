import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";

interface BlogPostErrorProps {
  type: 'not-found' | 'error';
  error?: Error;
}

export const BlogPostError = ({ type, error }: BlogPostErrorProps) => {
  const navigate = useNavigate();

  const content = {
    'not-found': {
      title: 'Post Not Found',
      description: 'The blog post you\'re looking for could not be found.',
      metaDescription: 'The blog post you\'re looking for could not be found.'
    },
    'error': {
      title: 'Error loading blog post',
      description: 'There was an error loading this blog post. Please try again later.',
      metaDescription: 'An error occurred while loading the blog post.'
    }
  }[type];

  return (
    <>
      <Helmet>
        <title>{content.title} - Get The Gift Blog</title>
        <meta name="description" content={content.metaDescription} />
      </Helmet>
      <div className="container mx-auto px-2 sm:px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">{content.title}</h1>
        <p className="text-red-500 mb-4">{content.description}</p>
        <Button onClick={() => navigate("/blog")} variant="default">
          <ChevronLeft className="mr-2 h-4 w-4" />
          More Ideas
        </Button>
      </div>
    </>
  );
};