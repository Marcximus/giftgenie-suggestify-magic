import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <article className="prose prose-sm md:prose-base max-w-none">
      <h1 className="text-left text-2xl md:text-3xl lg:text-4xl font-bold mb-8">{data.title}</h1>
      {data.image_url && (
        <div className="flex justify-center my-4">
          <img
            src={data.image_url}
            alt={data.title}
            className="rounded-lg shadow-md w-64 md:w-72 object-cover"
          />
        </div>
      )}
      {data.excerpt && (
        <p className="text-left text-sm md:text-base text-muted-foreground mb-8">{data.excerpt}</p>
      )}
      <div 
        className="mt-8"
        dangerouslySetInnerHTML={{ 
          __html: data.content.replace(/```html\n?|\n?```/g, '') 
        }}
      />
      {data.author && (
        <div className="mt-8 text-left text-sm md:text-base text-muted-foreground">
          Written by {data.author}
          {data.published_at && (
            <span> · {new Date(data.published_at).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </article>
  );
};