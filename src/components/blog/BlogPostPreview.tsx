import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <article className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
      <h1 className="text-left text-2xl md:text-3xl lg:text-4xl font-bold mb-8">{data.title}</h1>
      
      {data.image_url && (
        <div className="flex justify-center my-6">
          <img
            src={data.image_url}
            alt={data.title}
            className="rounded-lg shadow-md w-48 md:w-56 lg:w-64 object-cover"
          />
        </div>
      )}
      
      {data.excerpt && (
        <p className="text-left text-base md:text-lg text-muted-foreground mb-8 leading-relaxed">
          {data.excerpt}
        </p>
      )}
      
      <div 
        className="mt-8 space-y-6 [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-semibold [&>h2]:mt-8 [&>h2]:mb-4
                   [&>p]:text-base [&>p]:md:text-lg [&>p]:leading-relaxed [&>p]:text-left
                   [&>img]:w-36 [&>img]:md:w-40 [&>img]:mx-auto [&>img]:my-4 [&>img]:rounded-lg [&>img]:shadow-md
                   [&>.product-info]:bg-muted/30 [&>.product-info]:p-4 [&>.product-info]:rounded-lg [&>.product-info]:my-4
                   [&>.product-info]:text-sm [&>.product-info]:md:text-base"
        dangerouslySetInnerHTML={{ 
          __html: data.content.replace(/```html\n?|\n?```/g, '') 
        }}
      />
      
      {data.author && (
        <div className="mt-12 pt-6 border-t border-border">
          <div className="text-left text-sm md:text-base text-muted-foreground">
            Written by {data.author}
            {data.published_at && (
              <span> · {new Date(data.published_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}
    </article>
  );
};