import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <article className="w-full">
      {data.image_url && (
        <div className="flex justify-center my-2 sm:my-3">
          <img
            src={data.image_url}
            alt={data.title}
            className="rounded-lg shadow-md w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[600px] object-cover"
          />
        </div>
      )}
      {data.excerpt && (
        <p className="text-left text-sm sm:text-base text-muted-foreground mb-4">{data.excerpt}</p>
      )}
      <div 
        className="mt-4 space-y-3 sm:space-y-4 text-left w-full
                   [&>h1]:text-base [&>h1]:sm:text-lg [&>h1]:lg:text-2xl [&>h1]:font-bold [&>h1]:mb-4 
                   [&>h2]:text-base [&>h2]:sm:text-lg [&>h2]:lg:text-xl [&>h2]:font-semibold [&>h2]:mt-6 [&>h2]:mb-3
                   [&>p]:text-sm [&>p]:sm:text-base [&>p]:leading-relaxed [&>p]:mb-2
                   [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:sm:pl-6 [&>ul]:mb-2 [&>ul]:space-y-1
                   [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:sm:pl-6 [&>ol]:mb-2 [&>ol]:space-y-1
                   [&>img]:w-full [&>img]:max-w-[400px] [&>img]:sm:max-w-[500px] [&>img]:lg:max-w-[600px]
                   [&>img]:h-auto [&>img]:aspect-square
                   [&>img]:object-contain [&>img]:mx-auto [&>img]:my-2 [&>img]:sm:my-3
                   [&>img]:rounded-lg [&>img]:shadow-md
                   [&>a]:block [&>a]:mt-2 [&>a]:sm:mt-3 [&>a]:text-primary [&>a]:hover:underline"
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