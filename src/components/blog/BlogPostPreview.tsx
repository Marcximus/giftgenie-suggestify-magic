import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <article className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
          {data.title}
        </h1>

        {data.image_url && (
          <div className="flex justify-center my-2 sm:my-3">
            <img
              src={data.image_url}
              alt={data.image_alt_text || data.title}
              className="rounded-lg shadow-md w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[500px] object-cover"
            />
          </div>
        )}
        
        {data.excerpt && (
          <p className="text-sm md:text-base text-muted-foreground mb-4">
            {data.excerpt}
          </p>
        )}
        
        <div 
          className="mt-4 space-y-2 sm:space-y-3 text-left w-full
                     prose-sm md:prose-base lg:prose-lg
                     prose-h2:text-lg sm:prose-h2:text-xl md:prose-h2:text-2xl
                     prose-h2:font-bold prose-h2:mt-4 prose-h2:mb-2
                     
                     prose-h3:text-base sm:prose-h3:text-lg md:prose-h3:text-xl
                     prose-h3:font-semibold prose-h3:mt-3 prose-h3:mb-2
                     
                     prose-p:text-sm md:prose-p:text-base
                     prose-p:leading-relaxed prose-p:mb-2
                     
                     prose-ul:list-disc prose-ul:pl-4 sm:prose-ul:pl-6 prose-ul:mb-2
                     prose-ol:list-decimal prose-ol:pl-4 sm:prose-ol:pl-6 prose-ol:mb-2
                     
                     prose-img:w-full prose-img:max-w-[300px] sm:prose-img:max-w-[400px] lg:prose-img:max-w-[500px]
                     prose-img:h-auto prose-img:aspect-square prose-img:object-contain
                     prose-img:mx-auto prose-img:my-2 sm:prose-img:my-3
                     prose-img:rounded-lg prose-img:shadow-md"
          dangerouslySetInnerHTML={{ 
            __html: data.content.replace(/```html\n?|\n?```/g, '') 
          }}
        />
        
        {data.author && (
          <div className="mt-4 sm:mt-6 text-sm md:text-base text-muted-foreground">
            Written by {data.author}
            {data.published_at && (
              <span> · {new Date(data.published_at).toLocaleDateString()}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
};