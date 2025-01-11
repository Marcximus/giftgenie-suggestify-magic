import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar, User, Clock } from "lucide-react";
import { Helmet } from "react-helmet";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      
      if (error) throw error;
      return data as Tables<"blog_posts">;
    },
  });

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Loading... - Get The Gift Blog</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Helmet>
          <title>Post Not Found - Get The Gift Blog</title>
          <meta name="description" content="The blog post you're looking for could not be found." />
        </Helmet>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <Button onClick={() => navigate("/blog")} variant="default">
            <ChevronLeft className="mr-2 h-4 w-4" />
            More Ideas
          </Button>
        </div>
      </>
    );
  }

  // Process affiliate links if they exist
  const affiliateLinks = post.affiliate_links as Array<{
    productTitle: string;
    affiliateLink: string;
    imageUrl?: string;
  }> || [];

  // Function to replace product placeholders with actual affiliate content
  const processContent = (content: string) => {
    let processedContent = content;
    
    affiliateLinks.forEach((link, index) => {
      const placeholder = `[PRODUCT_PLACEHOLDER]`;
      const productSection = `
        <div class="product-section my-8 p-6 bg-white rounded-lg shadow-md">
          <h3 class="text-xl font-bold mb-4">No. ${index + 1}: ${link.productTitle}</h3>
          ${link.imageUrl ? `
            <div class="flex justify-center mb-4">
              <img 
                src="${link.imageUrl}" 
                alt="${link.productTitle}"
                class="w-36 h-36 object-contain rounded-lg"
              />
            </div>
          ` : ''}
          <div class="mt-4">
            <a 
              href="${link.affiliateLink}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block bg-[#F97316] hover:bg-[#F97316]/90 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              View on Amazon
            </a>
          </div>
        </div>
      `;
      
      processedContent = processedContent.replace(placeholder, productSection);
    });
    
    return processedContent;
  };

  return (
    <>
      <Helmet>
        <title>{post.title} - Get The Gift Blog</title>
        <meta name="description" content={post.excerpt || `Read ${post.title} on Get The Gift Blog`} />
        <meta property="og:title" content={`${post.title} - Get The Gift Blog`} />
        <meta property="og:description" content={post.excerpt || `Read ${post.title} on Get The Gift Blog`} />
        {post.image_url && <meta property="og:image" content={post.image_url} />}
        <meta name="author" content={post.author} />
        <meta property="article:published_time" content={post.published_at || ""} />
      </Helmet>

      <article className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button 
            onClick={() => navigate("/blog")} 
            variant="ghost" 
            className="mb-8 hover:bg-primary/10"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            More Ideas
          </Button>
          
          {post.image_url && (
            <div className="aspect-[21/9] relative overflow-hidden rounded-lg mb-8 shadow-xl">
              <img 
                src={post.image_url} 
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            {post.author && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
            )}
            {post.published_at && (
              <>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(post.published_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(post.published_at).toLocaleTimeString()}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="prose prose-lg max-w-none">
            <div 
              className="space-y-6 text-left [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4
                         [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
                         [&>p]:text-base [&>p]:leading-relaxed [&>p]:mb-4
                         [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
                         [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2"
              dangerouslySetInnerHTML={{ 
                __html: processContent(post.content)
              }}
            />
          </div>
        </div>
      </article>
    </>
  );
};

export default BlogPost;