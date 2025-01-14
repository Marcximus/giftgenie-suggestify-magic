import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <article className="w-full">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
        {data.title}
      </h1>

      {data.image_url && (
        <div className="flex justify-center my-2 sm:my-3">
          <img
            src={data.image_url}
            alt={data.image_alt_text || data.title}
            className="rounded-lg shadow-md w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[600px] object-cover"
          />
        </div>
      )}
      {data.excerpt && (
        <p className="text-left text-sm sm:text-base text-muted-foreground mb-4">{data.excerpt}</p>
      )}
      <div 
        className="mt-4 space-y-3 sm:space-y-4 text-left w-full
                   [&>h2]:text-lg [&>h2]:sm:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:mt-4 [&>h2]:mb-2 
                   [&>h3]:text-base [&>h3]:sm:text-lg [&>h3]:md:text-xl [&>h3]:font-semibold [&>h3]:mt-3 [&>h3]:mb-2
                   [&>p]:text-sm [&>p]:sm:text-base [&>p]:leading-relaxed [&>p]:mb-2
                   [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:sm:pl-6 [&>ul]:mb-2 [&>ul]:space-y-1
                   [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:sm:pl-6 [&>ol]:mb-2 [&>ol]:space-y-1
                   [&_img]:w-full [&_img]:max-w-[400px] [&_img]:sm:max-w-[500px] [&_img]:lg:max-w-[600px]
                   [&_img]:h-auto [&_img]:aspect-square
                   [&_img]:object-contain [&_img]:mx-auto [&_img]:my-2 [&_img]:sm:my-3
                   [&_img]:rounded-lg [&_img]:shadow-md
                   [&_a]:block [&_a]:mt-2 [&_a]:sm:mt-3 [&_a]:text-primary [&_a]:hover:underline"
        dangerouslySetInnerHTML={{ 
          __html: data.content.replace(/```html\n?|\n?```/g, '') 
        }}
      />
      {data.author && (
        <div className="mt-4 sm:mt-6 text-left text-sm sm:text-base text-muted-foreground">
          Written by {data.author}
          {data.published_at && (
            <span> · {new Date(data.published_at).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </article>
  );
};