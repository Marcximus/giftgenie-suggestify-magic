import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { BlogPostFormData } from "./types/BlogPostTypes";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_AUTHOR = "Get The Gift Team";

interface BlogPostFormProps {
  onSubmit: (data: BlogPostFormData) => Promise<void>;
  initialData?: BlogPostFormData;
  initialTitle?: string;
}

export const BlogPostForm = ({ onSubmit, initialData, initialTitle }: BlogPostFormProps) => {
  const { toast } = useToast();
  
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const form = useForm<BlogPostFormData>({
    defaultValues: initialData || ({
      title: initialTitle || "",
      slug: initialTitle ? generateSlug(initialTitle) : "", // Generate slug from initial title
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
      author: DEFAULT_AUTHOR,
    }),
  });

  // Ensure author is always set to DEFAULT_AUTHOR
  useEffect(() => {
    form.setValue('author', DEFAULT_AUTHOR, {
      shouldValidate: true,
      shouldDirty: false
    });
  }, [form]);

  const handleAIGenerate = async (type: 'excerpt' | 'seo-title' | 'seo-description' | 'seo-keywords' | 'improve-content') => {
    try {
      // Implementation of AI generation logic
      console.log("Generating content for:", type);
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    }
  };

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8">
        <BlogPostBasicInfo 
          form={form} 
          generateSlug={generateSlug} 
          initialData={initialData}
        />
        <BlogPostContent 
          form={form} 
          handleAIGenerate={handleAIGenerate}
        />
        <BlogPostSEO 
          form={form} 
          handleAIGenerate={handleAIGenerate}
        />
        <Button type="submit">Save Blog Post</Button>
      </form>
    </Form>
  );
};

export default BlogPostForm;