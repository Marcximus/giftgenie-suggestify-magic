import { Tables } from "@/integrations/supabase/types";

type BlogPostFormData = Omit<Tables<"blog_posts">, "id" | "created_at" | "updated_at">;

interface BlogPostPreviewProps {
  data: BlogPostFormData;
}

export const BlogPostPreview = ({ data }: BlogPostPreviewProps) => {
  return (
    <div className="prose max-w-none">
      <h1>{data.title}</h1>
      {data.image_url && (
        <img
          src={data.image_url}
          alt={data.title}
          className="rounded-lg"
        />
      )}
      <p className="text-muted-foreground">{data.excerpt}</p>
      <div>{data.content}</div>
    </div>
  );
};