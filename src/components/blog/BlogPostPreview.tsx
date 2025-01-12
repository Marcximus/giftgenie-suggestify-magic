import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <article className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
      {data.image_url && (
        <div className="flex justify-center my-3 sm:my-4">
          <img
            src={data.image_url}
            alt={data.title}
            className="rounded-lg shadow-md w-36 sm:w-48 md:w-56 object-cover"
          />
        </div>
      )}
      {data.excerpt && (
        <p className="text-left text-sm sm:text-base text-muted-foreground mb-4 sm:mb-8">{data.excerpt}</p>
      )}
      <div 
        className="mt-4 sm:mt-8 space-y-4 sm:space-y-6 text-left 
                   [&>h2]:text-lg [&>h2]:sm:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 
                   [&>h3]:text-base [&>h3]:sm:text-lg [&>h3]:md:text-xl [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2
                   [&>p]:text-sm [&>p]:sm:text-base [&>p]:leading-relaxed [&>p]:mb-3
                   [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:sm:pl-6 [&>ul]:mb-3 [&>ul]:space-y-1 [&>ul]:sm:space-y-2
                   [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:sm:pl-6 [&>ol]:mb-3 [&>ol]:space-y-1 [&>ol]:sm:space-y-2
                   [&_img]:!w-20 [&_img]:!sm:w-24 [&_img]:!md:w-28 [&_img]:!h-20 [&_img]:!sm:h-24 [&_img]:!md:h-28 
                   [&_img]:!object-contain [&_img]:mx-auto [&_img]:my-3 [&_img]:sm:my-4
                   [&_a]:block [&_a]:mt-3 [&_a]:sm:mt-4 [&_a]:text-primary [&_a]:hover:underline"
        dangerouslySetInnerHTML={{ 
          __html: data.content.replace(/```html\n?|\n?```/g, '') 
        }}
      />
      {data.author && (
        <div className="mt-6 sm:mt-8 text-left text-sm sm:text-base text-muted-foreground">
          Written by {data.author}
          {data.published_at && (
            <span> · {new Date(data.published_at).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </article>
  );
};