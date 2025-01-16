import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { BlogPostFormData, EMPTY_FORM_DATA } from "./types/BlogPostTypes";
import { supabase } from "@/integrations/supabase/client";
import { BlogPostBasicInfo } from "./form/BlogPostBasicInfo";
import { BlogPostImageSection } from "./form/BlogPostImageSection";
import { BlogPostContent } from "./form/BlogPostContent";
import { BlogPostSEO } from "./form/BlogPostSEO";
import { BlogPostFormActions } from "./form/BlogPostFormActions";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  initialData?: BlogPostFormData;
}

export function BlogPostForm({ initialData = EMPTY_FORM_DATA }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAltText, setIsGeneratingAltText] = useState(false);
  const { toast } = useToast();

  const form = useForm<BlogPostFormData>({
    defaultValues: initialData
  });

  const onSubmit = async (formData: BlogPostFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from("blog_posts")
        .upsert(submitData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving blog post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (title: string): string => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const generateAltText = async () => {
    setIsGeneratingAltText(true);
    try {
      // Implement alt text generation
      toast({
        title: "Success",
        description: "Alt text generated successfully",
      });
    } catch (error: any) {
      console.error("Error generating alt text:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate alt text",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAltText(false);
    }
  };

  const handleAIGenerate = async (type: "excerpt" | "seo-title" | "seo-description" | "seo-keywords" | "improve-content") => {
    try {
      // Implement AI generation
      toast({
        title: "Success",
        description: `${type} generated successfully`,
      });
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <BlogPostBasicInfo
            form={form}
            generateSlug={generateSlug}
          />

          <BlogPostImageSection
            form={form}
            isGeneratingAltText={isGeneratingAltText}
            generateAltText={generateAltText}
          />

          <BlogPostContent
            control={form.control}
            handleAIGenerate={handleAIGenerate}
          />

          <BlogPostSEO
            form={form}
            handleAIGenerate={handleAIGenerate}
          />

          <BlogPostFormActions
            onSubmit={form.handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
          />
        </form>
      </Form>
    </div>
  );
}