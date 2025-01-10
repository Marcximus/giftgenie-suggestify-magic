import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <article className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
      <h1>{data.title}</h1>
      {data.image_url && (
        <img
          src={data.image_url}
          alt={data.title}
          className="rounded-lg w-full h-auto object-cover"
        />
      )}
      {data.excerpt && (
        <p className="lead text-muted-foreground">{data.excerpt}</p>
      )}
      <div className="mt-8">{data.content}</div>
      {data.author && (
        <div className="mt-8 text-muted-foreground">
          Written by {data.author}
          {data.published_at && (
            <span> · {new Date(data.published_at).toLocaleDateString()}</span>
          )}
        </div>
      )}
    </article>
  );
};