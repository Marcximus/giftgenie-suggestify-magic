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
        <div className="flex justify-center my-4">
          <img
            src={data.image_url}
            alt={data.title}
            className="rounded-lg shadow-md w-32 md:w-40 object-cover"
          />
        </div>
      )}
      {data.excerpt && (
        <p className="text-left text-sm md:text-base text-muted-foreground mb-8">{data.excerpt}</p>
      )}
      <div 
        className="mt-8 space-y-6 text-left [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:mt-8 [&>h2]:mb-4 
                   [&>h3]:text-lg [&>h3]:md:text-xl [&>h3]:font-semibold [&>h3]:mt-6 [&>h3]:mb-3
                   [&>p]:text-sm [&>p]:md:text-base [&>p]:leading-relaxed [&>p]:mb-4
                   [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul]:space-y-2
                   [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>ol]:space-y-2
                   [&_img]:w-24 [&_img]:h-24 [&_img]:object-contain [&_img]:mx-auto [&_img]:my-4
                   [&_a]:text-primary [&_a]:hover:underline
                   [&_div.flex]:justify-center [&_div.flex]:my-4"
        dangerouslySetInnerHTML={{ 
          __html: data.content 
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