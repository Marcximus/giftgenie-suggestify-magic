import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RelatedPostsProps {
  relatedPosts: Array<{ title: string; slug: string; }>;
}

export const RelatedPosts = ({ relatedPosts }: RelatedPostsProps) => {
  const navigate = useNavigate();

  if (!relatedPosts?.length) return null;

  return (
    <div className="mt-12 pt-8 border-t border-primary/10 mb-20">
      <h2 className="text-2xl font-bold mb-6 animate-pulse-text bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient">
        More Gift Ideas
      </h2>
      <div className="grid gap-3">
        {relatedPosts.map((relatedPost) => (
          <div 
            key={relatedPost.slug}
            className="group relative overflow-hidden rounded-md bg-gradient-to-r from-background to-muted/30 border border-primary/5 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Button
              variant="ghost"
              className="w-full text-left py-2.5 px-4 hover:bg-primary/5"
              onClick={() => navigate(`/blog/post/${relatedPost.slug}`)}
            >
              <h3 className="font-medium text-base group-hover:text-primary transition-colors line-clamp-1">
                {relatedPost.title}
              </h3>
            </Button>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-3.5 h-3.5 rotate-180 text-primary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};