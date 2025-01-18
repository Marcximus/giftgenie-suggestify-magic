import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { BlogPostFormData } from "./types/BlogPostTypes";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_AUTHOR = "Get The Gift Team";

interface BlogPostFormProps {
  onSubmit: (data: BlogPostFormData) => Promise<void>;
  initialData?: BlogPostFormData;
  initialTitle?: string;
}

export const BlogPostForm = ({ onSubmit, initialData, initialTitle }: BlogPostFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<BlogPostFormData>({
    defaultValues: initialData || ({
      title: initialTitle || "",
      slug: "",
      content: "",
      excerpt: null,
      meta_title: null,
      meta_description: null,
      meta_keywords: null,
      image_url: null,
      published_at: null,
      images: [],
      affiliate_links: [],
      image_alt_text: "",
      related_posts: [],
      author: DEFAULT_AUTHOR, // Set default author
    }),
  });

  // Ensure author is always set to DEFAULT_AUTHOR
  useEffect(() => {
    form.setValue('author', DEFAULT_AUTHOR, {
      shouldValidate: true,
      shouldDirty: false
    });
  }, [form]);

  const onSubmitHandler = async (data: BlogPostFormData) => {
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Blog post saved successfully!",
      });
    } catch (error) {
      console.error("Error saving blog post:", error);
      toast({
        title: "Error",
        description: "Failed to save blog post. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form} onSubmit={form.handleSubmit(onSubmitHandler)}>
      <BlogPostBasicInfo form={form} />
      <BlogPostContent form={form} handleAIGenerate={onSubmit} />
      <BlogPostSEO form={form} />
      <Button type="submit">Save Blog Post</Button>
    </Form>
  );
};
